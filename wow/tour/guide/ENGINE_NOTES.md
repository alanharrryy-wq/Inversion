# Engine Notes

## Intent
This file records implementation notes for the `wow/tour/guide` runtime and should help future maintainers preserve deterministic behavior.

## Reducer contract
Reducer input:
- script definition
- previous runtime state
- explicit action
- evaluation context

Reducer output:
- next runtime state

Reducer must remain:
- pure with respect to deterministic inputs
- free from I/O
- free from hidden asynchronous side effects

## Context contract
Current runtime context includes:
- `targetExists(selector)` for selector evidence checks
- `now()` for timestamp generation in wrappers

Context should not include network providers.

## Why selector evidence is synchronous
Selector evidence is intentionally evaluated synchronously when actions occur.
There is no polling loop in the evidence evaluator.

Benefits:
- deterministic snapshots
- lower CPU overhead
- easier reasoning about blocked states

## Why rule evaluation is recursive
Recursive rule evaluation supports:
- nested `all` and `any` groups
- explicit explainable unmet branches
- composition without timeline logic

## Blocked reason formation
Blocked reasons combine:
- unmet rule summaries
- missing evidence hints

This gives operators direct reasons for blocked Next button states.

## Guide overlay model
Overlay model is a derived view, not source of truth.

It includes:
- step identity and title
- progress label
- blocked reasons
- missing/satisfied evidence
- next tease and next step title

## Legacy interop
The guide runtime is additive and can coexist with legacy tour path.

When guide engine flag is off:
- legacy state and completion logic run unchanged.

When guide engine flag is on:
- guide runtime drives state transitions.
- derived state is adapted to tour overlay shape.

## Adapter notes
Adapter maps guide steps to legacy tour steps.

Important behavior:
- evidence references are transformed when possible:
  - event evidence => event rule
  - slide evidence => slide rule
  - selector evidence => manual fallback in legacy rules

This allows `guided-demo` to remain mostly compatible if selected in legacy mode.

## Script validation philosophy
Validation catches structural defects early:
- empty script id
- duplicate step id
- duplicate evidence id
- unknown evidence refs in completion
- empty grouped rules
- click action with empty selector

Warnings (non-fatal) include steps without evidence.

## Event channel notes
Guide evidence channel:
- `wow:guide:evidence`

Bridge behavior currently emits on multiple channels for compatibility.

## Slide evidence mapping
Slide evidence uses numeric slide index.
Ensure script values align to renderer index map.

## Operator panel notes
Operator panel intentionally includes:
- current blockers
- missing evidence list
- next tease
- next step title

This supports presenter recovery in live sessions.

## Testing notes
Two deterministic spec modules are provided:
- `tests/unit/wow-guide-engine.unit.ts`
- `tests/unit/wow-guide-schema.unit.ts`

These modules avoid test-framework globals so typecheck remains simple.

## Determinism guardrails
Avoid adding:
- hidden randomness
- network request dependencies
- implicit transition timers

If async behavior is introduced in future:
- it should only trigger explicit events,
- never direct state mutation outside reducer actions.

## Performance notes
Evidence evaluation cost is proportional to:
- number of evidence items in active step
- event log length for event-matching checks

Current scripts are small enough for low overhead.

Potential optimization if scripts grow:
- keep per-event counts index by name and stable where key.

## Future extension points
Potential safe extensions:
- richer selector evidence modes
- evidence expiry windows (deterministic)
- branch-specific operator scripts
- localization bundles for notes/copy

Potential risky extensions:
- adding asynchronous side effects inside reducer
- state transitions driven by animation timing

## Failure handling guidance
If target selector missing:
- show missing target warning in overlay
- allow fallback next only if step marks `fallbackAllowNext`

If event never arrives:
- keep step blocked
- surface expected/observed traces

## Debug checklist
When a step does not advance:
1. Check active step id in diagnostics.
2. Check blocked reasons.
3. Check missing evidence section.
4. Verify event names emitted by source component.
5. Verify selector anchor mounted.
6. Verify slide index matches script expectation.

## Compatibility note
Legacy `wow/guide` remains only as a compatibility wrapper surface.
New primary architecture for guided runtime is `wow/tour/guide`.

## Doc maintenance rule
Whenever reducer semantics change:
- update this file
- update `WOW_GUIDE_PLAYBOOK.md`
- update test modules

## Minimal acceptance criteria for changes
Any guide-engine change should preserve:
- deterministic reducer behavior
- explainable blockers
- default-off flag gating
- no global keybind additions
- no network calls in guide core
