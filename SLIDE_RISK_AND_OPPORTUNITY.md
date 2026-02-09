# SLIDE_RISK_AND_OPPORTUNITY

## Top 3 Highest Code Complexity

1. **Slide09** (`components/slides/Slide09.tsx`)
- Why: largest interaction graph (many hooks/listeners/timers/RAF), layer engine, overlays, and dense inline style orchestration.
- Risk implication: regression risk is high from small visual/state changes.

2. **Slide04** (`components/slides/Slide04.tsx`)
- Why: multi-mode interaction system (hover/lock/tooltips/keyboard/overlay/toasts/proximity glow).
- Risk implication: easy to accidentally break one interaction path while polishing another.

3. **Slide16** (`components/slides/Slide16.tsx`)
- Why: monolithic file with many local components, modes, overlays, and event surfaces.
- Risk implication: high blast radius; requires surgical, isolated edits only.

## Top 3 Highest Narrative Importance

1. **Slide00** (`components/slides/Slide00.tsx`)
- Why: defines first impression and credibility frame in the first seconds.

2. **Slide04** (`components/slides/Slide04.tsx`)
- Why: strongest “proof over opinion” argument; likely the trust inflection point.

3. **Slide11 / component Slide12** (`components/slides/Slide12.tsx`)
- Why: explains the core model mechanics investors need to believe execution and moat.

## Top 3 Highest WOW Potential

1. **Slide00** (`components/slides/Slide00.tsx`)
- Why: cinematic opening with existing glass/light primitives can create premium impact safely.

2. **Slide04** (`components/slides/Slide04.tsx`)
- Why: interaction richness already exists; small polish yields large perceived sophistication.

3. **Slide11 / component Slide12** (`components/slides/Slide12.tsx`)
- Why: card-based product model is perfect for “feels like real software” moments.

## Practical Targeting Guidance
- **Best ROI for safe polish:** Slide00 + Slide12 + selected micro-polish in Slide04.
- **Most dangerous to touch without strict guardrails:** Slide09 and Slide16.
- **Narrative sequence to protect:** Slide00 -> Slide04 -> Slide11 (Slide12 component) -> Slide15/16.
