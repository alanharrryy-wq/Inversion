# DEMO_RUNBOOK

## WOW Tour enablement
Use `.env.local` flags (all default OFF unless set):

```env
VITE_WOW_DEMO=1
VITE_WOW_TOUR=1
VITE_WOW_TOUR_SCRIPT=enterprise
VITE_WOW_TOUR_AUTOSTART=1
VITE_WOW_DIAGNOSTICS=0
VITE_WOW_SPOTLIGHT_V2=0
VITE_WOW_TOUR_CHOREO=0
VITE_WOW_TARGET_MAGNET=0
VITE_WOW_DIRECTOR_MODE=0

VITE_WOW_DEMO_SCRIPT=1
VITE_WOW_OPENING_IMPACT=1
VITE_WOW_EVIDENCE_IMPACT=1
VITE_WOW_MODEL_IMPACT=1
VITE_WOW_OPENING_CINEMA=1
VITE_WOW_PROOF_LOCK=1
VITE_WOW_CORE_MODULES=1
VITE_WOW_AI_MOMENT=1
VITE_WOW_CASE_REVEAL=1
```

## One-shot operator start
Run from repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wow-tour-demo.ps1
```

What it does:
1. Writes `.env.local` with WOW tour flags ON.
2. Starts `npm run dev`.
3. Probes `http://127.0.0.1:3000-3010`.
4. Opens browser automatically.
5. Cleans dev process on exit.

## Tour usage
1. If autostart is enabled and targets are mounted, the tour starts automatically.
2. If autostart fails, use the `Start Tour` button in the launch card.
3. Use click UI only: `Prev`, `Next`, `Skip`, `Restart`.
4. Optional premium path:
   - `VITE_WOW_SPOTLIGHT_V2=1`
   - `VITE_WOW_TOUR_CHOREO=1`
   - `VITE_WOW_TARGET_MAGNET=1`
   - `VITE_WOW_DIRECTOR_MODE=1`

## Troubleshoot: tour not visible
1. Confirm flags are resolved:
   - `VITE_WOW_DEMO=1`
   - `VITE_WOW_TOUR=1`
2. Enable diagnostics:
   - `VITE_WOW_DIAGNOSTICS=1`
3. Check diagnostics panel values:
   - `overlayZ` should be a very high z-index.
   - `targetExists` must be `true` for the active step.
   - `autostart` shows `started`, `retrying`, or failure reason.
4. If still hidden, inspect in devtools:
   - `.wow-tour` computed `z-index`, `opacity`, and `display`.

## Safety constraints
- Tour adds no new global keybinds.
- F1-F4 authority remains in `DeckRuntimeMode`.
- Slide navigation keyboard logic stays in `App.tsx`.
- AI chat rendering remains plain text only (no raw HTML injection).

## Validation
```bash
npm run typecheck
npm run build
```

## Interactive Guide Engine (Default OFF)
Enable only when demoing interactive guidance:

```powershell
$env:VITE_WOW_DEMO='1'
$env:VITE_WOW_GUIDE_ENGINE='1'
$env:VITE_WOW_TOUR='1'
$env:VITE_WOW_TOUR_POLISH='1'
$env:VITE_WOW_DIRECTOR_OVERLAY='1'
$env:VITE_WOW_SLIDE05_INTERACTIVE='1'
npm run dev
```

Validation:

```powershell
npm run wow:validate
npm run wow:audit
```
