# Guide Authoring Guide

## Purpose
This file documents how to author deterministic, evidence-first scripts for the WOW guide engine.

Use this guide when:
- Creating a new script.
- Refactoring an existing script.
- Troubleshooting blocked step progression.
- Designing presenter/operator workflows.

## Core Rules

1. Every step must define evidence.
2. Completion rules must be explicit.
3. Evidence must be deterministic.
4. Next must be explainable when blocked.
5. No network or random dependencies.
6. No hidden timing assumptions.
7. Keep payloads small and serializable.

## File map

- `wow/tour/guide/types.ts`
- `wow/tour/guide/schema.ts`
- `wow/tour/guide/evidence.ts`
- `wow/tour/guide/reducer.ts`
- `wow/tour/guide/selectors.ts`
- `wow/tour/guide/authoring.ts`
- `wow/tour/guide/checklists.ts`
- `wow/tour/guide/scripts/enterprise.ts`
- `wow/tour/guide/scripts/guided-demo.ts`

## Step anatomy

A step contains:
- identity (`id`)
- narrative (`title`, `body`, optional `footnote`)
- operator cues (`directorNotes`, `nextTease`)
- action hint (`action`)
- evidence declarations (`evidence[]`)
- completion rule (`completion`)
- target focus info (`targetSelector`, `placement`)

## Evidence anatomy

Evidence item fields:
- `id`: stable key scoped to step.
- `label`: short UI label.
- `hint`: operator guidance text.
- `required`: defaults true.
- `source`: event/slide/selector source.

Event evidence:
- `name`
- optional `count`
- optional `where`

Slide evidence:
- one slide index or array

Selector evidence:
- CSS selector
- mode `exists` or `missing`

## Completion rule patterns

### Pattern A: direct evidence reference
Use this for one-to-one completion.

### Pattern B: all evidence references
Use this for hard gates.

### Pattern C: any evidence references
Use this for fallback paths.

### Pattern D: nested all/any
Use this for richer branching without non-determinism.

## Authoring helper usage

Use `wow/tour/guide/authoring.ts` helpers.

### Example: event evidence
```ts
const ev = eventEvidence({
  id: 'lock-event',
  label: 'Evidence lock event',
  hint: 'Click lock control once.',
  name: 'evidence:locked',
  count: 1,
});
```

### Example: selector evidence
```ts
const selector = selectorEvidence({
  id: 'lock-button-mounted',
  label: 'Lock button mounted',
  hint: 'Control must exist before click.',
  selector: '[data-testid="lock-button"]',
  mode: 'exists',
});
```

### Example: step creation
```ts
const step = createStep({
  id: 'lock-step',
  title: 'Lock evidence',
  body: 'Click lock.',
  action: { type: 'click', selector: '[data-testid="lock-button"]' },
  successText: 'Lock captured.',
  evidence: [selector, ev],
  completion: allRules(evidenceRef(selector.id), evidenceRef(ev.id)),
});
```

## Authoring checklist per step

1. Is the target selector stable?
2. Are evidence ids unique within step?
3. Does completion reference valid evidence ids?
4. Does success text describe verifiable outcome?
5. Do notes help operator in high-pressure mode?
6. Is `nextTease` actionable?
7. Is fallback path explicit?

## Naming conventions

### Step ids
- Use lowercase kebab style.
- Prefix by stage where useful.
- Keep stable for analytics-free debugging.

### Evidence ids
- prefix by step context (`s04-lock-event` or `g08-slide05-anchor`).
- avoid generic ids like `event1`.

### Event names
- use namespace style: `area:action`.
- examples:
  - `evidence:locked`
  - `module:opened`
  - `slide05:module-click`

## Payload conventions

Payload should be:
- flat where possible.
- serializable.
- deterministic.
- minimal.

Good payload:
```json
{ "key": "conditionscore" }
```

Avoid payload:
- big nested objects
- mutable references
- random values

## Determinism anti-patterns

Do not use:
- `Math.random()` for ids.
- `setTimeout` for correctness transitions.
- network responses for completion conditions.
- animation completion as a state transition trigger.

## State machine transition model

Transitions are explicit action-driven updates.

- `START` enters running mode.
- `EVIDENCE_CAPTURED` appends immutable event and evaluates current step.
- `SLIDE_CHANGED` updates slide evidence and evaluates step.
- `NEXT` uses completion or explicit allow-incomplete flag.
- `BACK` rewinds index only.
- `SKIP` marks completed.
- `STOP` resets runtime.

No hidden transitions should exist.

## Blocked reasons quality

Blocked reason quality bar:
- one reason per missing requirement.
- clear language for operator.
- include expected vs observed where helpful.

Example reason:
- `Need event evidence:locked x1 (have 0).`

Bad reason:
- `Not ready.`

## Operator notes quality

Operator notes should:
- be short.
- instruct what to say or do.
- avoid generic filler.

