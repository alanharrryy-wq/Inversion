import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.join(ROOT, "screenshots");
const SLIDE_COUNT = 20;

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Server not ready: ${url}`);
}

function startVite() {
  const env = {
    ...process.env,
    VITE_WOW_DEMO: "0",
    VITE_WOW_MIRROR: "0",
    VITE_WOW_REVEAL: "0",
    VITE_WOW_XRAY: "0",
    VITE_WOW_OVERLAY: "0",
  };
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`], {
          cwd: ROOT,
          stdio: "pipe",
          env,
        })
      : spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
          cwd: ROOT,
          stdio: "pipe",
          env,
        });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopProcess(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
  } else {
    child.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!child.killed) child.kill("SIGKILL");
  }
}

async function capture() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const server = startVite();
  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="deck-root"]', { timeout: 10000 });
    await page.click('[data-testid="deck-root"]');

    for (let i = 0; i < SLIDE_COUNT; i += 1) {
      const fname = `${String(i).padStart(2, "0")}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, fname), type: "png" });
      if (i < SLIDE_COUNT - 1) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(300);
      }
    }

    await browser.close();
  } finally {
    await stopProcess(server);
  }
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
