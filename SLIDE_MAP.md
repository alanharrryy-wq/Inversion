# SLIDE_MAP

## Slide Discovery
- Slide registry lives in `components/SlideRenderer.tsx` via ordered `SLIDES` array.
- Active index is controlled in `App.tsx` (`currentSlide`) and rendered through `SlideRenderer`.
- Global stage elements: `Background`, `Scaler`, `Modal`, `AIChat`.
- Keyboard authority remains split as coded:
  - `components/DeckRuntimeMode.tsx` owns F1–F4 mode keys.
  - `App.tsx` owns only slide navigation keys.

## Slide Table

| Slide Index | Component Name | File Path | Purpose (narrative) | Visual Density | Code Complexity |
|---|---|---|---|---|---|
| 00 | Slide00 | `components/slides/Slide00.tsx` | Opening thesis: premium first impression for HITECH RTS | HIGH | MEDIUM |
| 01 | Slide01 | `components/slides/Slide01.tsx` | Problem framing: operational pain and red alerts | LOW | LOW |
| 02 | Slide02 | `components/slides/Slide02.tsx` | Insight transformation: chaos-to-system slider | MEDIUM | LOW |
| 03 | Slide03 | `components/slides/Slide03.tsx` | Traction evidence wrapper | MEDIUM | LOW |
| 04 | Slide04 | `components/slides/Slide04.tsx` | Core value proof: audit-defensible operation reality | HIGH | HIGH |
| 05 | Slide05 | `components/slides/Slide05.tsx` | Automotive know-how credibility modules | MEDIUM | LOW |
| 06 | Slide06 | `components/slides/Slide06.tsx` | CAD + engineering process and operationalization | HIGH | HIGH |
| 07 | Slide7 | `components/slides/Slide7.tsx` | SmartService flow + decision interface | HIGH | HIGH |
| 08 | Slide08 | `components/slides/Slide08.tsx` | Architecture stack wrapper | MEDIUM | LOW |
| 09 | Slide09 | `components/slides/Slide09.tsx` | Evidence OS / surgical operations model | HIGH | HIGH |
| 10 | Slide10 | `components/slides/Slide10.tsx` | Documentation and traceability proof | MEDIUM | LOW |
| 11 | Slide12 | `components/slides/Slide12.tsx` | Core product model and compliance engine | HIGH | HIGH |
| 12 | Slide13 | `components/slides/Slide13.tsx` | KPI outcomes wrapper | MEDIUM | LOW |
| 13 | Slide14 | `components/slides/Slide14.tsx` | 90-day execution plan wrapper | MEDIUM | LOW |
| 14 | Slide15 | `components/slides/Slide15.tsx` | Numeric/financial summary wrapper | MEDIUM | LOW |
| 15 | Slide16 | `components/slides/Slide16.tsx` | Runway/ROI monolith with overlays and mode views | HIGH | HIGH |
| 16 | Slide16_Investor | `components/slides/Slide16_Investor.tsx` | Revenue layers, risk mitigation, scalability | MEDIUM | LOW |
| 17 | Slide17 | `components/slides/Slide17.tsx` | SRG case evidence with modal entry point | LOW | LOW |
| 18 | Slide18 | `components/slides/Slide18.tsx` | Risk + mitigation hover cards | MEDIUM | LOW |
| 19 | Slide19 | `components/slides/Slide19.tsx` | Closing statement / conviction / loop back to start | MEDIUM | LOW |

## Child Components + Technical Signals

- **Slide00** (`components/slides/Slide00.tsx`)
  - Child components used: `SlideContainer`, `Header`, `NavArea`
  - Uses: hooks, embedded keyframes, `requestAnimationFrame`, mouse listener, background gradients/glass
  - AI interaction: none

- **Slide01** (`components/slides/Slide01.tsx`)
  - Child components used: `SlideContainer`, `Header`, `NavArea`
  - Uses: `useState`, hover interactions, CSS transitions
  - AI interaction: none

- **Slide02** (`components/slides/Slide02.tsx`)
  - Child components used: `SlideContainer`, `Header`, `NavArea`
  - Uses: `useState`, range input-driven visual wipe, simple transitions
  - AI interaction: none

