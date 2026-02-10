import fs from 'node:fs';
import path from 'node:path';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8787';
const CHECK_MESSAGE = 'Ping. Reply with only: PONG';
const COMMON_PORTS = [...Array(11)].map((_, i) => 3000 + i).concat([...Array(8)].map((_, i) => 5173 + i));
const RUN_DIR = path.resolve('.run');
const TS = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_FILE = path.join(RUN_DIR, `verify-demo-${TS}.json`);

function result(name, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[verify:demo] ${status} ${name}${detail ? ` :: ${detail}` : ''}`);
  return { name, ok, detail };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function detectVitePort() {
  const envPort = process.env.VITE_PORT || process.env.FRONTEND_PORT;
  const candidates = envPort ? [Number(envPort)] : COMMON_PORTS;

  for (const port of candidates) {
    if (!Number.isFinite(port)) continue;
    try {
      const probe = await fetchWithTimeout(`http://127.0.0.1:${port}/api/health`, {}, 2000);
      const body = await safeJson(probe);
      if (probe.status === 200 && body && typeof body.ok === 'boolean' && typeof body.aiConfigured === 'boolean' && typeof body.demoTestMode === 'boolean') {
        return port;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function postAi(url) {
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'chat', message: CHECK_MESSAGE }),
  });
  const body = await safeJson(res);
  return { status: res.status, body };
}

(async () => {
  const checks = [];
  const summary = {
    mode: 'demo',
    backendBase: BACKEND_BASE,
    vitePort: null,
    health: null,
    direct: null,
    proxy: null,
    allPassed: false,
  };

  try {
    const healthRes = await fetchWithTimeout(`${BACKEND_BASE}/api/health`);
    const healthBody = await safeJson(healthRes);
    summary.health = { status: healthRes.status, body: healthBody };

    checks.push(result('health_status_200', healthRes.status === 200, `status=${healthRes.status}`));
    checks.push(result('health_demo_mode_true', Boolean(healthBody?.demoTestMode) === true, `demoTestMode=${String(healthBody?.demoTestMode)}`));

    const vitePort = await detectVitePort();
    summary.vitePort = vitePort;
    checks.push(result('vite_port_detected', vitePort !== null, vitePort === null ? 'none' : `port=${vitePort}`));

    const direct = await postAi(`${BACKEND_BASE}/api/ai`);
    summary.direct = direct;
    checks.push(result('direct_status_200', direct.status === 200, `status=${direct.status}`));
    checks.push(result('direct_text_present', typeof direct.body?.text === 'string' && direct.body.text.length > 0));

    if (vitePort !== null) {
      const proxy = await postAi(`http://127.0.0.1:${vitePort}/api/ai`);
      summary.proxy = proxy;
      checks.push(result('proxy_status_200', proxy.status === 200, `status=${proxy.status}`));
      checks.push(result('proxy_text_present', typeof proxy.body?.text === 'string' && proxy.body.text.length > 0));
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('Operator: backend unreachable. Start servers with npm run dev or rerun operator with -Start.');
    checks.push(result('runtime_exception', false, msg));
  }

  summary.allPassed = checks.every((c) => c.ok);
  summary.checks = checks;
  fs.mkdirSync(RUN_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`[verify:demo] wrote ${OUT_FILE}`);
  console.log(`SUMMARY_JSON=${JSON.stringify(summary)}`);

  process.exitCode = summary.allPassed ? 0 : 1;
})();
