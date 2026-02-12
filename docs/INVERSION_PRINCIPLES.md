# INVERSION — Manifiesto Operativo

INVERSION no es una presentación.  
Es un **sistema demostrable en tiempo real** que:

- Se **opera**, no se narra
- Se **audita**, no se promete
- Se confirma con **evidencia**, no con discurso

Objetivo: que quien lo vea diga:  
**“Shut up and take my f*cking money”**

## Principios no negociables (todas las slides)
- Offline-first
- Determinístico
- Sin autoplay
- Sin timers
- Sin cinemática automática
- Todo es acción explícita
- Feature flags default OFF
- Additive only (no romper lo que ya existe)

## Arquitectura global (ley)
- Cada slide tiene un **orquestador delgado**
- UI en **módulos aislados**
- Cualquier componente se localiza por nombre
- Cualquier componente puede crecer 150 → 1500 LOC
- Lógica separada del visual
- Visual reemplazable sin romper lógica

## Slide 00 (contrato madre)
Slide 00 = **BOOT / PREFLIGHT / GATE**
- Arma el sistema
- Define evidencia
- Define locks
- Define estado
- Define operador
- Define persistencia
- Define diagnóstico

Sin Slide 00:
- Nada arranca
- Nada se muestra
- Nada se desbloquea

## Arsenal completo (20+ slides)
Cada slide es un sistema vivo con 5–10 interacciones con consecuencias visibles.

- Slide 01 — System Context (orientación)
- Slide 02 — Inputs (control)
- Slide 03 — Normalization (evidencia)
- Slide 04 — Decision Engine (decisión)
- Slide 05 — Risk Surface (riesgo)
- Slide 06 — Recovery (control)
- Slide 07 — Traceability (evidencia)
- Slide 08 — Operator Mode (control humano)
- Slide 09 — Autonomy (decisión)
- Slide 10 — Performance (evidencia)
- Slide 11 — Scaling (transición)
- Slide 12 — Cost (evidencia)
- Slide 13 — Trade-offs (decisión)
- Slide 14 — Failure Modes (riesgo)
- Slide 15 — Compliance (evidencia)
- Slide 16 — Adaptation (transición)
- Slide 17 — Extensibility (control)
- Slide 18 — Integration (transición)
- Slide 19 — Trust (evidencia)
- Slide 20 — Handoff (cierre operativo)

## Frase guía
**“Esto no se presenta. Esto se opera.”**

<!-- INVERSION_KERNEL_LINK_START -->
## Kernel Spec (referencia)
El contrato operativo base vive aquí:

- docs/INVERSION_KERNEL_SPEC_v1.md
<!-- INVERSION_KERNEL_LINK_END -->