- **Slide03** (`components/slides/Slide03.tsx`)
  - Child components used: `TractionVault`
  - Uses: wrapper only; no local hooks/listeners
  - AI interaction: none

- **Slide04** (`components/slides/Slide04.tsx`)
  - Child components used: local composites (`GlassSurface`, `BadgeTooltip`, `EvidenceOverlay`, `ToastStack`) + `SlideContainer`, `Header`, `NavArea`
  - Uses: many hooks, keyboard/mouse listeners, timers, RAF loop, tooltip layout math, embedded `<style>` blocks
  - AI interaction: none

- **Slide05** (`components/slides/Slide05.tsx`)
  - Child components used: local `TechModule` + shell components
  - Uses: hover state cards, transitions
  - AI interaction: none

- **Slide06** (`components/slides/Slide06.tsx`)
  - Child components used: local node/connector/holographic components + shell components
  - Uses: hooks, timers, reduced-motion handling, inline animation/keyframe blocks, interaction states
  - AI interaction: none (content references AI-like flow but no model calls)

- **Slide7** (`components/slides/Slide7.tsx`)
  - Child components used: many local panels/cards (`DecisionCard`, `CoreGauge`, etc.)
  - Uses: hooks, document listeners, RAF, timeout, keyboard controls, embedded style blocks
  - AI interaction: none (no backend/model call)

- **Slide08** (`components/slides/Slide08.tsx`)
  - Child components used: `IndustrialIntelligenceStack`
  - Uses: wrapper only; interaction delegated to child
  - AI interaction: none

- **Slide09** (`components/slides/Slide09.tsx`)
  - Child components used: many local layer/system components (`LayerBG`, `LayerFX`, `FormalOverlay`, etc.)
  - Uses: heavy hooks, many listeners, timers, multiple RAF loops, style blocks, overlays/state machine
  - AI interaction: none

- **Slide10** (`components/slides/Slide10.tsx`)
  - Child components used: `HolographicFilesWidget`
  - Uses: wrapper only; child handles visuals
  - AI interaction: none

- **Slide12 / index 11** (`components/slides/Slide12.tsx`)
  - Child components used: local product UI components (`CoreGrid`, `CoreCard`, `TraditionalPanel`, etc.) + shell components
  - Uses: hooks, embedded styles/keyframes, expandable cards, reduced-motion handling
  - AI interaction: none

- **Slide13** (`components/slides/Slide13.tsx`)
  - Child components used: `KpiDashboard`
  - Uses: wrapper only; child handles metrics animation
  - AI interaction: none

- **Slide14** (`components/slides/Slide14.tsx`)
  - Child components used: `MissionProgressBarWidget`
  - Uses: wrapper only
  - AI interaction: none

- **Slide15** (`components/slides/Slide15.tsx`)
  - Child components used: `FinancialEquation`
  - Uses: wrapper only
  - AI interaction: none

- **Slide16** (`components/slides/Slide16.tsx`)
  - Child components used: many local layer + overlay + panel components in monolithic file
  - Uses: hooks, keyboard/mouse listeners, interval timer, multi-mode overlays, dense inline styling
  - AI interaction: none

- **Slide16_Investor** (`components/slides/Slide16_Investor.tsx`)
  - Child components used: `DataBox` blocks + shell components
  - Uses: mostly static with hover styling
  - AI interaction: none

- **Slide17** (`components/slides/Slide17.tsx`)
  - Child components used: `DataBox` + shell components
  - Uses: modal trigger click (`openModal`)
  - AI interaction: none

- **Slide18** (`components/slides/Slide18.tsx`)
  - Child components used: local `RiskDefenseSystem` + shell components
  - Uses: hover-driven reveal cards
  - AI interaction: none

- **Slide19** (`components/slides/Slide19.tsx`)
  - Child components used: local `DataBox` + `NavArea`
  - Uses: animated closing copy and click-to-restart deck (`goToSlide(0)`)
  - AI interaction: none

## Global AI Interaction Surface
- AI is not slide-local. It is global in `components/AIChat.tsx` and rendered from `App.tsx`.
- AI is a persistent overlay chat window with mode switching and backend request to `/api/ai`.
