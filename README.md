<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11ne8oK46eR-l_DiotWRBlScr3pzmsgqS

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optional: set `VITE_ENABLE_VOICE=true` in `.env.local` to expose voice UI state (default is disabled)
4. Optional: set `DEMO_TEST_MODE=true` in `.env.local` to force deterministic stub responses from `/api/gemini` (default is disabled)
5. Run the app:
   `npm run dev`
6. Open `http://localhost:3000`

## Demo verification

- Run full verification suite: `npm run verify`
- See quick operator checklist: [`DEMO_CHECKLIST.md`](DEMO_CHECKLIST.md)

## Demo operator

- Investor-safe deterministic mode (no external AI calls):
  - Set `DEMO_TEST_MODE=true` in `.env.local`
  - Run `npm run operator` for verify-only mode (default, no server spawn)
  - Or run `.\scripts\demo-operator.ps1 -Mode stub -Start` to start + verify
  - Run `npm run verify:demo`
- Real AI validation:
  - Set valid `GEMINI_API_KEY`
  - Set `DEMO_TEST_MODE=false` (or remove it)
  - Run `npm run verify:ai` or `.\scripts\demo-operator.ps1 -Mode real -Start`

Safety notes:
- Stub mode (`DEMO_TEST_MODE=true`) never calls external services.
- Backend logs only key presence/length, never key value.
- Frontend does not receive API secrets.
- Operator is verify-only by default.
- `-Start` starts dev servers and tracks PIDs in `.run/demo-operator.pids.json`.
- Cleanup is automatic unless `-KeepAlive` is explicitly set.

## Dev architecture

- Client: Vite on `:3000`
- Server: Express on `:8787`
- Frontend calls `/api/gemini` (proxied by Vite to `:8787`)
- Gemini API key is read server-side only from `GEMINI_API_KEY` in `.env.local`
- Voice mode is feature-flagged (`VITE_ENABLE_VOICE`) and defaults to disabled
- Demo stub mode is feature-flagged (`DEMO_TEST_MODE`) and defaults to disabled
