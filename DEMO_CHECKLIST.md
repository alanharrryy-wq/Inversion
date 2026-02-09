# Demo Checklist

1. Deterministic demo path: set `DEMO_TEST_MODE=true` in `.env.local`.
2. Verify-only operator (default): `npm run operator`.
3. If servers are down, operator should print: `Servers not running. Run npm run dev or rerun operator with -Start.`
4. Start + verify in one command: `powershell -ExecutionPolicy Bypass -File .\scripts\demo-operator.ps1 -Mode stub -Start`.
5. Keep processes intentionally: add `-KeepAlive`.
6. Default behavior after `-Start`: automatic cleanup via tracked PIDs.
7. Smoke wrapper command: `npm run verify:smoke`.
8. PASS means `typecheck`, `build`, and `verify:demo` succeeded.
9. FAIL means at least one verify check failed or backend/frontend was unreachable.
10. Operator writes logs to `.run/demo-operator-<timestamp>.log`.
11. Verify scripts write JSON artifacts in `.run/verify-demo-<timestamp>.json` and `.run/verify-ai-<timestamp>.json`.
12. PID state is tracked in `.run/demo-operator.pids.json` during active runs.
