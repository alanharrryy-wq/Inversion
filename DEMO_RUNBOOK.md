# DEMO_RUNBOOK

## Run the deck
1. Install deps (if needed):
   - `npm install`
2. Run local demo stack:
   - `npm run dev`
3. Open client URL shown by Vite.

## WOW mode flags (.env.local)
```env
VITE_WOW_DEMO=1
VITE_WOW_OPENING_IMPACT=1
VITE_WOW_EVIDENCE_IMPACT=1
VITE_WOW_MODEL_IMPACT=1
VITE_WOW_OPENING_CINEMA=1
VITE_WOW_PROOF_LOCK=1
VITE_WOW_CORE_MODULES=1
VITE_WOW_AI_MOMENT=1
VITE_WOW_CASE_REVEAL=1
VITE_WOW_DEMO_SCRIPT=1
VITE_WOW_TOUR=1
VITE_WOW_TOUR_SCRIPT=enterprise

# Optional existing WOW controls
VITE_WOW_MIRROR=1
VITE_WOW_REVEAL=1
VITE_WOW_XRAY=1
VITE_WOW_OVERLAY=1
```

## WOW ON Playbook
1. Preflight checklist
   - Confirm `VITE_WOW_DEMO=1` and all desired feature flags enabled.
   - Confirm AI backend is running locally (`npm run dev` starts both server and client).
   - Confirm motion safety by toggling OS reduced-motion once before the demo.
2. Narrative choreography
   - Slide 00: pause for 3-beat cinema reveal, then state investment thesis in one sentence.
   - Slide 04: trigger proof lock visuals; then open AIChat and ask one defensibility question.
   - Slide 17: activate case reveal framing, then open evidence modal and summarize measurable outcomes.
   - Closing: use operator script overlay questions to convert technical signal into investor language.
3. Determinism rules during live run
   - Do not use random external prompts for first pass; use fixture-backed prompts in AIChat.
   - Keep mode selector stable (chat/think) for reproducible response shape.
   - Avoid ad-hoc keyboard shortcuts outside existing authority (`F1-F4` + slide nav).

## WOW Checklist (operator)
- `WOW_DEMO` on/off kill switch verified.
- `WOW_DEMO_SCRIPT` overlay visible and non-interactive.
- `WOW_CASE_REVEAL` active only when `WOW_DEMO=1`.
- AIChat fixture buttons visible only in WOW demo mode.
- Slide navigation still controlled only in `App.tsx` key handler.
- No rendering of raw HTML in AI responses.

## Investor Tour Mode (WOW Wave 2)
1. Enable:
   - `VITE_WOW_DEMO=1`
   - `VITE_WOW_TOUR=1`
   - `VITE_WOW_TOUR_SCRIPT=enterprise`
2. Start tour:
   - Click `Start Tour` in the launch chip (bottom-right).
3. Tour controls:
   - Click-only `Back / Next / Skip`.
   - `Next` unlocks when deterministic completion rules are met.
4. Recommended presentation style:
   - Read each coach instruction briefly, perform the exact interaction, then continue.
   - For AI moments, use `Paste question` to keep language consistent across demos.
5. Determinism notes:
   - Tour completion is event/slide-driven (`evidence:*`, `module:*`, `ai:*`, `slide:changed`).
   - No additional keyboard shortcuts are introduced in tour mode.

## Kill switch
```env
VITE_WOW_DEMO=0
```

## Suggested 3-minute investor flow
1. **Slide00 (0:00–0:35)**
   - Let opening settle for 3–4 seconds.
   - Speak to “evidence-first operations, not consulting vapor”.
2. **Slide04 (0:35–1:45)**
   - Hover Act II then Act III.
   - Lock a badge tooltip and copy evidence token to show defensibility.
   - Toggle Evidence Overlay once.
3. **Slide11 / Slide12 component (1:45–2:30)**
   - Open 2 core cards (e.g., ConditionScore + HealthRadar).
   - Show signal bars moving from standby to active.
4. **AI close (2:30–3:00)**
   - Open AI chat and ask two prompts below.

## AI prompts for live demo
1. `Given this deck, what is the fastest path to measurable risk reduction in 60 days?`
2. `What evidence would an industrial auditor ask for first, and how does HITECH provide it?`

## Validation commands
- `npm run typecheck`
- `npm run build`

## Artifacts generated in this block
- Slide intel JSON: `.run/slide-intel.json`
- Slide screenshots: `screenshots/*.png`
- Full intel report: `SLIDE_INTEL_REPORT.md`