Good notes:
- `State: evidence first, KPI second, deployment third.`
- `Pause after event capture and let audience inspect.`

Bad notes:
- `Talk confidently.`

## Tease quality

Tease should answer: what happens next and why it matters.

Good tease:
- `Next, export token to prove evidence portability.`

Bad tease:
- `Go next.`

## Slide05 authoring specifics

When adding steps around Slide05:
- use anchors:
  - `slide05-surface`
  - `slide05-narrative`
  - `slide05-modules`
  - `slide05-module-XX`
- prefer event evidence:
  - `slide05:module-hover`
  - `slide05:module-click`

## Script review checklist

1. Schema validation passes.
2. No duplicate step ids.
3. No duplicate evidence ids.
4. Completion references are valid.
5. Event names map to real emitters.
6. Selectors exist in actual UI.
7. Missing-target warnings are actionable.
8. Notes and tease are operator-ready.

## Validation workflow

Run:
- `npm run wow:guide:smoke`
- `npm run wow:validate`

If smoke fails:
- inspect flags check output.
- inspect deterministic scan output.
- inspect keybind scan output.

If validate fails:
- fix type errors first.
- fix build errors second.

## Refactoring workflow

When refactoring script:
1. clone script with helper.
2. change one step at a time.
3. validate schema.
4. run smoke.
5. run full build.

When refactoring engine:
1. keep action names stable.
2. preserve deterministic semantics.
3. update tests.
4. update playbook docs.

## Adding a new script

1. Create file in `wow/tour/guide/scripts/`.
2. Export script constant.
3. Add export to `scripts/index.ts`.
4. Add script to `registry.ts`.
5. Run schema validation.
6. Smoke + build.

## Adding new evidence source type

If new source type is needed:
1. Extend `GuideEvidenceSource` in `types.ts`.
2. Add evaluator support in `evidence.ts`.
3. Add summary formatting.
4. Extend checklist support if needed.
5. Add tests for new source behavior.

## Adding new completion rule type

If new rule type is needed:
1. Extend `GuideCompletionRule`.
2. Extend evaluator recursion.
3. Add schema validations for rule invariants.
4. Add reducer/selector tests.

## Common pitfalls

- Mistyped event names.
- Rule references wrong evidence id.
- Selector too broad and unstable.
- Using non-required evidence accidentally.
- Missing fallback warning on risky selectors.

## Example step template

```ts
createStep({
  id: 'template-step',
  title: 'Template title',
  body: 'Template body',
  action: { type: 'state', text: 'Operator action' },
  successText: 'Expected success outcome',
  nextTease: 'What comes next and why',
  directorNotes: ['What to say', 'What to pause on'],
  targetSelector: '[data-tour-id="template"]',
  missingTargetWarning: 'Fallback guidance if selector missing',
  evidence: [
    slideEvidence({
      id: 'template-slide',
      label: 'Correct slide',
      hint: 'Navigate to slide index N',
      slide: 5,
    }),
    eventEvidence({
      id: 'template-event',
      label: 'Event captured',
      hint: 'Emit event after action',
      name: 'template:event',
      count: 1,
    }),
  ],
  completion: allRules(evidenceRef('template-slide'), evidenceRef('template-event')),
});
```

## Review severity model

Treat issues as:
- blocker: deterministic break, wrong completion, missing evidence path.
- major: unclear blocked reason, ambiguous notes, fragile selector.
- minor: copy polish, wording clarity.

## Quality gates before merge

1. Schema checks clean of errors.
2. Reducer deterministic tests pass.
3. Smoke scan pass.
4. Build pass.
5. Forbidden files untouched.

## Migration notes from legacy guide path

Legacy guide support remains for compatibility.

Migration best path:
1. map legacy step into guide step with explicit evidence.
2. avoid manual completion except explicit operator gates.
3. use guide UI scaffolds for blockers visibility.

## FAQ

### Why not complete steps with timers?
Timers hide causality and break deterministic replay.

### Why keep selector evidence if events exist?
Selector evidence guards against missing UI targets and helps explain blockers.

### Why keep `allowNextBeforeComplete`?
Some steps are narrative transitions where operator override is acceptable.

### Why keep fallback warnings?
Presenter needs explicit fallback text when target does not mount.

## Extended example flow design

Use this progression pattern:
- readiness
- context
- compliance proof
- portability proof
- AI translation
- module interaction
- case closure

This pattern keeps decision narrative coherent and auditable.

## Hand-off notes for design polish

Safe polish areas:
- visual styling
- copy wording
- panel spacing
- typography hierarchy

Unsafe areas (needs engineer review):
- action semantics
- evidence source type changes
- completion rule semantics
- event contracts

## End-state target

A guide script should be:
- deterministic
- replayable
- explainable
- operator-friendly
- safe to run with flags default-off

If a script cannot explain why Next is blocked, it is not ready.
