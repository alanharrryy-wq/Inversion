# TOUR SCRIPT — Enterprise Investor Demo

## Purpose
A deterministic guided investor tour that combines slide interactions and AI moments without keyboard shortcuts.

## Flags
```env
VITE_WOW_DEMO=1
VITE_WOW_TOUR=1
VITE_WOW_TOUR_SCRIPT=enterprise
```

## Script Flow
1. Slide00 context framing.
2. Slide04 badge hover (`evidence:hover`).
3. Slide04 badge lock (`evidence:locked`).
4. Slide04 evidence copy (`evidence:copied`).
5. AIChat first investor question (`ai:sent`).
6. AIChat first response (`ai:response`).
7. Slide12 module open (`module:opened`).
8. Slide12 module hover (`module:hover`).
9. AIChat KPI commitment question (`ai:sent` count 2).
10. Close on Slide17 (slide/event completion).

## Operator Notes
- The overlay controls are click-only: Back / Next / Skip.
- `Next` is blocked until the step completion rule is met, unless the step explicitly allows early continue.
- Use the overlay Paste question button (or chat-local Paste question button) for consistent wording.
- Reduced-motion systems disable ring pulse animation automatically.

## Expected Deterministic Events
- Slide changes emit `slide:changed` with `{ to }`.
- Slide04 emits evidence events from explicit user actions.
- Slide12 emits module events from card interactions.
- AIChat emits `ai:sent` on send and `ai:response` after model message append.
