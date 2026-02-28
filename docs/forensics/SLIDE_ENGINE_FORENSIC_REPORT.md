# Slide00 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide00 implementa un runtime de boot con estado persistible y un ritual gestual de sellado (First Proof) en paralelo. El runtime de boot registra eventos de entrada, anclas, armado, confirmación, override y reset local, y sincroniza evidencia bloqueante. El ritual First Proof exige secuencia drag -> hold -> release para marcar el estado como sealed. También existe una capa operativa de diagnóstico (dock, métricas, snapshot export/copy/download). El slide combina contratos de evidencia (boot runtime) con contrato gestual determinístico (first-proof helpers).

2) PRIMARY INTERACTION
- Gesto principal: combinación de click (arm/confirm/override/reset) + pointer ritual (drag horizontal, hold, release).
- Tipo: click + pointer hold.
- Bypass: sí, vía `override` (operator-assisted) en boot runtime.
- Autoplay: no en el ritual; el autoplay es global de app bajo investor lock.
- Randomness: no en la máquina de ritual; sí hay dependencia temporal (`Date.now` / `performance.now`) para logs y ticks.

3) STATE MODEL
- FSM: sí, doble capa.
- Boot states: `IDLE`, `ARMED_PENDING_CONFIRM`, `ARMED_CONFIRMED`, `OPERATOR_ASSISTED`.
- First Proof states: `idle`, `dragging`, `drag-satisfied`, `holding`, `hold-satisfied`, `sealed`.
- Transiciones con guardas: sí (confirm sólo en pending; release sella sólo con drag+hold satisfechos).
- Orden irreversible: en First Proof, el orden útil es secuencial; en boot puede volver por reset.
- Estados omitibles: en First Proof no (sin drag+hold no hay seal); en boot sí hay camino asistido con override.
- Reducer/actions (boot runtime): `BOOT_RUNTIME_RECORD_SLIDE_ENTRY`, `BOOT_RUNTIME_RECORD_ANCHOR_INTERACTION`, `BOOT_RUNTIME_REQUEST_ARM`, `BOOT_RUNTIME_CONFIRM_ARM`, `BOOT_RUNTIME_SET_OVERRIDE`, `BOOT_RUNTIME_ADD_LOG`, `BOOT_RUNTIME_RESET_LOCAL`, `BOOT_RUNTIME_RESTORE`.
- Variables derivadas: `gateLocked`, `canArm`, `canConfirm`, `isArmed`, `isOperatorAssisted`, diagnósticos de blockers.

4) GESTURE MECHANICS (DETAILED)
- Usa `pointerdown/pointermove/pointerup/pointercancel`: sí.
- Threshold logic: sí (`dragThresholdPx`, `dragDirectionRatio`, `holdDurationMs`).
- RAF loop: sí, `hold_tick` por `requestAnimationFrame`.
- Reset on release: sí, release antes de umbral marca `releaseBlocked` y no sella.
- Anti-trap guard: sí, bloqueo explícito de release sin drag+hold completos y cancelación por pérdida/cancel de pointer.

5) GUARDS & CONTRACTS
- Restricción de orden: sí, drag válido antes de hold, hold completo antes de release sellado.
- Checks de ID: sí, `activePointerId` debe coincidir.
- Threshold checks: sí (distancia, ratio de dirección, duración).
- Stage checks: sí (confirm arm en pending; sealed bloquea nuevos pointer starts).
- Expected-step constraints: sí, implícitas por etapa del ritual.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí, boot event log y operator log; first-proof emite señales anchor/evidence.
- Dónde: estado de boot runtime (`eventLog`, `operatorLog`) y snapshot serializable.
- Export JSON: sí (boot snapshot JSON).
- Replay desde JSON: sí para boot snapshot (`BOOT_RUNTIME_RESTORE`); first-proof tiene utilidades de replay por trace en módulo, no panel operativo dedicado en UI principal.
- Determinismo de replay: condicional (determinístico sobre payload/snapshot, con timestamps externos en logs en modo vivo).
- ¿Acciones vacías?: sí; snapshot puede existir sin eventos de interacción y traces de replay pueden estar vacíos.
- Replay reducer explícito: sí en boot runtime (restore snapshot) y utilitario explícito en `firstProof.replay.ts`.

7) HUD / DEBUG LAYER
- Debug overlay: sí.
- Métricas visibles: estado boot, gate, blockers, últimos eventos, hash/snapshot, estado ritual y thresholds (en debug overlay de First Proof).
- Toggle: sí (diagnostics dock toggle; first-proof debug por query/localStorage + `import.meta.env.DEV`).
- Default hidden: sí, el overlay de debug first-proof está oculto por defecto.

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
El core de transición es determinístico por evento, pero el runtime incorpora tiempo real, almacenamiento local y flags de entorno.

9) ARCHITECTURAL DEPTH
FSM-DRIVEN + THIN ORCHESTRATOR  
Archivos clave: `components/slides/Slide00.tsx`, `runtime/boot/runtimeReducer.ts`, `runtime/boot/BootRuntimeContext.tsx`, `components/slides/slide00-ui/first-proof/firstProof.helpers.ts`, `components/slides/slide00-ui/first-proof/useFirstProofRitual.ts`.

10) RISK NOTES
- Puede fallar silenciosamente si clipboard/download API no está disponible (se registra warning).
- Sí existen rutas con acciones vacías (snapshot/replay sin eventos).
- Pointer events pueden cancelarse por blur/cancel/lost capture (hay guardas, pero el efecto percibido puede ser reset).
- El layering es alto (runtime + first-proof + diagnostics + WOW flags).
- Fragilidad media por combinación de múltiples banderas y persistencia.

# Slide01 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide01 implementa un selector de ruta basado en gesto de puntero y un reducer determinístico. El usuario arrastra en un panel de ponderación; el reducer calcula métricas de gesto y score Route A/B. El flujo de fase pasa por `idle -> aiming -> weighing -> committed -> resolved`. El slide incluye captura de traza pointer, export/copy JSON, carga de sample y replay. La UI es una capa de orquestación de paneles sobre un core fsm/replay.

2) PRIMARY INTERACTION
- Gesto principal: drag sobre `WeighPanel`.
- Tipo: pointer drag + release.
- Bypass: sí, carga de replay JSON aplica estado sin gesto en vivo.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: sí.
- States: `idle`, `aiming`, `weighing`, `committed`, `resolved`.
- Transiciones guardadas: sí por pointer state e id activo.
- Orden irreversible: parcial; reset reinicia sesión.
- Saltos de estado: no en flujo normal; replay puede reconstruir directo el estado final desde traza.
- Action types: `POINTER_EVENT`, `RESOLVE_COMMITTED`, `RESET`, `TOGGLE_HUD`, `REPLAY_APPLY`, `REPLAY_ERROR`, `REPLAY_NOTE`.
- Derived state: `metrics`, `score`, `decision`, `phaseHistory`, `replay.status`, `hudVisible`.

