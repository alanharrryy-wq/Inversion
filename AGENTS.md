🧠 CODEX RULEBOOK · INVERSION

Version: FINAL · High-Scale Iterations (5k–10k LOC)
Mode: Extra High Reasoning · Long-Form Execution

0. PRINCIPIO SUPREMO

Codex trabaja mejor en bloques grandes y bien delimitados.
Este proyecto prioriza iteraciones grandes, profundas y cerradas, no cambios pequeños.

👉 Mínimo por iteración: 5,000 LOC
👉 Máximo permitido: 10,000 LOC
👉 Menos de 5k LOC está prohibido salvo hotfix explícito.

1. ITERATION SCALE RULE (CRÍTICA)
✅ Rango oficial

NORMAL: 5k – 7k LOC

GRANDE: 7k – 9k LOC

EXCEPCIONAL: hasta 10k LOC (solo con dominio ultra claro)

❌ Prohibido

Iteraciones chicas “incrementales”

Micro-refactors

“Cleanup general”

“Optimiza un poco”

“Ajustes visuales rápidos”

2. BOUNDED DOMAIN RULE (ANTI-DESMADRE)

Cada iteración DEBE cubrir UN SOLO dominio cerrado.

Ejemplos válidos:

Un slide completo (ej. Slide 00, Slide 03, etc.)

Un runtime entero (boot, evidence, tour, ai, etc.)

Un sistema UI completo (dock, HUD, panel, overlays)

Un engine con helpers + tests + docs

Una arquitectura nueva con adapters

Ejemplos inválidos:

“Mejorar varias cosas”

“Tocar varios slides”

“Cambios generales del proyecto”

“Refactor transversal”

👉 Si el scope no cabe limpio en una frase → está mal definido.

3. ARCHITECTURE LAW (NO NEGOCIABLE)
3.1 Thin Orchestrator Law

Entry points (SlideXX.tsx, App.tsx, providers):

NO lógica

NO decisiones

SOLO orquestación

Toda lógica va en:

helpers

runtime

reducers

services

UI modules

3.2 Modular Expansion Law

Cada componente DEBE:

Vivir en su propio archivo

Tener nombre explícito

Poder crecer de 50 LOC → 500 LOC → 1500 LOC

Sin tocar otros archivos

👉 Si un botón no puede crecer a 1000 LOC sin romper nada, está mal diseñado.

3.3 No Cross-Domain Bleed

UI no conoce runtime interno

Runtime no importa UI

Tests no alteran lógica

Helpers no tienen side-effects

Comunicación solo por contratos.

4. CODEX EXECUTION MODE (EXTRA HIGH REASONING)

Cada prompt DEBE exigir que Codex:

Piense arquitectura antes de escribir código

Planifique archivos y contratos

Detecte duplicaciones

Anticipe expansión futura

Prefiera composición sobre condicionales

Prefiera datos sobre flags

Prefiera reducers puros

👉 Codex tiene permiso de pensar largo.
👉 Codex NO debe optimizar por rapidez sino por claridad estructural.

5. FILE STRATEGY (OBLIGATORIA)

Cada iteración debe producir:

Nuevos folders bien nombrados

index.ts como boundary

helpers separados por intención

types explícitos

cero archivos “misc” o “utils.ts” genéricos

Prohibido:

mega-archivos

helpers sin nombre semántico

lógica inline en JSX

6. TEST STRATEGY (OPTIMIZADA PARA BLOQUES GRANDES)
Durante la iteración (OBLIGATORIO):

build

typecheck

1–2 e2e smoke (happy path)

unit tests SOLO de reducers/helpers críticos

Prohibido durante iteración:

full test suite

snapshots masivos

e2e exhaustivo

Full suite:

SOLO al cerrar el bloque

o antes de merge

7. VISUAL & UI LAW (INVERSION STYLE)

UI es modular

UI es reemplazable

UI NO contiene lógica de negocio

Todo efecto visual debe poder:

intensificarse

apagarse

cambiarse sin tocar runtime

Tokens > hardcode.

8. SLIDE DESIGN LAW (20+ SLIDES READY)

Cada slide:

Es un sistema independiente

Tiene su propio folder si crece

Puede tener runtime propio

Puede tener tests propios

Puede tener diagnostics propios

Slide 00 es la referencia arquitectónica.
Los demás slides copian el patrón, no el código.

9. WHAT CODEX MUST NEVER DO

“Limpiar código existente” sin permiso

Reescribir algo que ya pasa tests

Optimizar prematuramente

Reducir archivos “porque son muchos”

Cambiar contratos silenciosamente

Ejecutar tests innecesarios

10. DELIVERY FORMAT (NO NEGOCIABLE)

Cada iteración debe terminar con:

Resumen de dominio cubierto

Contratos creados

Árbol de archivos

Riesgos conocidos

Qué NO se tocó (importante)

Qué sigue después

11. FILOSOFÍA FINAL

Este proyecto prioriza:

Menos iteraciones
Más profundas
Más grandes
Más controladas
Cero paja

Codex no es un editor,
es un ingeniero incansable.

Dale bloques grandes,
pero bien cerrados
y te va a regresar código bien vergas 🔥

<!-- SLIDE00_FINAL_RULES_START -->
## 🔒 ADDITIONAL NON-NEGOTIABLE RULES · SLIDE 00 FINALIZATION

### 📌 BOOK IS LAW
From this point forward:
- **AGENTS.md is the BOOK**
- The BOOK must be read and followed in **every chat**
- Any assistant or Codex agent that violates the BOOK is wrong by definition

This reminder MUST be respected in all future conversations.

---

### 🧠 Psychological System Copy (Canonical)
These phrases are **system language**, not marketing.

**Phrase A — Continuity / Legacy (Javier profile)**  
> *Hoy, mañana y cuando tú ya no estés aquí operándolo.*

Represents:
- Continuity over individuals
- Standardization
- Transferable operation
- System > operator
- Legacy readiness

Used after:
- persistence is demonstrated
- state is frozen
- evidence accumulates

---

**Phrase B — Speed / Competitive Advantage (Carlos profile)**  
> *Para quien se mueve más rápido que los demás.*

Represents:
- Speed as advantage
- Zero bureaucracy
- No permission required
- System responds to operator tempo

Used after:
- immediate system reaction
- fast interaction
- visible consequence

---

### 🚫 CODE DELETION RULE (CRITICAL)
Codex or any agent **must NOT delete code** freely.

Allowed:
- Modify or remove **ONLY code introduced in the same iteration**
- Net change typically **150–300 LOC**, scoped to the declared domain

Forbidden:
- Deleting runtime, reducers, contracts, providers
- Cleanup, refactors, consolidation
- “Optimizations”
- Removing helpers “because unused”

**If code seems unnecessary:**
- Leave it
- Comment it
- Flag it
- DO NOT delete it

Deletion requires:
- Explicit explanation
- Same-iteration ownership

---

### 🎯 FINAL SLIDE 00 RULE
Slide 00 must:
- Demonstrate tension
- Require gesture, not buttons
- Prove system obedience
- Create an “ah cabrón” moment
- Feel dangerous, not friendly

No new slides are allowed until Slide 00 achieves this.
<!-- SLIDE00_FINAL_RULES_END -->
