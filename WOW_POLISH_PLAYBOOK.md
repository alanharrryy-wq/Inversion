# WOW Polish Playbook

## Scope scaffolded
- Tour polish foundations in `wow/tour/motion.tokens.css` and `wow/tour/ui/wow.ui.css`.
- New micro-UI primitives in `wow/tour/ui/`:
  - `PulseRing.tsx`
  - `ArrowHint.tsx`
  - `SuccessToast.tsx`
  - `StepHeader.tsx`
  - `ProgressBadge.tsx`
- Choreography contract wrappers in `wow/tour/choreo/`:
  - `choreo.types.ts`
  - `choreo.utils.ts`
  - `useChoreoPhases.ts`
- Director operator scaffold in `wow/tour/director/`:
  - `DirectorOverlay.tsx`
  - `director.types.ts`
  - `director.script.ts`
- Slide 05 cinematic layout scaffold in `components/slides/Slide05.tsx` + `components/slides/Slide05.cinematic.css`.

## Feature flags (default OFF)
- `VITE_WOW_TOUR_POLISH`
- `VITE_WOW_DIRECTOR_OVERLAY`
- `VITE_WOW_SLIDE05_CINEMATIC`

All are gated by `VITE_WOW_DEMO=1` as needed and resolve false when env vars are absent.

## Choreography contract
Phases stay stable and explicit:
- `intro`
- `guide`
- `success`
- `tease`

Use `useChoreoPhases` for future timing/class refinements while preserving compatibility with existing phase-based styling.

## Slide05 extension points
Named cinematic layers are in place:
- `BackgroundLayer`
- `ImpactLayer`
- `ContentLayer`
- `FooterLayer`

There are explicit beat placeholders (`TODO` labels) for later choreography and visual treatment.

## Validation
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wow-validate.ps1
```

The script resolves `npm.cmd`, runs typecheck + build, shows `Write-Progress`, and prints a summary.