4) GESTURE MECHANICS (DETAILED)
- `pointerdown/pointerup`: sí.
- Threshold logic: sí (`SLIDE01_MOVEMENT_THRESHOLD` para pasar a `weighing`).
- RAF loop: no.
- Reset on release: no reset automático completo; release lleva a `committed`, luego `RESOLVE_COMMITTED`.
- Anti-trap guard: sí, se ignoran move/up si `pointerDown` no activo o `pointerId` no coincide.

5) GUARDS & CONTRACTS
- Orden: down -> move/up válidos sólo en fases permitidas.
- ID checks: sí (`activePointerId`).
- Threshold: sí (movimiento mínimo para `weighing`).
- Stage checks: sí (`RESOLVE_COMMITTED` sólo en `committed`).
- Expected-step constraints: sí, implícitas por fase.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí, `trace` pointer normalizada.
- Dónde: estado reducer + envelope JSON `slide01.trace.v1`.
- Export JSON: sí.
- Replay JSON: sí (`parseTraceEnvelope` + `replayResult`).
- Determinismo replay: sí, replay siempre inicia en estado inicial.
- ¿Acciones vacías?: sí, envelope con `events: []` es válido y produce estado inicial.
- Replay reducer explícito: sí (`REPLAY_APPLY` + runner dedicado).

7) HUD / DEBUG LAYER
- Debug overlay: sí (`DevHud`).
- Métricas visibles: fase, score/metric snapshots, replay status, señales de criterio.
- Toggle: sí (`TOGGLE_HUD`).
- Default hidden: sí.

8) DETERMINISM ASSESSMENT
STRICTLY DETERMINISTIC  
No usa random ni timers en transición de estado; replay parte siempre de estado inicial determinístico.

9) ARCHITECTURAL DEPTH
REDUCER-DRIVEN + THIN ORCHESTRATOR  
Archivos clave: `components/slides/Slide01.tsx`, `components/slides/slide01-ui/core/fsm/reducer.ts`, `components/slides/slide01-ui/core/replay/trace.ts`, `components/slides/slide01-ui/ui/scene/Slide01Scene.tsx`.

10) RISK NOTES
- Eventos de pointer con id no esperado se descartan (puede percibirse como no respuesta).
- Sí acepta replay vacío.
- Sin riesgo relevante de bloqueo por layering en este slide.
- Fragilidad baja; contrato está explícito y testeado por unidades.

# Slide02 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide02 implementa una máquina de estado por reducer para seleccionar ruta, ajustar constraints y recalcular evidencia del sistema. No depende de gestos complejos: usa controles directos (select/range/buttons). La máquina conserva traza de acciones (`boot`, `set-*`, `reset-constraints`, `replay-applied`) y firma de salida (`response.signature`). Tiene pipeline de replay versionado (`slide02.replay.v1`) con parse/sanitización/aplicación. La UI se limita a paneles de control, evidencia, HUD opcional y replay.

2) PRIMARY INTERACTION
- Gesto principal: click/select/slider.
- Tipo: click/toggle/range input.
- Bypass: sí, replay staged/apply.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: sí (status machine).
- States: `BOOTSTRAPPED`, `INTERACTIVE`, `REPLAY_READY`, `REPLAY_APPLIED`, `REPLAY_ERROR`.
- Transiciones guardadas: sí (parse válido, constraints sanitizadas, no-op cuando valor no cambia).
- Orden irreversible: no, puede volver por reset/clear.
- Saltos: sí, replay puede mover a estado aplicado directo.
- Action types: `BOOT`, `SET_ROUTE`, `SET_STRICTNESS`, `SET_BUDGET_GUARD`, `SET_LATENCY_GUARD`, `RESET_CONSTRAINTS`, `TOGGLE_HUD`, `REPLAY_STAGE_JSON`, `REPLAY_APPLY_STAGED`, `REPLAY_CLEAR`.
- Derived variables: `response`, `trace`, `status`, `hudOpen`, `replay.stagedPayload`, `replay.stagedError`, `sequence`.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Condiciones que habilitan: controles siempre habilitados salvo guardas de no-op en mismos valores.
- Condiciones que bloquean: replay apply sin payload staged; parse inválido fuerza estado `REPLAY_ERROR`.

5) GUARDS & CONTRACTS
- Order constraints: replay payload debe cumplir versión y shape.
- ID checks: route ids normalizados contra catálogo.
- Threshold checks: constraints clamp/sanitize.
- Stage checks: replay apply requiere `stagedPayload`.
- Expected-step constraints: no secuencia rígida de pasos de UI.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí (trace del machine + transform a replay events).
- Dónde: `state.trace` y payload replay.
- Export JSON: sí (`exportReplayJson`/serializer).
- Replay JSON: sí (`parseReplayPayload` + `applyReplayPayload`).
- Determinismo replay: sí, misma base + mismo trace => misma signature.
- ¿Acciones vacías?: sí, `trace: []` válido; mantiene estado base.
- Replay reducer explícito: sí (`REPLAY_STAGE_JSON`, `REPLAY_APPLY_STAGED`, `REPLAY_CLEAR`).

7) HUD / DEBUG LAYER
- Debug overlay: HUD técnico.
- Métricas visibles: route, constraints, status, signature, trace length.
- Toggle: sí (`TOGGLE_HUD`).
- Default hidden: sí.

8) DETERMINISM ASSESSMENT
STRICTLY DETERMINISTIC  
Modelo y replay usan normalización/sanitización sin random ni timers.

9) ARCHITECTURAL DEPTH
REDUCER-DRIVEN + THIN ORCHESTRATOR  
Archivos clave: `components/slides/Slide02.tsx`, `components/slides/slide02-ui/core/fsm.ts`, `components/slides/slide02-ui/core/replay.ts`, `components/slides/slide02-ui/ui/Scene.tsx`.

10) RISK NOTES
- Interacción inválida en replay cae a `REPLAY_ERROR` sin crash.
- Sí acepta replay con trace vacío.
- Riesgo bajo de interacción “muerta”; controles tienen feedback de estado.

# Slide03 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide03 implementa un “evidence ladder” de tres pasos con contrato estricto de orden y sellado final. Cada tarjeta requiere gesto pointer sobre riel hasta umbral, luego confirmación explícita por botón. El reducer registra cada acción con envelope accepted/rejected y razón de rechazo, y mantiene replay log. Hay herramientas de build/play/copy replay JSON en la UI y validación de expectativas finales (stage/confidence/uncertainty/seal). El runtime actual está orientado a trazabilidad de decisiones más que a narrativa visual.

