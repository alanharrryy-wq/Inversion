# KPI Slide 13 Skeleton (v13.0.0)

Este ZIP está hecho para que lo puedas subir directo como **Upload Zip file** en Google AI Studio (o pegarlo en tu repo).

## Qué es
Un esqueleto modular tipo LEGO para la **Slide 13 (KPIs)** con 5 bloques swap-friendly:

1) `kpi.data.ts` (datos + tokens)
2) `kpi.hooks.ts` (estado + reduce-motion)
3) `KpiGrid.tsx` (cards 2x2)
4) `KpiHud.tsx` (panel de detalle)
5) `KpiScene.tsx` (ambiente/overlays pointer-events-none)
(+ `KpiTelemetry.tsx` opcional)

## Cómo usar (manual)
Copia la carpeta `payload/src/...` dentro de tu proyecto respetando rutas.

## Cómo usar (automático en Windows)
1) Abre la carpeta `install`
2) Ejecuta `Install.bat`
3) Te va a pedir la ruta de tu repo (por default usa la carpeta actual)

## Rollback
Si no te late, corre `Rollback.bat` y te restaura lo que respaldó el instalador.

## Notas
- No depende de `text-gold` (usa tokens hex Hitech).
- Scene layers están en `pointer-events-none` para no romper navegación.
