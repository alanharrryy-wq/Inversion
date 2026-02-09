# SLIDE_INTEL_REPORT

## Reading Lens
For each slide:
1. What investor sees
2. What it communicates
3. Why it exists in narrative
4. Live demo risk
5. WOW potential (1–5)

---

## Slide 00 — `components/slides/Slide00.tsx`
1. Cinematic hero card with glass styling, moving light, and strong opening typography.
2. Communicates: this is a systems company, not a generic services pitch.
3. Sets tone and authority in first 10 seconds.
4. Risk: medium (mousemove + RAF can feel different on low-power devices).
5. WOW potential: **5/5**.

## Slide 01 — `components/slides/Slide01.tsx`
1. Alert list on left, hover detail panel on right.
2. Communicates: pain is operational, recurrent, and expensive.
3. Anchors urgency before solution claims.
4. Risk: low (simple hover state only).
5. WOW potential: **2/5**.

## Slide 02 — `components/slides/Slide02.tsx`
1. Interactive slider wiping from “chaos” visual to “system”.
2. Communicates: transformation from reactive mode to controlled operation.
3. Transitional bridge from problem to insight.
4. Risk: low-medium (relies on pointer interaction to fully land).
5. WOW potential: **3/5**.

## Slide 03 — `components/slides/Slide03.tsx`
1. Traction vault panel set (client/value/evidence blocks).
2. Communicates: traction is already real, not hypothetical.
3. Establishes proof that there is market pull.
4. Risk: low in wrapper; depends on child widget stability.
5. WOW potential: **3/5**.

## Slide 04 — `components/slides/Slide04.tsx`
1. Three-act evidence narrative with focus lock, badges, tooltips, token copy, and overlay.
2. Communicates: defensibility and audit readiness at moment-of-operation.
3. This is the credibility centerpiece of the deck.
4. Risk: high (many listeners, timers, hover states, keyboard paths).
5. WOW potential: **5/5**.

## Slide 05 — `components/slides/Slide05.tsx`
1. Four protocol modules with hover reveal and industrial styling.
2. Communicates: team discipline and OEM-grade execution DNA.
3. Supports why they can execute at plant level.
4. Risk: low.
5. WOW potential: **3/5**.

## Slide 06 — `components/slides/Slide06.tsx`
1. Complex process board for CAD/engineering to deliverable flow.
2. Communicates: pipeline is structured, repeatable, and teachable.
3. Bridges technical capacity to operational outcomes.
4. Risk: high (large file, high interaction/motion surface).
5. WOW potential: **4/5**.

## Slide 07 — `components/slides/Slide7.tsx`
1. Product-like SmartService interaction board with decision affordances.
2. Communicates: there is real workflow logic behind the narrative.
3. Deepens “this is a system product” claim.
4. Risk: high (state-heavy + multiple event/timing interactions).
5. WOW potential: **4/5**.

## Slide 08 — `components/slides/Slide08.tsx`
1. Architecture stack visualization (edge -> gateway -> cloud -> dashboard).
2. Communicates: full-stack operating architecture, not single tool.
3. Gives structural mental model before deeper product mechanics.
4. Risk: medium (child widget has tilt + staged timers).
5. WOW potential: **4/5**.

## Slide 09 — `components/slides/Slide09.tsx`
1. Crystal/layered “Evidence OS” interface with multi-plane overlays.
2. Communicates: operating system depth and formal control planes.
3. Demonstrates system sophistication and governance posture.
4. Risk: very high (highest complexity in deck, dense interactivity).
5. WOW potential: **5/5**.

## Slide 10 — `components/slides/Slide10.tsx`
1. Documentation principle plus holographic files visual.
2. Communicates: if it is not documented, it is not defensible.
3. Converts “process” into audit/compliance trust.
4. Risk: low-medium (widget-dependent animations).
5. WOW potential: **3/5**.

## Slide 11 (component Slide12) — `components/slides/Slide12.tsx`
1. Two-column model: traditional pain vs CORE HITECH modules with expandable cards.
2. Communicates: product architecture and why it beats status quo.
3. Core explanation slide for investor understanding.
4. Risk: medium-high (large style surface, many card states).
5. WOW potential: **5/5**.

## Slide 12 (component Slide13) — `components/slides/Slide13.tsx`
1. KPI dashboard panel.
2. Communicates: outcomes can be measured and tracked.
3. Converts story into metrics.
4. Risk: low-medium (child dashboard behavior dependent).
5. WOW potential: **3/5**.

## Slide 13 (component Slide14) — `components/slides/Slide14.tsx`
1. 90-day mission/progress style execution lane.
2. Communicates: near-term execution plan is concrete.
3. Addresses investor question: “what happens right after funding?”.
4. Risk: low.
5. WOW potential: **3/5**.

## Slide 14 (component Slide15) — `components/slides/Slide15.tsx`
1. Financial equation and summary frame.
2. Communicates: economics are model-driven, not hand-wavy.
3. Supports decision with numbers.
4. Risk: low.
5. WOW potential: **2/5**.

## Slide 15 (component Slide16) — `components/slides/Slide16.tsx`
1. Monolithic cockpit for runway, ROI simulator, and evidence overlays.
2. Communicates: executive control and scenario decisioning.
3. High-stakes decision slide for “enter / don’t enter” narrative.
4. Risk: very high (large monolith, many paths, many interactive controls).
5. WOW potential: **5/5**.

## Slide 16 — `components/slides/Slide16_Investor.tsx`
1. Revenue layers + risk mitigation + scalability flywheel in grid cards.
2. Communicates: monetization logic and scale mechanics are explicit.
3. Investor packaging of business model.
4. Risk: low.
5. WOW potential: **3/5**.

## Slide 17 — `components/slides/Slide17.tsx`
1. SRG case module with modal evidence trigger.
2. Communicates: there is a concrete case anchor.
3. Case proof transition toward close.
4. Risk: low-medium (modal content quality/timing matters).
5. WOW potential: **3/5**.

## Slide 18 — `components/slides/Slide18.tsx`
1. Risk cards that reveal mitigation on hover.
2. Communicates: risks are recognized and controlled, not ignored.
3. Pre-closing objection handling.
4. Risk: low.
5. WOW potential: **3/5**.

## Slide 19 — `components/slides/Slide19.tsx`
1. Founder conviction quote + contact + loop back nav.
2. Communicates: strong final commitment and CTA.
3. Emotional close and memorability anchor.
4. Risk: low.
5. WOW potential: **2/5**.

---

## Global AI Interaction Notes
- AI interaction is global (`components/AIChat.tsx`), not embedded in slide components.
- Natural moments to invoke AI: after Slide04 (evidence), after Slide11/15 (model + ROI).
- Forced moments: early opener (Slide00–02) and closing quote (Slide19).