2) PRIMARY INTERACTION
- Gesto principal: pointer drag en cada card + click de `confirm`.
- Tipo: pointer + click.
- Bypass: sí, replay JSON o replay capturado.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: sí.
- States: `idle`, `step1`, `step2`, `step3`, `sealed`.
- Card states: `pending`, `in_progress`, `armed`, `revealed`, `locked`, `disabled`.
- Transiciones guardadas: sí (step esperado, pointer id, armado previo, stage de seal).
- Orden irreversible: sí para progresión de reveal; reset reinicia sesión.
- Saltos: no en interacción válida; replay puede intentar saltar y produce acciones rechazadas.
- Action types: `POINTER_START`, `POINTER_FRAME`, `POINTER_END`, `POINTER_CANCEL`, `CONFIRM_STEP`, `COMMIT_SEAL`, `RESET_SESSION`, `REPLACE_STATE`.
- Derived variables: `revealedSteps`, `nextExpectedStep`, `evaluation`, `replaySummary`, `transitionCount`.

4) GESTURE MECHANICS (DETAILED)
- `pointerdown/pointerup`: sí en `EvidenceCard`.
- Threshold logic: sí, cada card tiene `unlockThreshold`.
- RAF loop: sí, la card emite frames continuos con `requestAnimationFrame`.
- Reset on release: sí, si no alcanza umbral, progress vuelve a 0 (`pointer-end-reset`).
- Anti-trap guard: sí (cancel en blur/lost capture/pointer-cancel, id mismatch, expected-step guard); click fallback sintetiza gesto completo si no está armado.

5) GUARDS & CONTRACTS
- Order constraints: sólo `nextExpectedStep` puede avanzar.
- ID checks: sí, pointer id y step id deben coincidir con pointer activo.
- Threshold checks: confirm bloqueado sin `armed`.
- Stage checks: `COMMIT_SEAL` sólo en `step3` y con seal level requerido.
- Expected-step only: sí, explícito (`confirm-step-not-next-expected`, `pointer-start-not-next-expected`).

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí (`replayLog`) con envelope y origen.
- Dónde: estado de máquina + payload v1 generado.
- Export JSON: sí (build replay).
- Replay JSON: sí (parse + run + assertions finales).
- Determinismo replay: sí; playback arranca de estado inicial del input model.
- ¿Acciones vacías?: sí, payload puede tener `actions: []`; en ese caso pasa/falla según expectativas declaradas.
- Replay reducer explícito: sí (`playReplayPayload`, `runReplayFromJson`, status marker).

7) HUD / DEBUG LAYER
- Debug overlay: HUD + diagnósticos DEV.
- Métricas visibles: stage, next step, reveal count, seal level, replay counters, último resultado.
- Toggle: sí (`show hud`).
- Default hidden: sí.

8) DETERMINISM ASSESSMENT
STRICTLY DETERMINISTIC  
La transición se resuelve por reducer puro y replay validado con expectativas.

9) ARCHITECTURAL DEPTH
FSM-DRIVEN + REDUCER-DRIVEN  
Archivos clave: `components/slides/Slide03.tsx`, `components/slides/slide03-ui/core/fsm/reducer.ts`, `components/slides/slide03-ui/core/replay/replay.ts`, `components/slides/slide03-ui/ui/EvidenceCard.tsx`.

10) RISK NOTES
- Rechazos de acción son explícitos en envelope, pero si HUD está oculto pueden sentirse como “no pasó nada”.
- Sí puede haber replay vacío.
- Layering moderado; pointer capture está protegido con cancel paths.
- Fragilidad baja-media por complejidad de reglas de orden.

# Slide04 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide04 implementa un lock/handoff engine con selección de ruta, matriz de restricciones, evidencia seleccionable y acción final hold-to-seal. El estado principal es una FSM de lock phase y hold progress con guardas operativas. Al sellar, genera resumen firmado (`slide04-summary.v1`) y hash de sello. Incluye captura de trace de acciones, serialización a replay JSON, decode y playback desde estado inicial. La UI refleja guard failures y progreso de hold en tiempo real.

2) PRIMARY INTERACTION
- Gesto principal: hold pointer sobre botón de seal.
- Tipo: pointer hold + release; click para route/constraint/evidence.
- Bypass: sí, replay playback desde JSON.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: sí.
- States: `idle`, `arming`, `locking`, `sealed`.
- Transiciones guardadas: sí (pre-lock y final-lock guard evaluados).
- Orden irreversible: no, existe `seal.unseal` y `seal.reset`.
- Saltos: replay puede reconstruir rutas no lineales válidas.
- Action types: `route.select`, `route.clear`, `constraint.set`, `evidence.toggle`, `seal.pointer.down`, `seal.pointer.tick`, `seal.pointer.up`, `seal.pointer.cancel`, `seal.unseal`, `seal.reset`, `replay.applied`, `replay.failed`.
- Derived variables: `canArm`, `canAttemptLock`, `holdPercentLabel`, `summaryHash`, `replayStatus`.

4) GESTURE MECHANICS (DETAILED)
- `pointerdown/pointerup`: sí en `SealAction`.
- Threshold logic: sí (`hold.progress` debe llegar a 1).
- RAF loop: sí (ticks continuos durante hold).
- Reset on release: sí, release incompleto resetea hold y vuelve a arming con guard failure.
- Anti-trap guard: sí, cancel por `pointer-cancel`, `blur`, `unmount`, `lost-capture`.

5) GUARDS & CONTRACTS
- Order constraints: route requerida antes de seal.
- ID checks: route/constraint/evidence ids validados en replay decode.
- Threshold checks: hold completo obligatorio.
- Stage checks: acciones inválidas por fase generan `invalid-phase` o ignore.
- Expected-step only: sí, lock flow exige precondiciones (`insufficient-evidence`, `blocked-constraints`).

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí (trace capture por `actionToReplayEvent`).
- Dónde: `traceCapture.events` y replay JSON `slide04-replay.v1`.
- Export JSON: sí.
- Replay JSON: sí (`decodeReplayTrace`, `applyReplayJson`, `playbackReplayTrace`).
- Determinismo replay: sí, playback arranca de `createInitialLockState()`.
- ¿Acciones vacías?: sí, `events: []` es válido y deja estado base (con `replay.applied`).
- Replay reducer explícito: sí, estado marca `replay.applied` o `replay.failed`.

