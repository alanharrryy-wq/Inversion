# WOW_OPPORTUNITY_MAP

All proposals below are strategy-only (no implementation in this phase).
Each WOW should be gated and default-OFF.

## 1) Cinematic Opening Thesis
- Target slide: **Slide00**
- Investor experience: controlled filmic light sweep, subtle grain, and staged statement lock-in in first 6 seconds.
- Why this is a “holy shit” moment: instantly feels like a premium product launch, not a generic slide deck.
- Flag: `VITE_WOW_OPENING_CINEMA=1`
- Risk level: **LOW** (isolated visual layer if done non-interactive).

## 2) Proof Lock Sequence
- Target slide: **Slide04**
- Investor experience: when focus locks, non-active acts dim smoothly and selected evidence badge enters “audit lock” state with confirmation pulse.
- Why this is a “holy shit” moment: creates visceral trust that evidence is structured and defensible.
- Flag: `VITE_WOW_PROOF_LOCK=1`
- Risk level: **MEDIUM** (already interaction-heavy slide).

## 3) Evidence Token Ceremony
- Target slide: **Slide04**
- Investor experience: copy action triggers a short “evidence committed” micro-sequence (visual only) without changing data paths.
- Why this is a “holy shit” moment: converts a button click into perceived enterprise-grade instrumentation.
- Flag: `VITE_WOW_EVIDENCE_TOKEN=1`
- Risk level: **MEDIUM**.

## 4) Product Cards as Live Modules
- Target slide: **Slide11 (component Slide12)**
- Investor experience: card hover/open feels like real software modules with live signal bars and staged reveal.
- Why this is a “holy shit” moment: abstract architecture becomes tangible operating product.
- Flag: `VITE_WOW_CORE_MODULES=1`
- Risk level: **LOW-MEDIUM**.

## 5) Executive KPI Snap Focus
- Target slide: **Slide12 (component Slide13)**
- Investor experience: selected KPI briefly enters spotlight with companion delta explanation ribbon.
- Why this is a “holy shit” moment: outcomes read as actionable control, not vanity metrics.
- Flag: `VITE_WOW_KPI_SPOTLIGHT=1`
- Risk level: **LOW**.

## 6) Decision Room Mode
- Target slide: **Slide15 (component Slide16)**
- Investor experience: investor/ops/audit mode switch transitions feel like an executive control room context switch.
- Why this is a “holy shit” moment: demonstrates decision-grade tooling for different stakeholders.
- Flag: `VITE_WOW_DECISION_ROOM=1`
- Risk level: **HIGH** (monolithic/high-risk file).

## 7) Case Proof Reveal
- Target slide: **Slide17**
- Investor experience: opening evidence modal starts with quick confidence timeline before showing assets.
- Why this is a “holy shit” moment: case study feels curated and deliberate.
- Flag: `VITE_WOW_CASE_REVEAL=1`
- Risk level: **LOW**.

## 8) AI Assist Moment (Global, not slide-local)
- Target location: global `AIChat` after Slide04 or Slide11
- Investor experience: “operator asks one hard question, AI reframes + answers with concise investor logic”.
- Why this is a “holy shit” moment: shows the deck is not static; intelligence layer feels alive.
- Flag: `VITE_WOW_AI_MOMENT=1`
- Risk level: **MEDIUM** (needs strict timing/script discipline in live demo).

## Recommended First Wave (safest impact)
1. Slide00 cinematic opening (`VITE_WOW_OPENING_CINEMA`)
2. Slide04 proof lock (`VITE_WOW_PROOF_LOCK`)
3. Slide11 core modules live feel (`VITE_WOW_CORE_MODULES`)
