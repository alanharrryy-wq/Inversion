# Evidence Recipes

Catalog of reusable deterministic evidence patterns for guide script authoring.

## Global Principles

- Always define at least one required evidence item per actionable step.
- Prefer event evidence for action proof and slide evidence for navigation gates.
- Use selector evidence to explain missing targets.
- Keep completion groups explicit and composable.
- Avoid random, network, and timing dependencies.
- Keep blocked reasons clear for operator decisions.

## Recipe Catalog

### Recipe 01

Objective: Deterministic gate pattern 01.

Evidence declarations:
- evt-01: event evidence with minimum count 1
- sel-01: selector evidence target exists
- sld-01: optional slide evidence

Completion pattern:
- any(evidence(evt-01), all(evidence(sel-01), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 01
- if blocked, inspect observed traces for evt-01 and selector state

Blocked examples:
- Need event demo:event:01 x1 (have 0)
- Evidence not met for selector sel-01

Template snippet:
- id: recipe-01
- evidence ids: evt-01, sel-01, sld-01
- success text: Recipe 01 gate satisfied

### Recipe 02

Objective: Deterministic gate pattern 02.

Evidence declarations:
- evt-02: event evidence with minimum count 1
- sel-02: selector evidence target exists
- sld-02: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-02), evidence(sel-02)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 02
- if blocked, inspect observed traces for evt-02 and selector state

Blocked examples:
- Need event demo:event:02 x1 (have 0)
- Evidence not met for selector sel-02

Template snippet:
- id: recipe-02
- evidence ids: evt-02, sel-02, sld-02
- success text: Recipe 02 gate satisfied

### Recipe 03

Objective: Deterministic gate pattern 03.

Evidence declarations:
- evt-03: event evidence with minimum count 1
- sel-03: selector evidence target exists
- sld-03: optional slide evidence

Completion pattern:
- all(evidence(evt-03), evidence(sel-03))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 03
- if blocked, inspect observed traces for evt-03 and selector state

Blocked examples:
- Need event demo:event:03 x1 (have 0)
- Evidence not met for selector sel-03

Template snippet:
- id: recipe-03
- evidence ids: evt-03, sel-03, sld-03
- success text: Recipe 03 gate satisfied

### Recipe 04

Objective: Deterministic gate pattern 04.

Evidence declarations:
- evt-04: event evidence with minimum count 1
- sel-04: selector evidence target exists
- sld-04: optional slide evidence

Completion pattern:
- any(evidence(evt-04), all(evidence(sel-04), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 04
- if blocked, inspect observed traces for evt-04 and selector state

Blocked examples:
- Need event demo:event:04 x1 (have 0)
- Evidence not met for selector sel-04

Template snippet:
- id: recipe-04
- evidence ids: evt-04, sel-04, sld-04
- success text: Recipe 04 gate satisfied

### Recipe 05

Objective: Deterministic gate pattern 05.

Evidence declarations:
- evt-05: event evidence with minimum count 1
- sel-05: selector evidence target exists
- sld-05: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-05), evidence(sel-05)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 05
- if blocked, inspect observed traces for evt-05 and selector state

Blocked examples:
- Need event demo:event:05 x1 (have 0)
- Evidence not met for selector sel-05

Template snippet:
- id: recipe-05
- evidence ids: evt-05, sel-05, sld-05
- success text: Recipe 05 gate satisfied

### Recipe 06

Objective: Deterministic gate pattern 06.

Evidence declarations:
- evt-06: event evidence with minimum count 1
- sel-06: selector evidence target exists
- sld-06: optional slide evidence

Completion pattern:
- all(evidence(evt-06), evidence(sel-06))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 06
- if blocked, inspect observed traces for evt-06 and selector state

Blocked examples:
- Need event demo:event:06 x1 (have 0)
- Evidence not met for selector sel-06

Template snippet:
- id: recipe-06
- evidence ids: evt-06, sel-06, sld-06
- success text: Recipe 06 gate satisfied

### Recipe 07

Objective: Deterministic gate pattern 07.

Evidence declarations:
- evt-07: event evidence with minimum count 1
- sel-07: selector evidence target exists
- sld-07: optional slide evidence

Completion pattern:
- any(evidence(evt-07), all(evidence(sel-07), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 07
- if blocked, inspect observed traces for evt-07 and selector state

Blocked examples:
- Need event demo:event:07 x1 (have 0)
- Evidence not met for selector sel-07

Template snippet:
- id: recipe-07
- evidence ids: evt-07, sel-07, sld-07
- success text: Recipe 07 gate satisfied

### Recipe 08

Objective: Deterministic gate pattern 08.

Evidence declarations:
- evt-08: event evidence with minimum count 1
- sel-08: selector evidence target exists
- sld-08: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-08), evidence(sel-08)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 08
- if blocked, inspect observed traces for evt-08 and selector state

Blocked examples:
- Need event demo:event:08 x1 (have 0)
- Evidence not met for selector sel-08

Template snippet:
- id: recipe-08
- evidence ids: evt-08, sel-08, sld-08
- success text: Recipe 08 gate satisfied

### Recipe 09

Objective: Deterministic gate pattern 09.

Evidence declarations:
- evt-09: event evidence with minimum count 1
- sel-09: selector evidence target exists
- sld-09: optional slide evidence

Completion pattern:
- all(evidence(evt-09), evidence(sel-09))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 09
- if blocked, inspect observed traces for evt-09 and selector state

Blocked examples:
- Need event demo:event:09 x1 (have 0)
- Evidence not met for selector sel-09

Template snippet:
- id: recipe-09
- evidence ids: evt-09, sel-09, sld-09
- success text: Recipe 09 gate satisfied

### Recipe 10

Objective: Deterministic gate pattern 10.

Evidence declarations:
- evt-10: event evidence with minimum count 1
- sel-10: selector evidence target exists
- sld-10: optional slide evidence

Completion pattern:
- any(evidence(evt-10), all(evidence(sel-10), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 10
- if blocked, inspect observed traces for evt-10 and selector state

Blocked examples:
- Need event demo:event:10 x1 (have 0)
- Evidence not met for selector sel-10

Template snippet:
- id: recipe-10
- evidence ids: evt-10, sel-10, sld-10
- success text: Recipe 10 gate satisfied

### Recipe 11

Objective: Deterministic gate pattern 11.

Evidence declarations:
- evt-11: event evidence with minimum count 1
- sel-11: selector evidence target exists
- sld-11: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-11), evidence(sel-11)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 11
- if blocked, inspect observed traces for evt-11 and selector state

Blocked examples:
- Need event demo:event:11 x1 (have 0)
- Evidence not met for selector sel-11

Template snippet:
- id: recipe-11
- evidence ids: evt-11, sel-11, sld-11
- success text: Recipe 11 gate satisfied

### Recipe 12

Objective: Deterministic gate pattern 12.

Evidence declarations:
- evt-12: event evidence with minimum count 1
- sel-12: selector evidence target exists
- sld-12: optional slide evidence

Completion pattern:
- all(evidence(evt-12), evidence(sel-12))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 12
- if blocked, inspect observed traces for evt-12 and selector state

Blocked examples:
- Need event demo:event:12 x1 (have 0)
- Evidence not met for selector sel-12

Template snippet:
- id: recipe-12
- evidence ids: evt-12, sel-12, sld-12
- success text: Recipe 12 gate satisfied

### Recipe 13

Objective: Deterministic gate pattern 13.

Evidence declarations:
- evt-13: event evidence with minimum count 1
- sel-13: selector evidence target exists
- sld-13: optional slide evidence

Completion pattern:
- any(evidence(evt-13), all(evidence(sel-13), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 13
- if blocked, inspect observed traces for evt-13 and selector state

Blocked examples:
- Need event demo:event:13 x1 (have 0)
- Evidence not met for selector sel-13

Template snippet:
- id: recipe-13
- evidence ids: evt-13, sel-13, sld-13
- success text: Recipe 13 gate satisfied

### Recipe 14

Objective: Deterministic gate pattern 14.

Evidence declarations:
- evt-14: event evidence with minimum count 1
- sel-14: selector evidence target exists
- sld-14: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-14), evidence(sel-14)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 14
- if blocked, inspect observed traces for evt-14 and selector state

Blocked examples:
- Need event demo:event:14 x1 (have 0)
- Evidence not met for selector sel-14

Template snippet:
- id: recipe-14
- evidence ids: evt-14, sel-14, sld-14
- success text: Recipe 14 gate satisfied

### Recipe 15

Objective: Deterministic gate pattern 15.

Evidence declarations:
- evt-15: event evidence with minimum count 1
- sel-15: selector evidence target exists
- sld-15: optional slide evidence

Completion pattern:
- all(evidence(evt-15), evidence(sel-15))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 15
- if blocked, inspect observed traces for evt-15 and selector state

Blocked examples:
- Need event demo:event:15 x1 (have 0)
- Evidence not met for selector sel-15

Template snippet:
- id: recipe-15
- evidence ids: evt-15, sel-15, sld-15
- success text: Recipe 15 gate satisfied

### Recipe 16

Objective: Deterministic gate pattern 16.

Evidence declarations:
- evt-16: event evidence with minimum count 1
- sel-16: selector evidence target exists
- sld-16: optional slide evidence

Completion pattern:
- any(evidence(evt-16), all(evidence(sel-16), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 16
- if blocked, inspect observed traces for evt-16 and selector state

Blocked examples:
- Need event demo:event:16 x1 (have 0)
- Evidence not met for selector sel-16

Template snippet:
- id: recipe-16
- evidence ids: evt-16, sel-16, sld-16
- success text: Recipe 16 gate satisfied

### Recipe 17

Objective: Deterministic gate pattern 17.

Evidence declarations:
- evt-17: event evidence with minimum count 1
- sel-17: selector evidence target exists
- sld-17: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-17), evidence(sel-17)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 17
- if blocked, inspect observed traces for evt-17 and selector state

Blocked examples:
- Need event demo:event:17 x1 (have 0)
- Evidence not met for selector sel-17

Template snippet:
- id: recipe-17
- evidence ids: evt-17, sel-17, sld-17
- success text: Recipe 17 gate satisfied

### Recipe 18

Objective: Deterministic gate pattern 18.

Evidence declarations:
- evt-18: event evidence with minimum count 1
- sel-18: selector evidence target exists
- sld-18: optional slide evidence

Completion pattern:
- all(evidence(evt-18), evidence(sel-18))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 18
- if blocked, inspect observed traces for evt-18 and selector state

Blocked examples:
- Need event demo:event:18 x1 (have 0)
- Evidence not met for selector sel-18

Template snippet:
- id: recipe-18
- evidence ids: evt-18, sel-18, sld-18
- success text: Recipe 18 gate satisfied

### Recipe 19

Objective: Deterministic gate pattern 19.

Evidence declarations:
- evt-19: event evidence with minimum count 1
- sel-19: selector evidence target exists
- sld-19: optional slide evidence

Completion pattern:
- any(evidence(evt-19), all(evidence(sel-19), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 19
- if blocked, inspect observed traces for evt-19 and selector state

Blocked examples:
- Need event demo:event:19 x1 (have 0)
- Evidence not met for selector sel-19

Template snippet:
- id: recipe-19
- evidence ids: evt-19, sel-19, sld-19
- success text: Recipe 19 gate satisfied

### Recipe 20

Objective: Deterministic gate pattern 20.

Evidence declarations:
- evt-20: event evidence with minimum count 1
- sel-20: selector evidence target exists
- sld-20: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-20), evidence(sel-20)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 20
- if blocked, inspect observed traces for evt-20 and selector state

Blocked examples:
- Need event demo:event:20 x1 (have 0)
- Evidence not met for selector sel-20

Template snippet:
- id: recipe-20
- evidence ids: evt-20, sel-20, sld-20
- success text: Recipe 20 gate satisfied

### Recipe 21

Objective: Deterministic gate pattern 21.

Evidence declarations:
- evt-21: event evidence with minimum count 1
- sel-21: selector evidence target exists
- sld-21: optional slide evidence

Completion pattern:
- all(evidence(evt-21), evidence(sel-21))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 21
- if blocked, inspect observed traces for evt-21 and selector state

Blocked examples:
- Need event demo:event:21 x1 (have 0)
- Evidence not met for selector sel-21

Template snippet:
- id: recipe-21
- evidence ids: evt-21, sel-21, sld-21
- success text: Recipe 21 gate satisfied

### Recipe 22

Objective: Deterministic gate pattern 22.

Evidence declarations:
- evt-22: event evidence with minimum count 1
- sel-22: selector evidence target exists
- sld-22: optional slide evidence

Completion pattern:
- any(evidence(evt-22), all(evidence(sel-22), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 22
- if blocked, inspect observed traces for evt-22 and selector state

Blocked examples:
- Need event demo:event:22 x1 (have 0)
- Evidence not met for selector sel-22

Template snippet:
- id: recipe-22
- evidence ids: evt-22, sel-22, sld-22
- success text: Recipe 22 gate satisfied

### Recipe 23

Objective: Deterministic gate pattern 23.

Evidence declarations:
- evt-23: event evidence with minimum count 1
- sel-23: selector evidence target exists
- sld-23: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-23), evidence(sel-23)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 23
- if blocked, inspect observed traces for evt-23 and selector state

Blocked examples:
- Need event demo:event:23 x1 (have 0)
- Evidence not met for selector sel-23

Template snippet:
- id: recipe-23
- evidence ids: evt-23, sel-23, sld-23
- success text: Recipe 23 gate satisfied

### Recipe 24

Objective: Deterministic gate pattern 24.

Evidence declarations:
- evt-24: event evidence with minimum count 1
- sel-24: selector evidence target exists
- sld-24: optional slide evidence

Completion pattern:
- all(evidence(evt-24), evidence(sel-24))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 24
- if blocked, inspect observed traces for evt-24 and selector state

Blocked examples:
- Need event demo:event:24 x1 (have 0)
- Evidence not met for selector sel-24

Template snippet:
- id: recipe-24
- evidence ids: evt-24, sel-24, sld-24
- success text: Recipe 24 gate satisfied

### Recipe 25

Objective: Deterministic gate pattern 25.

Evidence declarations:
- evt-25: event evidence with minimum count 1
- sel-25: selector evidence target exists
- sld-25: optional slide evidence

Completion pattern:
- any(evidence(evt-25), all(evidence(sel-25), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 25
- if blocked, inspect observed traces for evt-25 and selector state

Blocked examples:
- Need event demo:event:25 x1 (have 0)
- Evidence not met for selector sel-25

Template snippet:
- id: recipe-25
- evidence ids: evt-25, sel-25, sld-25
- success text: Recipe 25 gate satisfied

### Recipe 26

Objective: Deterministic gate pattern 26.

Evidence declarations:
- evt-26: event evidence with minimum count 1
- sel-26: selector evidence target exists
- sld-26: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-26), evidence(sel-26)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 26
- if blocked, inspect observed traces for evt-26 and selector state

Blocked examples:
- Need event demo:event:26 x1 (have 0)
- Evidence not met for selector sel-26

Template snippet:
- id: recipe-26
- evidence ids: evt-26, sel-26, sld-26
- success text: Recipe 26 gate satisfied

### Recipe 27

Objective: Deterministic gate pattern 27.

Evidence declarations:
- evt-27: event evidence with minimum count 1
- sel-27: selector evidence target exists
- sld-27: optional slide evidence

Completion pattern:
- all(evidence(evt-27), evidence(sel-27))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 27
- if blocked, inspect observed traces for evt-27 and selector state

Blocked examples:
- Need event demo:event:27 x1 (have 0)
- Evidence not met for selector sel-27

Template snippet:
- id: recipe-27
- evidence ids: evt-27, sel-27, sld-27
- success text: Recipe 27 gate satisfied

### Recipe 28

Objective: Deterministic gate pattern 28.

Evidence declarations:
- evt-28: event evidence with minimum count 1
- sel-28: selector evidence target exists
- sld-28: optional slide evidence

Completion pattern:
- any(evidence(evt-28), all(evidence(sel-28), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 28
- if blocked, inspect observed traces for evt-28 and selector state

Blocked examples:
- Need event demo:event:28 x1 (have 0)
- Evidence not met for selector sel-28

Template snippet:
- id: recipe-28
- evidence ids: evt-28, sel-28, sld-28
- success text: Recipe 28 gate satisfied

### Recipe 29

Objective: Deterministic gate pattern 29.

Evidence declarations:
- evt-29: event evidence with minimum count 1
- sel-29: selector evidence target exists
- sld-29: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-29), evidence(sel-29)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 29
- if blocked, inspect observed traces for evt-29 and selector state

Blocked examples:
- Need event demo:event:29 x1 (have 0)
- Evidence not met for selector sel-29

Template snippet:
- id: recipe-29
- evidence ids: evt-29, sel-29, sld-29
- success text: Recipe 29 gate satisfied

### Recipe 30

Objective: Deterministic gate pattern 30.

Evidence declarations:
- evt-30: event evidence with minimum count 1
- sel-30: selector evidence target exists
- sld-30: optional slide evidence

Completion pattern:
- all(evidence(evt-30), evidence(sel-30))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 30
- if blocked, inspect observed traces for evt-30 and selector state

Blocked examples:
- Need event demo:event:30 x1 (have 0)
- Evidence not met for selector sel-30

Template snippet:
- id: recipe-30
- evidence ids: evt-30, sel-30, sld-30
- success text: Recipe 30 gate satisfied

### Recipe 31

Objective: Deterministic gate pattern 31.

Evidence declarations:
- evt-31: event evidence with minimum count 1
- sel-31: selector evidence target exists
- sld-31: optional slide evidence

Completion pattern:
- any(evidence(evt-31), all(evidence(sel-31), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 31
- if blocked, inspect observed traces for evt-31 and selector state

Blocked examples:
- Need event demo:event:31 x1 (have 0)
- Evidence not met for selector sel-31

Template snippet:
- id: recipe-31
- evidence ids: evt-31, sel-31, sld-31
- success text: Recipe 31 gate satisfied

### Recipe 32

Objective: Deterministic gate pattern 32.

Evidence declarations:
- evt-32: event evidence with minimum count 1
- sel-32: selector evidence target exists
- sld-32: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-32), evidence(sel-32)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 32
- if blocked, inspect observed traces for evt-32 and selector state

Blocked examples:
- Need event demo:event:32 x1 (have 0)
- Evidence not met for selector sel-32

Template snippet:
- id: recipe-32
- evidence ids: evt-32, sel-32, sld-32
- success text: Recipe 32 gate satisfied

### Recipe 33

Objective: Deterministic gate pattern 33.

Evidence declarations:
- evt-33: event evidence with minimum count 1
- sel-33: selector evidence target exists
- sld-33: optional slide evidence

Completion pattern:
- all(evidence(evt-33), evidence(sel-33))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 33
- if blocked, inspect observed traces for evt-33 and selector state

Blocked examples:
- Need event demo:event:33 x1 (have 0)
- Evidence not met for selector sel-33

Template snippet:
- id: recipe-33
- evidence ids: evt-33, sel-33, sld-33
- success text: Recipe 33 gate satisfied

### Recipe 34

Objective: Deterministic gate pattern 34.

Evidence declarations:
- evt-34: event evidence with minimum count 1
- sel-34: selector evidence target exists
- sld-34: optional slide evidence

Completion pattern:
- any(evidence(evt-34), all(evidence(sel-34), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 34
- if blocked, inspect observed traces for evt-34 and selector state

Blocked examples:
- Need event demo:event:34 x1 (have 0)
- Evidence not met for selector sel-34

Template snippet:
- id: recipe-34
- evidence ids: evt-34, sel-34, sld-34
- success text: Recipe 34 gate satisfied

### Recipe 35

Objective: Deterministic gate pattern 35.

Evidence declarations:
- evt-35: event evidence with minimum count 1
- sel-35: selector evidence target exists
- sld-35: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-35), evidence(sel-35)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 35
- if blocked, inspect observed traces for evt-35 and selector state

Blocked examples:
- Need event demo:event:35 x1 (have 0)
- Evidence not met for selector sel-35

Template snippet:
- id: recipe-35
- evidence ids: evt-35, sel-35, sld-35
- success text: Recipe 35 gate satisfied

### Recipe 36

Objective: Deterministic gate pattern 36.

Evidence declarations:
- evt-36: event evidence with minimum count 1
- sel-36: selector evidence target exists
- sld-36: optional slide evidence

Completion pattern:
- all(evidence(evt-36), evidence(sel-36))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 36
- if blocked, inspect observed traces for evt-36 and selector state

Blocked examples:
- Need event demo:event:36 x1 (have 0)
- Evidence not met for selector sel-36

Template snippet:
- id: recipe-36
- evidence ids: evt-36, sel-36, sld-36
- success text: Recipe 36 gate satisfied

### Recipe 37

Objective: Deterministic gate pattern 37.

Evidence declarations:
- evt-37: event evidence with minimum count 1
- sel-37: selector evidence target exists
- sld-37: optional slide evidence

Completion pattern:
- any(evidence(evt-37), all(evidence(sel-37), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 37
- if blocked, inspect observed traces for evt-37 and selector state

Blocked examples:
- Need event demo:event:37 x1 (have 0)
- Evidence not met for selector sel-37

Template snippet:
- id: recipe-37
- evidence ids: evt-37, sel-37, sld-37
- success text: Recipe 37 gate satisfied

### Recipe 38

Objective: Deterministic gate pattern 38.

Evidence declarations:
- evt-38: event evidence with minimum count 1
- sel-38: selector evidence target exists
- sld-38: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-38), evidence(sel-38)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 38
- if blocked, inspect observed traces for evt-38 and selector state

Blocked examples:
- Need event demo:event:38 x1 (have 0)
- Evidence not met for selector sel-38

Template snippet:
- id: recipe-38
- evidence ids: evt-38, sel-38, sld-38
- success text: Recipe 38 gate satisfied

### Recipe 39

Objective: Deterministic gate pattern 39.

Evidence declarations:
- evt-39: event evidence with minimum count 1
- sel-39: selector evidence target exists
- sld-39: optional slide evidence

Completion pattern:
- all(evidence(evt-39), evidence(sel-39))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 39
- if blocked, inspect observed traces for evt-39 and selector state

Blocked examples:
- Need event demo:event:39 x1 (have 0)
- Evidence not met for selector sel-39

Template snippet:
- id: recipe-39
- evidence ids: evt-39, sel-39, sld-39
- success text: Recipe 39 gate satisfied

### Recipe 40

Objective: Deterministic gate pattern 40.

Evidence declarations:
- evt-40: event evidence with minimum count 1
- sel-40: selector evidence target exists
- sld-40: optional slide evidence

Completion pattern:
- any(evidence(evt-40), all(evidence(sel-40), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 40
- if blocked, inspect observed traces for evt-40 and selector state

Blocked examples:
- Need event demo:event:40 x1 (have 0)
- Evidence not met for selector sel-40

Template snippet:
- id: recipe-40
- evidence ids: evt-40, sel-40, sld-40
- success text: Recipe 40 gate satisfied

### Recipe 41

Objective: Deterministic gate pattern 41.

Evidence declarations:
- evt-41: event evidence with minimum count 1
- sel-41: selector evidence target exists
- sld-41: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-41), evidence(sel-41)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 41
- if blocked, inspect observed traces for evt-41 and selector state

Blocked examples:
- Need event demo:event:41 x1 (have 0)
- Evidence not met for selector sel-41

Template snippet:
- id: recipe-41
- evidence ids: evt-41, sel-41, sld-41
- success text: Recipe 41 gate satisfied

### Recipe 42

Objective: Deterministic gate pattern 42.

Evidence declarations:
- evt-42: event evidence with minimum count 1
- sel-42: selector evidence target exists
- sld-42: optional slide evidence

Completion pattern:
- all(evidence(evt-42), evidence(sel-42))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 42
- if blocked, inspect observed traces for evt-42 and selector state

Blocked examples:
- Need event demo:event:42 x1 (have 0)
- Evidence not met for selector sel-42

Template snippet:
- id: recipe-42
- evidence ids: evt-42, sel-42, sld-42
- success text: Recipe 42 gate satisfied

### Recipe 43

Objective: Deterministic gate pattern 43.

Evidence declarations:
- evt-43: event evidence with minimum count 1
- sel-43: selector evidence target exists
- sld-43: optional slide evidence

Completion pattern:
- any(evidence(evt-43), all(evidence(sel-43), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 43
- if blocked, inspect observed traces for evt-43 and selector state

Blocked examples:
- Need event demo:event:43 x1 (have 0)
- Evidence not met for selector sel-43

Template snippet:
- id: recipe-43
- evidence ids: evt-43, sel-43, sld-43
- success text: Recipe 43 gate satisfied

### Recipe 44

Objective: Deterministic gate pattern 44.

Evidence declarations:
- evt-44: event evidence with minimum count 1
- sel-44: selector evidence target exists
- sld-44: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-44), evidence(sel-44)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 44
- if blocked, inspect observed traces for evt-44 and selector state

Blocked examples:
- Need event demo:event:44 x1 (have 0)
- Evidence not met for selector sel-44

Template snippet:
- id: recipe-44
- evidence ids: evt-44, sel-44, sld-44
- success text: Recipe 44 gate satisfied

### Recipe 45

Objective: Deterministic gate pattern 45.

Evidence declarations:
- evt-45: event evidence with minimum count 1
- sel-45: selector evidence target exists
- sld-45: optional slide evidence

Completion pattern:
- all(evidence(evt-45), evidence(sel-45))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 45
- if blocked, inspect observed traces for evt-45 and selector state

Blocked examples:
- Need event demo:event:45 x1 (have 0)
- Evidence not met for selector sel-45

Template snippet:
- id: recipe-45
- evidence ids: evt-45, sel-45, sld-45
- success text: Recipe 45 gate satisfied

### Recipe 46

Objective: Deterministic gate pattern 46.

Evidence declarations:
- evt-46: event evidence with minimum count 1
- sel-46: selector evidence target exists
- sld-46: optional slide evidence

Completion pattern:
- any(evidence(evt-46), all(evidence(sel-46), slide(N)))
- reason: fallback if event is delayed in rehearsal

Operator cue:
- announce expected evidence for step 46
- if blocked, inspect observed traces for evt-46 and selector state

Blocked examples:
- Need event demo:event:46 x1 (have 0)
- Evidence not met for selector sel-46

Template snippet:
- id: recipe-46
- evidence ids: evt-46, sel-46, sld-46
- success text: Recipe 46 gate satisfied

### Recipe 47

Objective: Deterministic gate pattern 47.

Evidence declarations:
- evt-47: event evidence with minimum count 1
- sel-47: selector evidence target exists
- sld-47: optional slide evidence

Completion pattern:
- all(slide(N), any(evidence(evt-47), evidence(sel-47)))
- reason: enforce navigation before action closure

Operator cue:
- announce expected evidence for step 47
- if blocked, inspect observed traces for evt-47 and selector state

Blocked examples:
- Need event demo:event:47 x1 (have 0)
- Evidence not met for selector sel-47

Template snippet:
- id: recipe-47
- evidence ids: evt-47, sel-47, sld-47
- success text: Recipe 47 gate satisfied

### Recipe 48

Objective: Deterministic gate pattern 48.

Evidence declarations:
- evt-48: event evidence with minimum count 1
- sel-48: selector evidence target exists
- sld-48: optional slide evidence

Completion pattern:
- all(evidence(evt-48), evidence(sel-48))
- reason: strict action plus target proof

Operator cue:
- announce expected evidence for step 48
- if blocked, inspect observed traces for evt-48 and selector state

Blocked examples:
- Need event demo:event:48 x1 (have 0)
- Evidence not met for selector sel-48

Template snippet:
- id: recipe-48
- evidence ids: evt-48, sel-48, sld-48
- success text: Recipe 48 gate satisfied

## Troubleshooting Matrix

| Symptom | Cause | Action |
|---|---|---|
| step blocked | missing event | verify event name and count |
| step blocked | missing selector | verify anchor mounted |
| step blocked | wrong slide | verify slide index mapping |
| unstable state | random logic | remove random and timing dependencies |

## Shipping Checklist

- [ ] checkpoint 1: blocker explanation and evidence traces are clear
- [ ] checkpoint 2: blocker explanation and evidence traces are clear
- [ ] checkpoint 3: blocker explanation and evidence traces are clear
- [ ] checkpoint 4: blocker explanation and evidence traces are clear
- [ ] checkpoint 5: blocker explanation and evidence traces are clear
- [ ] checkpoint 6: blocker explanation and evidence traces are clear
- [ ] checkpoint 7: blocker explanation and evidence traces are clear
- [ ] checkpoint 8: blocker explanation and evidence traces are clear
- [ ] checkpoint 9: blocker explanation and evidence traces are clear
- [ ] checkpoint 10: blocker explanation and evidence traces are clear
- [ ] checkpoint 11: blocker explanation and evidence traces are clear
- [ ] checkpoint 12: blocker explanation and evidence traces are clear
- [ ] checkpoint 13: blocker explanation and evidence traces are clear
- [ ] checkpoint 14: blocker explanation and evidence traces are clear
- [ ] checkpoint 15: blocker explanation and evidence traces are clear
- [ ] checkpoint 16: blocker explanation and evidence traces are clear
- [ ] checkpoint 17: blocker explanation and evidence traces are clear
- [ ] checkpoint 18: blocker explanation and evidence traces are clear
- [ ] checkpoint 19: blocker explanation and evidence traces are clear
- [ ] checkpoint 20: blocker explanation and evidence traces are clear
- [ ] checkpoint 21: blocker explanation and evidence traces are clear
- [ ] checkpoint 22: blocker explanation and evidence traces are clear
- [ ] checkpoint 23: blocker explanation and evidence traces are clear
- [ ] checkpoint 24: blocker explanation and evidence traces are clear
- [ ] checkpoint 25: blocker explanation and evidence traces are clear
- [ ] checkpoint 26: blocker explanation and evidence traces are clear
- [ ] checkpoint 27: blocker explanation and evidence traces are clear
- [ ] checkpoint 28: blocker explanation and evidence traces are clear
- [ ] checkpoint 29: blocker explanation and evidence traces are clear
- [ ] checkpoint 30: blocker explanation and evidence traces are clear
- [ ] checkpoint 31: blocker explanation and evidence traces are clear
- [ ] checkpoint 32: blocker explanation and evidence traces are clear
- [ ] checkpoint 33: blocker explanation and evidence traces are clear
- [ ] checkpoint 34: blocker explanation and evidence traces are clear
- [ ] checkpoint 35: blocker explanation and evidence traces are clear
- [ ] checkpoint 36: blocker explanation and evidence traces are clear
- [ ] checkpoint 37: blocker explanation and evidence traces are clear
- [ ] checkpoint 38: blocker explanation and evidence traces are clear
- [ ] checkpoint 39: blocker explanation and evidence traces are clear
- [ ] checkpoint 40: blocker explanation and evidence traces are clear

End of evidence recipes catalog.