7) HUD / DEBUG LAYER
- Debug overlay: HUD técnico (`phase`, `trace`, `hash`, `hold`).
- Métricas visibles: fase, longitud de traza, hash de resumen, porcentaje hold.
- Toggle: condicional por query `slide04Hud=1` o prop `showHud`.
- Default hidden: sí.

8) DETERMINISM ASSESSMENT
STRICTLY DETERMINISTIC  
Reducer y playback son determinísticos; el tiempo entra como `atMs` explícito.

9) ARCHITECTURAL DEPTH
FSM-DRIVEN + REDUCER-DRIVEN  
Archivos clave: `components/slides/Slide04.tsx`, `components/slides/slide04-ui/core/fsm.ts`, `components/slides/slide04-ui/core/replay.ts`, `components/slides/slide04-ui/ui/SealAction.tsx`.

10) RISK NOTES
- Puede percibirse “fallo silencioso” cuando guardas bloquean seal sin HUD abierto.
- Replay vacío es posible.
- Pointer cancellation reinicia progreso (comportamiento explícito pero sensible a blur).
- Layering medio con paneles/replay/summary.
# Slide05 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide05 implementa una superficie de módulos técnicos con hover/click/focus por tarjeta y animación visual CSS. Cada módulo mantiene estado local de hover para revelar descripción y estilos. El slide emite eventos de guía (`emitSlideGuideEvent`) sólo cuando `interactiveOn` está activo. Con la configuración actual (`.env.local`), `WOW_SLIDE05_INTERACTIVE` y `WOW_GUIDE_ENGINE` no están activados, por lo que la emisión de eventos queda deshabilitada. El comportamiento funcional real queda en UI de hover sin evidencia emitida.

2) PRIMARY INTERACTION
- Gesto principal: hover/click (también Enter/Space sobre card).
- Tipo: mouse hover + click + keyboard activation.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados explícitos: hover local por módulo (`true/false`).
- Transiciones guardadas: sólo gating de emisión por `interactiveOn`.
- Orden irreversible: no.
- Estados omitibles: sí, interacción puede no disparar side-effects si flags off.
- Reducer/actions: no aplica.
- Variables derivadas: `interactiveOn`, `extraHeightOn`.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Condiciones enable: tarjeta siempre interactuable para hover/click visual.
- Condiciones block: emisión de evento se bloquea cuando `interactiveOn` es `false`.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: usa `moduleId` fijo en payload de evento cuando emite.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine; las emisiones pueden quedar en cero por gating.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE  
Es una interacción UI local sin máquina/replay formal.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide05.tsx`, `config/wow.ts`.

10) RISK NOTES
- Interacción puede sentirse “viva” visualmente pero sin efectos contractuales (eventos no emitidos).
- Acciones contractuales efectivas pueden quedar vacías por flags.
- Sin riesgo de pointer-capture traps.
- Fragilidad baja en lógica, media en expectativas de instrumentación.

# Slide06 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide06 implementa una vista blueprint interactiva con tres nodos (`CAD`, `OEM`, `OUT`) y HUD descriptivo acoplado a hover/selección. El panel derecho permite hover para inspección temporal y click para lock/unlock de nodo. Incluye retícula/reticle con suavizado por RAF y modo de scan (`ambient`/`active`) dependiente de interacción y reduced-motion. El slide ejecuta un micro tutorial secuencial por `setTimeout` en primera visita y persiste esa marca en `localStorage`. No hay reducer ni trazabilidad de replay.

2) PRIMARY INTERACTION
- Gesto principal: hover + click en nodos; click vacío para limpiar lock.
- Tipo: mouse enter/leave/click + keyboard Enter/Space en nodos.
- Bypass: sí, se puede inspeccionar sólo con hover sin fijar.
- Autoplay: sí, sólo para tutorial visual inicial (secuencia temporal).
- Randomness: no.

3) STATE MODEL
- FSM: no formal.
- Estados locales principales: `hovered`, `selected`, `tutorialFlash`, `mode` (`ambient`/`active`), `reticle`.
- Transiciones guardadas: sí, `selected` alterna toggle; reduced-motion fuerza modo ambiental.
- Orden irreversible: no.
- Estados omitibles: sí (tutorial se omite cuando localStorage ya marcado).
- Reducer/actions: no aplica.
- Variables derivadas: `activeNode`, flags de conectores (`aCAD`, `aOEM`), opacidad de ambiente.

4) GESTURE MECHANICS (DETAILED)
- Pointer-based de bajo nivel: no usa `pointerdown/pointerup`; usa `onMouseMove/onMouseEnter/onMouseLeave`.
- Threshold logic: no de gesto contractual.
- RAF loop: sí para interpolación de reticle.
- Reset on release: no aplica.
- Anti-trap guard: click en contenedor limpia selección para evitar lock residual.

5) GUARDS & CONTRACTS
- Order constraints: no secuencia obligatoria.
- ID checks: selección por `NodeType`.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine formal.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no overlay técnico explícito.
- Métricas visibles: HUD narrativo de nodo activo (no debug telemétrico).
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
Sin random, pero depende de timers de tutorial, RAF y persistencia localStorage.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide06.tsx`.

10) RISK NOTES
- La primera ejecución difiere de sesiones siguientes por bandera de tutorial en localStorage.
- No hay acciones/replay formales.
- Layering visual alto; se mitiga con `pointer-events-none` en capas ambientales.
- Fragilidad media por tamaño monolítico del componente.

# Slide07 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide07 registrado monta `components/slides/Slide7.tsx` (no `Slide07.tsx`). La implementación actual es un dashboard visual con input telemetry hover-driven, gauge animado y menú de reporte. Tiene estados locales para input activo, menú (`open/dir/preview`) y animaciones numéricas. Las acciones de “open/export” no ejecutan lógica de negocio; `runAction` hace `void a`. El slide no expone reducer/FSM formal ni replay/evidence pipeline.

2) PRIMARY INTERACTION
- Gesto principal: hover sobre filas de telemetría y click en menú de reporte.
- Tipo: hover/click + keyboard Escape para cerrar menú.
- Bypass: sí, menú puede cerrarse con click fuera o Escape.
- Autoplay: no.
- Randomness: no en señal principal (sparks por PRNG semillado determinístico).

