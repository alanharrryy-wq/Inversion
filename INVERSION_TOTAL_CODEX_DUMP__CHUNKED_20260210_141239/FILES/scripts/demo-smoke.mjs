
import { spawn } from "node:child_process";
import process from "node:process";
import waitOn from "wait-on";

const APP_URL = process.env.DEMO_APP_URL || "http://127.0.0.1:3100";
const API_URL = process.env.DEMO_API_URL || "http://127.0.0.1:8789/api/ai";

function fail(message) {
  console.error(`[demo:smoke] FAIL: ${message}`);
  process.exit(1);
}

async function fetchJson(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { res, body };
  } finally {
    clearTimeout(t);
  }
}

function killTree(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    child.kill("SIGTERM");
  } catch {}
}

function start(command, env) {
  return spawn(command, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env,
  });
}

async function main() {
  const baseEnv = {
    ...process.env,
    DEMO_TEST_MODE: "true",
    VITE_ENABLE_VOICE: "false",
    PORT: "8789",
  };

  const server = start("npm run dev:server", baseEnv);
  const preview = start("npm run preview -- --host 127.0.0.1 --port 3100", baseEnv);

  server.stderr.on("data", (d) => process.stderr.write(String(d)));
  preview.stderr.on("data", (d) => process.stderr.write(String(d)));

  try {
    await waitOn({ resources: [APP_URL, "tcp:127.0.0.1:8789"], timeout: 40000 });

    const appRes = await fetch(APP_URL);
    if (appRes.status !== 200) fail(`GET / returned ${appRes.status}`);
    const html = await appRes.text();
    if (!html.includes("id=\"root\"")) fail("GET / missing root container");

    const ok = await fetchJson(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "chat", message: "demo ping" }),
    });
    if (ok.res.status !== 200) fail(`POST /api/ai expected 200, got ${ok.res.status}`);
    if (!ok.body || typeof ok.body.text !== "string" || ok.body.text.length === 0) {
      fail("POST /api/ai missing text payload");
    }

    const malformed = await fetchJson(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "chat" }),
    });
    if (malformed.res.status >= 500 || malformed.res.status < 400) {
      fail(`Malformed request expected 4xx, got ${malformed.res.status}`);
    }

    console.log("[demo:smoke] PASS");
  } catch (error) {
    fail(error instanceof Error ? error.message : "unknown error");
  } finally {
    killTree(server);
    killTree(preview);
  }
}

main();