3) STATE MODEL
- FSM: no formal.
- Estados locales: `activeInput`, `menuOpen`, `menuDir`, `preview`, animaciones (`useAnimatedNumber`).
- Transiciones guardadas: sí, menú cierra por click fuera/Escape.
- Orden irreversible: no.
- Saltos: no aplica.
- Reducer/actions: no aplica.
- Variables derivadas: score/gauge por `activeInput`, preview panel por `preview`.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Condiciones enable: botones de menú siempre habilitados.
- Condiciones block: eventos de cierre ignoran clicks dentro de `[data-report-menu]`.
- Anti-trap: listeners globales (`mousedown`, `keydown`) cierran menú.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no contract id estricto.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: sí, acciones de menú (`open/pdf/csv/workOrder`) son funcionalmente vacías (`runAction` sin efecto).
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: score/risk visual en UI principal.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
Sin random directo en el core visual, pero sin engine formal y con eventos de UI/timing local.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide7.tsx`.  
Nota estructural relevante: existe `components/slides/Slide07.tsx` con otro engine, pero no está montado en el slot registrado.

10) RISK NOTES
- Acciones principales de salida están vacías (puede sentirse “dead click”).
- No hay replay/evidence.
- Capa de menú + dim global incrementa complejidad visual.
- Riesgo estructural por desalineación entre implementación montada y alternativa no montada.

# Slide08 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide08 es un wrapper de `IndustrialIntelligenceStack`, que renderiza tarjetas de stack industrial con revelado por etapas y efectos de tilt/hover. El comportamiento central es visual: secuencia de entrada por `setTimeout`, hover de tarjetas y panel dashboard al final. No existe machine reducer/FSM formal ni contrato de replay. La lógica es local y basada en estado de componente (`hover`, `stage`, `tilt`). Incluye partículas ambientales generadas dinámicamente en render.

2) PRIMARY INTERACTION
- Gesto principal: hover sobre cards + movimiento de mouse para tilt.
- Tipo: hover/mousemove.
- Bypass: no aplica.
- Autoplay: sí (staged reveal por timers).
- Randomness: sí (`Math.random()` en `AmbientParticles`).

3) STATE MODEL
- FSM: no formal.
- Estados: `hover`, `stage`, `tilt`.
- Transiciones guardadas: no estrictas.
- Orden irreversible: no.
- Estados omitibles: sí, dependiendo de interacción/tiempo de render.
- Reducer/actions: no aplica.
- Variables derivadas: dimming según card activa.

4) GESTURE MECHANICS (DETAILED)
- Pointer-based contractual: no.
- Threshold logic: no.
- RAF loop: no (usa `setTimeout`/mouse events).
- Reset on release: tilt se resetea con `onMouseLeave`.
- Anti-trap guard: no guardas explícitas de captura.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no contract checks.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: sólo labels/status decorativos.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NON-DETERMINISTIC  
Usa `Math.random()` para partículas y timers de staged reveal.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide08.tsx`, `components/IndustrialStack.tsx`.

10) RISK NOTES
- Variación visual entre renders por randomness.
- Sin replay/evidence.
- En dispositivos sin hover puede perderse parte del feedback.
- Fragilidad media por alto acoplamiento visual en un solo widget.

# Slide09 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide09 implementa un state machine local de evidencia con planos `IDLE/ACCESS/REGISTER/LOCKED`, más overlay contextual y auditoría in-memory. La interacción está centrada en nodos operativos (hover/click/keyboard), con auto-lock temporal tras registro. Hay múltiples capas visuales (BG/FX/UI/OVERLAY) pero la lógica vive en el mismo archivo. El sistema mantiene telemetry (`dt`, `progress`, node/lock ids) y trail de eventos para debug local. No hay replay JSON formal.

2) PRIMARY INTERACTION
- Gesto principal: hover/click en nodos; teclado (`ArrowUp/Down`, `Enter`, `Escape`, `L`, `D`).
- Tipo: click/hover + keyboard.
- Bypass: sí, teclado puede recorrer/seleccionar sin mouse.
- Autoplay: parcial (transición automática REGISTER -> LOCKED por timer RAF + `registerMs`).
- Randomness: no.

3) STATE MODEL
- FSM: sí (local hook `useEvidenceStateMachine`).
- States: `IDLE`, `ACCESS`, `REGISTER`, `LOCKED`.
- Transiciones guardadas: sí (`setHover` bloqueado si locked, lock por elapsed threshold, outside click limpia lock).
- Orden irreversible: no.
- Saltos: sí, teclado permite saltos directos entre nodos.
- Reducer/actions: no reducer formal; transición vía setters/hook.
- Variables derivadas: `telemetry.progress`, `overlayOpen`, `observer` idle halo, `debugOn`.

4) GESTURE MECHANICS (DETAILED)
- Pointerdown/up threshold: no.
- Click-based enable: cards de nodo activas y overlay actions.
- Block conditions: hover ignorado cuando `lockedId` activo; overlay suprimible.
- RAF loop: sí para lock timing y observador de idle.
- Reset: `Escape` resetea estado; click fuera limpia lock.
- Anti-trap guard: overlay captura dentro y dismiss fuera.

5) GUARDS & CONTRACTS
- Order constraints: registro antes de lock.
- ID checks: node id validado por catálogo.
- Threshold checks: `registerMs` para lock automático.
- Stage checks: overlay sólo en `REGISTER/LOCKED` (salvo supresión).
- Expected-step constraints: no secuencia lineal estricta entre nodos.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí, `auditTrail` en memoria (eventos locales).
- Dónde: `useRef` audit trail.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica (sin motor de replay).
- ¿Acciones vacías?: sí, puede operar sin capturas persistibles/exportables.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: sí (toggle con tecla `D`).
- Métricas visibles: phase, progress, dt, node/lock, último evento trail.
- Toggle: sí.
- Default hidden: sí.

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
La lógica depende de `performance.now`/RAF y tiempos de interacción.

9) ARCHITECTURAL DEPTH
FSM-DRIVEN (LOCAL HOOK) + LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide09.tsx`.

10) RISK NOTES
- Sin export/replay persistente.
- Guardas pueden descartar interacciones cuando está lockeado (si debug off puede parecer bloqueo opaco).
- Layering complejo (BG/FX/UI/OVERLAY + keyboard paths).
- Fragilidad media-alta por archivo monolítico extenso.
# Slide10 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide10 renderiza un texto introductorio y el widget `HolographicFiles`. El widget muestra cuatro tarjetas documentales con hover reveal. No existe runtime de decisiones, FSM ni reducer. La lógica de interacción se resuelve por CSS (`group-hover`) y sin estado React local. Es un slide presentacional con affordance visual de hover.

2) PRIMARY INTERACTION
- Gesto principal: hover sobre cards.
- Tipo: hover.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados definidos: no state machine.
- Guardas/transiciones: no.
- Orden irreversible: no.
- Estados saltables: no aplica.
- Reducer/actions: no aplica.

4) GESTURE MECHANICS (DETAILED)
- Click-based/pointer-based contractual: no.
- Condiciones enable/block: sólo soporte de hover del dispositivo.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action model.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE

9) ARCHITECTURAL DEPTH
UI-ONLY PRESENTATIONAL  
Archivos clave: `components/slides/Slide10.tsx`, `components/widgets/HolographicFiles.tsx`.

10) RISK NOTES
- En touch/no-hover la interacción visible disminuye.
- Sin evidencia/replay.
- Riesgo bajo.

# Slide11 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide11 registrado monta `components/slides/Slide12.tsx` (desfase intencional de registry). La implementación actual muestra módulos core expandibles con estética dark/neon y señales WOW opcionales. La interacción real es toggle open/close por card y emisión de eventos de tour bajo flags. No hay reducer/FSM central del slide. Es una UI modular con estado local por tarjeta.

2) PRIMARY INTERACTION
- Gesto principal: click en `CoreCard` para abrir/cerrar.
- Tipo: click + hover.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no formal.
- Estados: `open` boolean por card.
- Transiciones guardadas: no estrictas; toggle directo.
- Orden irreversible: no.
- Saltos: no aplica.
- Reducer/actions: no aplica.
- Variables derivadas: estilos/rings y panel expandido.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Enable: cards clickables siempre.
- Block: ninguno funcional; emit de eventos depende de `WOW_DEMO && (WOW_MODEL_IMPACT || WOW_CORE_MODULES)`.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: module key fijo por card.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no replay; sólo `emitTourEvent` opcional.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: sí en términos de engine (no hay action trace).
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no HUD runtime; existe `debugGrid` interno (constante desactivada).
- Métricas visibles: no telemetría.
- Toggle: no expuesto.
- Default hidden: sí (debugGrid false).

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
Estado local es determinístico, pero depende de flags WOW/reduced-motion para efectos y emisión.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide12.tsx` (montado en slot 11).

10) RISK NOTES
- Desfase de mapping (slot 11 != archivo Slide11 inexistente).
- Sin replay/evidence formal.
- Interacciones contractuales dependen de flags de entorno.

# Slide12 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide12 registrado monta `components/slides/Slide13.tsx`, que ejecuta `KpiRitual` de `slide13-ui/routeb`. El motor es una máquina de transición pura basada en eventos de puntero y thresholds configurables. El ritual produce eventos canónicos de anchor/evidence al alcanzar hitos (drag complete, hold complete, release sealed). La UI separa superficie de gesto, rail de progreso y sello derecho. Existe utilería de replay determinístico por eventos en módulos core.

2) PRIMARY INTERACTION
- Gesto principal: pointer drag + hold + release.
- Tipo: pointer hold ritual.
- Bypass: reset disponible; no bypass de seal sin cumplir thresholds.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: sí.
- States: `Idle`, `Dragged`, `Holding`, `Sealed`.
- Seal states: `open`, `freezing`, `sealed`, `collapsed`.
- Transiciones guardadas: sí por pointer id, stage, thresholds.
- Orden irreversible: sí para progresión de stage (normalización monótona); reset reinicia.
- Saltos: no en transición válida.
- Reducer/actions: no reducer React, pero machine events explícitos (`pointer_down`, `pointer_move`, `pointer_up`, `pointer_cancel`, `reset`).
- Variables derivadas: `snapshot` (progress, railIndex, sealState, steps, totalProgress).

4) GESTURE MECHANICS (DETAILED)
- `pointerdown/pointerup`: sí.
- Threshold logic: sí (`dragThresholdPx`, `holdTravelThresholdPx`, `freezeFloor`, `releaseSnapPx`).
- RAF loop: no loop interno en hook; transición se procesa por eventos pointer.
- Reset on release: release sin condiciones mantiene estado parcial (no seal) y libera pointer.
- Anti-trap guard: sealed bloquea nuevos eventos; pointer id mismatch se ignora.

5) GUARDS & CONTRACTS
- Order constraints: drag antes de hold, hold antes de seal.
- ID checks: sí, `activePointerId`.
- Threshold checks: sí, drag/hold/release gating.
- Stage checks: sí, transición monótona (`normalizeStage`).
- Expected-step constraints: sí, implícitas por `activeStep`.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: en runtime UI no hay panel JSON; en core sí hay `replaySlide13Events` y fixtures.
- Dónde: módulo `slide13.replay.ts` (frames, emitted events, assertions).
- Export JSON: no UI directa.
- Replay JSON: no parser JSON en UI, replay es programático por lista de eventos.
- Determinismo replay: sí.
- ¿Acciones vacías?: sí, lista de eventos vacía deja estado inicial.
- Replay reducer explícito: sí, transición pura por evento (`transitionSlide13State`).

7) HUD / DEBUG LAYER
- Debug overlay: sí (`Slide13DebugOverlay`) sólo en DEV.
- Métricas visibles: stage, pointer, drag/hold/release progress, rail, seal, last event.
- Toggle: no toggle runtime; condicionado por `import.meta.env.DEV`.
- Default hidden: sí en build no DEV.

8) DETERMINISM ASSESSMENT
STRICTLY DETERMINISTIC  
Transición pura + thresholds resueltos sin random/timers.

9) ARCHITECTURAL DEPTH
FSM-DRIVEN + THIN ORCHESTRATOR  
Archivos clave: `components/slides/Slide13.tsx` (montado en slot 12), `components/slides/slide13-ui/routeb/useKpiRitual.ts`, `components/slides/slide13-ui/routeb/slide13.helpers.ts`, `components/slides/slide13-ui/routeb/slide13.replay.ts`.

10) RISK NOTES
- Sin panel de replay JSON en runtime final; replay queda como capacidad técnica de módulo/tests.
- Eventos pointer inválidos se ignoran silenciosamente.
- Riesgo bajo de nondeterminismo.

# Slide13 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide13 registrado monta `components/slides/Slide14.tsx`, que renderiza `MissionProgressBar`. El widget muestra tres fases y permite activar una por click. El cambio es local a `activePhase` y afecta estilos de barra y tarjetas. No hay engine de decisión ni evidencia/replay.

2) PRIMARY INTERACTION
- Gesto principal: click sobre fase.
- Tipo: click.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estado: `activePhase` (0..2).
- Guardas/transiciones: cambio directo por click.
- Orden irreversible: no.
- Saltos: sí, cualquier fase seleccionable en cualquier momento.
- Reducer/actions: no.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Enable: todas las fases activables.
- Block: no bloqueos.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no contract id.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide14.tsx`, `components/widgets/MissionProgressBar.tsx`.

10) RISK NOTES
- Interacción limitada; sin trazabilidad de acciones.
- Sin replay/evidence.
- Riesgo bajo.

# Slide14 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide14 registrado monta `components/slides/Slide15.tsx`, que renderiza `FinancialEquation`. Es un panel visual de tres columnas (costo actual, transformación, valor generado). No utiliza estado ni handlers de interacción. No hay runtime logic ni contrato de interacción.

2) PRIMARY INTERACTION
- Gesto principal: ninguno.
- Tipo: no interactivo.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados: no.
- Guardas/transiciones: no.
- Orden irreversible: no aplica.
- Saltos: no aplica.
- Reducer/actions: no.

4) GESTURE MECHANICS (DETAILED)
- Click-based: no.
- Enable/block conditions: no aplica.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action model.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no runtime metrics.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE

9) ARCHITECTURAL DEPTH
UI-ONLY PRESENTATIONAL  
Archivos clave: `components/slides/Slide15.tsx`, `components/widgets/FinancialEquation.tsx`.

10) RISK NOTES
- Interacción “dead” por diseño (sólo visual).
- Sin captura/replay/evidence.
# Slide15 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide15 registrado monta `components/slides/Slide16.tsx`, un monolito que integra módulos visuales, panel financiero, overlays y un orquestador de contexto narrativo. El estado está repartido entre submódulos locales (`FundsCore`, `ROISimulator`, overlays) y `OrchestratorProvider`. El orquestador registra eventos en memoria, calcula contexto por touched-events y emite ticks de idle por intervalo. No existe reducer único del slide completo ni replay JSON. Hay inconsistencias funcionales actuales: interacciones de `FundsCore` no emiten `hover_fund/lock_fund`, y `RiskCoverage` se invoca con props no consumidas por su contrato real.

2) PRIMARY INTERACTION
- Gesto principal: click/hover en controles y botones, sliders de ROI, apertura/cierre de overlays.
- Tipo: click/hover/slider + Escape para cerrar overlay.
- Bypass: sí, `forceContext` y botones de overlay cambian contexto sin pasar por todas las interacciones.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: parcial/local.
- Orchestrator context states: `idle`, `funds_overview`, `risk_review`, `roi_review`, `runway_review`, `ready_to_close`.
- Overlay state: `{ open, kind }`.
- Transiciones guardadas: sí, auto-context por set `touched`, close por Escape/click fuera.
- Orden irreversible: no.
- Saltos: sí, contexto cambia por prioridad de touched events.
- Reducer-based: no; usa múltiples `useState` y callbacks.
- Derived variables: `context`, `touched`, `events`, `lastActivity`, `elapsed`, copy set narrativo.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Condiciones enable: controles y botones activos por defecto.
- Condiciones block: overlays cierran por Escape/backdrop; body lock mientras overlay abierto.
- Pointer thresholds/RAF: no ritual pointer contractual en este slide.

5) GUARDS & CONTRACTS
- Order constraints: no secuencia estricta de pasos de usuario.
- ID checks: no contract ids rígidos para la mayoría de acciones.
- Threshold checks: sólo en sliders numéricos.
- Stage checks: overlay open/close controlado por estado.
- Expected-step constraints: no.
- Guardas ocultas relevantes:
- `hover_fund` / `lock_fund` / `unlock_fund` existen en contrato de eventos del orquestador pero no se emiten desde `FundsCore`.
- `RiskCoverage` define props `value/threshold/buffer`; el uso actual pasa `investment/contractValue`, que no alimentan ese componente.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: sí, telemetría local (`events`) en memoria.
- Dónde: estado del orquestador.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica (no replay subsystem).
- ¿Acciones vacías?: sí, hay tipos de evento declarados que pueden no aparecer en runtime real del flujo actual.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no HUD técnico expuesto en runtime.
- Métricas visibles: narrativa/contexto visible en UI, no panel debug dedicado.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
Depende de `Date.now`, `setInterval` de idle, orden temporal de eventos y múltiples estados locales desacoplados.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide16.tsx`.

10) RISK NOTES
- Interacciones pueden no impactar contexto esperado por wiring parcial de eventos.
- No hay replay/export para auditar flujo completo.
- Layering y tamaño del monolito elevan fragilidad.
- Contratos de props/eventos no completamente alineados en runtime actual.

# Slide16 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
El slot Slide16 registrado monta `components/slides/Slide16_Investor.tsx`. Es una vista de modelo de ingresos/riesgo/escala en tres columnas con cards estáticas. No hay estado local ni contratos runtime fuera de navegación global. La interacción real es visual por hover CSS en `DataBox`. No incluye FSM, reducer ni evidencia/replay.

2) PRIMARY INTERACTION
- Gesto principal: hover visual en cards.
- Tipo: hover.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados: no.
- Guardas/transiciones: no.
- Orden irreversible: no aplica.
- Saltos: no aplica.
- Reducer/actions: no.

4) GESTURE MECHANICS (DETAILED)
- Click/pointer contractual: no.
- Enable/block: no aplica.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no runtime metrics.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE

9) ARCHITECTURAL DEPTH
UI-ONLY PRESENTATIONAL  
Archivos clave: `components/slides/Slide16_Investor.tsx`.

10) RISK NOTES
- Interacción mínima (hover-only).
- Sin evidencia/replay.
- Riesgo bajo.

# Slide17 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide17 presenta dos bloques: evidencia (abre modal) y resumen/KPI con CTA opcional. El primer bloque dispara `openModal([], "CASO SRG")` y evento tour `case:evidence-opened`. El CTA “Deployable in 30 days” sólo existe cuando `wowCaseReveal` está activo (WOW flags + no reduced motion) y emite `case:kpi-committed`. No hay motor FSM/reducer del slide. Es una interacción de triggers puntuales y clases WOW condicionales.

2) PRIMARY INTERACTION
- Gesto principal: click en card de evidencia y CTA opcional.
- Tipo: click.
- Bypass: sí, CTA no existe si wowCaseReveal no está activo.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados: no state local persistente.
- Guardas/transiciones: gating por `WOW_DEMO && WOW_CASE_REVEAL && !reducedMotion`.
- Orden irreversible: no.
- Saltos: no aplica.
- Reducer/actions: no.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Enable: evidencia card siempre clickable; CTA sólo si `wowCaseReveal`.
- Block: reduced-motion o flags off eliminan CTA y clases WOW.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no.
- Threshold checks: no.
- Stage checks: sí (render condicional de CTA).
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no replay; sí emisión de eventos tour.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: sí, `openModal` se invoca con arreglo de imágenes vacío.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
CONDITIONALLY DETERMINISTIC  
Depende de flags WOW y reduced-motion del entorno.

9) ARCHITECTURAL DEPTH
LOGIC MIXED IN COMPONENT  
Archivos clave: `components/slides/Slide17.tsx`.

10) RISK NOTES
- Acción principal abre modal con payload de imágenes vacío.
- Interacción CTA puede “desaparecer” por flags/motion.
- Sin replay/evidence persistente.

# Slide18 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide18 renderiza cuatro tarjetas de riesgo/mitigación con reveal por hover. El contenido alterna entre vista de riesgo y vista de mitigación al pasar el cursor. No hay estado React explícito; el comportamiento usa clases CSS (`group-hover`). No existe motor de contratos ni replay. Es un slide de presentación interactiva básica.

2) PRIMARY INTERACTION
- Gesto principal: hover sobre tarjetas.
- Tipo: hover.
- Bypass: no aplica.
- Autoplay: no.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados: implícitos por CSS hover.
- Guardas/transiciones: no runtime guards.
- Orden irreversible: no.
- Saltos: no aplica.
- Reducer/actions: no.

4) GESTURE MECHANICS (DETAILED)
- Click/pointer contractual: no.
- Enable/block: depende de capacidad hover del dispositivo.

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE

9) ARCHITECTURAL DEPTH
UI-ONLY PRESENTATIONAL  
Archivos clave: `components/slides/Slide18.tsx`.

10) RISK NOTES
- En touch, el reveal hover puede no ejecutarse.
- Sin evidencia/replay.
- Riesgo bajo.

# Slide19 — ENGINE REPORT

1) CONCEPT (CURRENT IMPLEMENTATION)
Slide19 es la pantalla de cierre con contenido estático y navegación final. No tiene estado de negocio ni interacción interna aparte del `NavArea`. El botón next no avanza a 20, sino que ejecuta `goToSlide(0)` para reiniciar el deck. No hay FSM/reducer ni captura de eventos propia del slide.

2) PRIMARY INTERACTION
- Gesto principal: navegación prev/next.
- Tipo: click de navegación.
- Bypass: next hace wrap explícito a slide 00.
- Autoplay: no local.
- Randomness: no.

3) STATE MODEL
- FSM: no.
- Estados: no.
- Guardas/transiciones: navegación delegada.
- Orden irreversible: no.
- Saltos: sí, next salta a índice 0.
- Reducer/actions: no.

4) GESTURE MECHANICS (DETAILED)
- Click-based.
- Enable: botones de nav.
- Block: depende de controles globales del deck (no del slide).

5) GUARDS & CONTRACTS
- Order constraints: no.
- ID checks: no.
- Threshold checks: no.
- Stage checks: no.
- Expected-step constraints: no.

6) REPLAY / EVIDENCE CAPABILITIES
- Captura acciones: no.
- Export JSON: no.
- Replay JSON: no.
- Determinismo replay: no aplica.
- ¿Acciones vacías?: no hay action engine.
- Replay reducer explícito: no.

7) HUD / DEBUG LAYER
- Debug overlay: no.
- Métricas visibles: no.
- Toggle: no.
- Default hidden: no aplica.

8) DETERMINISM ASSESSMENT
NO ENGINE

9) ARCHITECTURAL DEPTH
UI-ONLY PRESENTATIONAL  
Archivos clave: `components/slides/Slide19.tsx`.

10) RISK NOTES
- Interacción limitada a navegación.
- Sin evidencia/replay.
- Riesgo bajo.

# GLOBAL SUMMARY

1) Which slides have real engines?
- Engine fuerte (FSM/reducer + contrato): Slide00, Slide01, Slide02, Slide03, Slide04, Slide09, Slide12.
- Engine parcial/orquestación local sin replay formal: Slide15.

2) Which slides are mostly UI?
- Principalmente UI/presentación: Slide05, Slide06, Slide07, Slide08, Slide10, Slide11, Slide13, Slide14, Slide16, Slide17, Slide18, Slide19.

3) Which slides implement FSM?
- FSM explícito: Slide00 (boot + first-proof), Slide01, Slide02 (status machine por reducer), Slide03, Slide04, Slide09 (hook local), Slide12.

4) Which slides capture replay?
- Replay/snapshot formal: Slide00 (boot snapshot + first-proof replay util), Slide01, Slide02, Slide03, Slide04, Slide12 (replay util programático).
- Sin replay persistible: Slide05, Slide06, Slide07, Slide08, Slide09, Slide10, Slide11, Slide13, Slide14, Slide15, Slide16, Slide17, Slide18, Slide19.

5) Which slides risk "interaction feels dead"?
- Alto riesgo: Slide05 (flags pueden dejar eventos en cero), Slide07 (acciones de menú funcionalmente vacías), Slide14/16/19 (no interacción de engine).
- Riesgo contextual: Slide17 (modal con imágenes vacías; CTA condicionado a WOW/reduced-motion), Slide10/18 (hover-only en touch).

6) Which slides are monoliths?
- Monolitos claros: Slide06, Slide07, Slide09, Slide15 (`Slide16.tsx` monolithic file).

7) Which slides are thin orchestrators?
- Wrappers finos hacia módulos: Slide01, Slide02, Slide03, Slide04, Slide08, Slide10, Slide12, Slide13, Slide14.

8) Are there duplicated interaction patterns?
- Sí.
- Patrón pointer ritual con guardas/captura: Slide00, Slide03, Slide04, Slide12.
- Patrón hover+lock visual de tarjetas: Slide05, Slide06, Slide07, Slide08, Slide18.
- Patrón replay JSON versionado: Slide01, Slide02, Slide03, Slide04.

9) Where does determinism actually live?
- En reducers/helpers de runtime: `runtime/boot/*`, `slide01-ui/core/fsm`, `slide02-ui/core/fsm+replay`, `slide03-ui/core/fsm+replay`, `slide04-ui/core/fsm+replay`, `slide13-ui/routeb/slide13.helpers`.
- En slides UI sin engine, la “determinación” depende de eventos de UI, flags y timing del navegador, no de contrato formal.

10) Top 5 structural risks across the deck.
- Registry-to-runtime mismatch en slots (07 y 11-16) que separa etiqueta canónica de componente montado real.
- Coexistencia de motores robustos con slides UI sin contrato, generando variabilidad fuerte de comportamiento entre slides.
- Dependencia de flags WOW y reduced-motion para habilitar rutas interactivas/evidencia en varios slides.
- Acciones no operativas o payloads vacíos en puntos visibles (`Slide07` runAction no-op, `Slide17` modal con imágenes vacías).
- Componentes monolíticos grandes (especialmente slot15/`Slide16.tsx`) con estado distribuido y acoplamientos implícitos.

