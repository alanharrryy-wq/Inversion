
/* ========================================================================
   Slide09.tsx — v3.1.0  "Surgical Evidence OS"
   RULES:
   - BLOQUES MAESTROS: B1..B7
   - En cada iteración: máximo 2 bloques (copy/paste), nunca .zip
   - Separación estricta: BG / FX / UI / Overlays (z-index explícito)
   - pointer-events disciplinados (ningún visual decide interacción)
======================================================================== */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";

/* ──────────────────────────────────────────────────────────────
   B1 — Shell & Layer Constitution Inicio
────────────────────────────────────────────────────────────── */

type Plane = "IDLE" | "ACCESS" | "REGISTER" | "LOCKED";
type Tone = "cyan" | "teal" | "gold";

type Mouse = { x: number; y: number; vx: number; vy: number; t: number };

const Z = Object.freeze({
  BG: 0,
  FX: 10,
  UI: 30,
  OVERLAY: 60,
});

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}
function toneRGBA(t: Tone, a: number) {
  // Hitech colors: #02A7CA, #026F86, #AB7B26
  if (t === "cyan") return `rgba(2,167,202,${a})`;
  if (t === "teal") return `rgba(2,111,134,${a})`;
  return `rgba(171,123,38,${a})`;
}

/** RAF-controlled mouse sampler */
function useRafMouse(ref: React.RefObject<HTMLElement>) {
  const [m, setM] = useState<Mouse>({ x: 0.5, y: 0.5, vx: 0, vy: 0, t: 0 });
  const raf = useRef<number | null>(null);
  const last = useRef<{ x: number; y: number; ts: number }>({
    x: 0.5,
    y: 0.5,
    ts: performance.now(),
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (raf.current) return;

      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        const r = el.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width, 0, 1);
        const y = clamp((e.clientY - r.top) / r.height, 0, 1);

        const now = performance.now();
        const dt = Math.max(16, now - last.current.ts);
        const vx = (x - last.current.x) / (dt / 1000);
        const vy = (y - last.current.y) / (dt / 1000);

        last.current = { x, y, ts: now };
        setM({ x, y, vx, vy, t: now });
      });
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [ref]);

  return m;
}

/** “Click fuera” sin robar eventos a overlays */
function useOutsideClick(
  rootRef: React.RefObject<HTMLElement>,
  enabled: boolean,
  onOutside: () => void
) {
  useEffect(() => {
    if (!enabled) return;

    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target as Node;
      if (!root.contains(target)) onOutside();
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [rootRef, enabled, onOutside]);
}

function LayerBG({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: Z.BG, pointerEvents: "none" }}>
      {children}
    </div>
  );
}
function LayerFX({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: Z.FX, pointerEvents: "none" }}>
      {children}
    </div>
  );
}
function LayerUI({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: Z.UI, pointerEvents: "auto" }}>
      {children}
    </div>
  );
}
function LayerOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: Z.OVERLAY, pointerEvents: "auto" }}>
      {children}
    </div>
  );
}

const shellFont = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial',
};

const NARRATIVE = {
  title: "EVIDENCIA · TRACCIÓN",
  breadcrumb: "NO ES MARKETING. ES ACCESO OPERATIVO.",
  principle: "Principio operativo: evidencia → acceso → operación real.",
  footer: "HITECH // EVIDENCE OS",
};

const TXT = Object.freeze({
  micro: "rgba(0,0,0,0.46)",
  faint: "rgba(0,0,0,0.36)",
  secondary: "rgba(0,0,0,0.62)",
  monoStrong: "rgba(0,0,0,0.74)",
});

/* ──────────────────────────────────────────────────────────────
   B1 — Shell & Layer Constitution Fin
────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   B2 — Crystal Visual Engine Inicio
   - Fondo white-lab con contraste LOCAL (no oscuro)
   - Vidrio: cut-edge + doble línea interna + caustic + spec pegado
   - Mantiene: scan/noise/spectral (no se quita nada)
────────────────────────────────────────────────────────────── */

type CrystalRole = "capsule" | "node" | "pane";

type CrystalPanelArgs = {
  plane: Plane;
  tone: Tone;
  mouse: Mouse;
  role: CrystalRole;
  emphasis?: boolean;
};

const CRYSTAL_NOISE_DATA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 .22 0"/>
    </filter>
    <rect width="220" height="220" filter="url(#n)" opacity="0.55"/>
  </svg>
`);

function planeIntensity(plane: Plane) {
  if (plane === "IDLE") return 0.35;
  if (plane === "ACCESS") return 0.80;
  if (plane === "REGISTER") return 0.98;
  return 1.10;
}

function rimAlpha(plane: Plane, role: CrystalRole) {
  const base = plane === "IDLE" ? 0.34 : plane === "ACCESS" ? 0.52 : plane === "REGISTER" ? 0.62 : 0.74;
  if (role === "capsule") return base * 0.82;
  if (role === "node") return base * 0.98;
  return base;
}

function fillAlpha(plane: Plane, role: CrystalRole) {
  // Para que se lea vidrio (no mancha), el fill es bajo y el borde manda.
  const base = plane === "IDLE" ? 0.065 : plane === "ACCESS" ? 0.085 : 0.095;
  if (role === "capsule") return base * 0.95;
  if (role === "node") return base * 1.05;
  return base * 1.08;
}

function blurPx(plane: Plane, role: CrystalRole) {
  const base = plane === "IDLE" ? 12 : plane === "ACCESS" ? 16 : 18;
  if (role === "capsule") return base - 2;
  if (role === "node") return base;
  return base + 2;
}

function specularBand(role: CrystalRole) {
  if (role === "capsule") return { a: 39, b: 48, c: 57 };
  if (role === "node") return { a: 37, b: 48, c: 59 };
  return { a: 36, b: 48, c: 60 };
}

function tone2(t: Tone): Tone {
  if (t === "cyan") return "teal";
  if (t === "teal") return "cyan";
  return "teal";
}

export function crystalPanelStyle(args: CrystalPanelArgs): React.CSSProperties {
  const { plane, tone, mouse, role, emphasis } = args;

  const I = planeIntensity(plane);
  const fillA = fillAlpha(plane, role);
  const rimA = rimAlpha(plane, role);
  const blur = blurPx(plane, role);
  const band = specularBand(role);

  const mx = clamp(mouse.x, 0, 1);
  const my = clamp(mouse.y, 0, 1);

  const hx = Math.round(18 + mx * 70);
  const hy = Math.round(12 + my * 62);

  const refrX = Math.round((mx - 0.5) * (role === "pane" ? 12 : 8));
  const refrY = Math.round((my - 0.5) * (role === "pane" ? 10 : 6));

  const glow = clamp(0.18 + I * 0.28, 0.18, 0.44);
  const rimStrong = clamp(rimA + (emphasis ? 0.14 : 0.06), 0.22, 0.86);

  const shadow =
    role === "pane"
      ? "0 34px 140px rgba(0,0,0,0.18)"
      : role === "node"
      ? "0 22px 96px rgba(0,0,0,0.14)"
      : "0 16px 70px rgba(0,0,0,0.12)";

  const borderOuter = emphasis ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.11)";

  // base
  const baseBg =
    `radial-gradient(720px 420px at ${hx}% ${hy}%, rgba(255,255,255,0.26), rgba(255,255,255,0.08) 42%, rgba(255,255,255,0.00) 74%),` +
    `linear-gradient(180deg, rgba(255,255,255,${fillA}), rgba(255,255,255,${fillA * 0.58}))`;

  // refraction invertida
  const refr =
    `radial-gradient(820px 520px at ${clamp(hx + refrX, 0, 100)}% ${clamp(hy + refrY, 0, 100)}%,
      rgba(0,0,0,${clamp(0.10 + I * 0.07, 0.10, 0.20)}) 0%,
      rgba(0,0,0,0.00) 58%)`;

  // cut edge duro (espesor)
  const cutEdge =
    `linear-gradient(180deg,
      rgba(255,255,255,0.74) 0%,
      rgba(255,255,255,0.18) 16%,
      rgba(255,255,255,0.00) 30%,
      rgba(0,0,0,0.08) 100%)`;

  // rim dual
  const rim =
    `linear-gradient(180deg, ${toneRGBA(tone, rimStrong)} 0%, rgba(255,255,255,0) 40%),` +
    `linear-gradient(90deg, ${toneRGBA(tone2(tone), rimStrong * 0.70)} 0%, rgba(255,255,255,0) 56%)`;

  // specular pegado (no nube)
  const spec =
    `linear-gradient(120deg,
      rgba(255,255,255,0) ${band.a - 3}%,
      rgba(255,255,255,${clamp(0.36 + I * 0.14, 0.36, 0.56)}) ${band.b}%,
      rgba(255,255,255,0) ${band.c + 3}%)`;

  // caustic micro (lectura)
  const caustic =
    `radial-gradient(520px 240px at ${clamp(hx + 10, 0, 100)}% ${clamp(hy - 8, 0, 100)}%,
      ${toneRGBA(tone, clamp(0.10 + I * 0.08, 0.10, 0.20))} 0%,
      rgba(255,255,255,0) 64%)`;

  const scratches =
    role === "pane"
      ? `linear-gradient(90deg,
          rgba(255,255,255,0.00) 0%,
          rgba(255,255,255,0.06) 12%,
          rgba(255,255,255,0.00) 24%,
          rgba(255,255,255,0.05) 46%,
          rgba(255,255,255,0.00) 70%,
          rgba(255,255,255,0.04) 86%,
          rgba(255,255,255,0.00) 100%)`
      : "";

  const bgParts = [baseBg, refr, cutEdge, rim, spec, caustic];
  if (scratches) bgParts.push(scratches);

  const innerHard = "rgba(255,255,255,0.66)";
  const innerSoft = "rgba(255,255,255,0.34)";

  return {
    position: "relative",
    overflow: "hidden",
    background: bgParts.join(","),
    border: `1px solid ${borderOuter}`,
    boxShadow:
      `${shadow}, ` +
      `inset 0 1px 0 rgba(255,255,255,0.78), ` +
      `inset 0 0 0 1px ${innerHard}, ` +
      `inset 0 0 0 2px ${innerSoft}, ` +
      `inset 0 -22px 46px rgba(0,0,0,0.06), ` +
      `0 0 0 1px ${toneRGBA(tone, glow)}, ` +
      `0 0 34px ${toneRGBA(tone, glow * 0.55)}`,
    backdropFilter: `blur(${blur}px) saturate(1.75)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(1.75)`,
    transition: "transform 520ms cubic-bezier(.2,.9,.2,1), box-shadow 520ms cubic-bezier(.2,.9,.2,1)",
    transform: plane === "ACCESS" && role === "node" ? "translateY(-1px)" : undefined,
  };
}

/** Fondo: white lab + contraste local para que el vidrio “separe”
 *  SIN oscurecer el overall.
 */
export function CrystalStageBG({ plane, tone, mouse }: { plane: Plane; tone: Tone; mouse: Mouse }) {
  const I = planeIntensity(plane);
  const lx = Math.round(18 + mouse.x * 68);
  const ly = Math.round(10 + mouse.y * 46);

  return (
    <div className="absolute inset-0">
      {/* base white lab (high-key) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.996), rgba(255,255,255,0.952))",
        }}
      />

      {/* local depth mats (multiply) — MUY leve, para separar “vidrio” */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.28,
          background:
            // zona izquierda (donde están cards) → un pelo más de contraste
            "radial-gradient(920px 620px at 22% 42%, rgba(0,0,0,0.10), transparent 62%)," +
            // zona derecha (panel grande) → halo suave para que el borde se lea
            "radial-gradient(980px 680px at 72% 46%, rgba(0,0,0,0.08), transparent 68%)," +
            // caída inferior suave (peso)
            "radial-gradient(980px 620px at 50% 92%, rgba(0,0,0,0.08), transparent 70%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* spectral energy (screen) — mantiene color sin ensuciar */}
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(0.18 + I * 0.22, 0.18, 0.44),
          transition: "opacity 520ms ease",
          background:
            `radial-gradient(980px 620px at ${lx}% ${ly}%, ${toneRGBA(tone, 0.34)}, transparent 66%),` +
            `radial-gradient(900px 560px at 72% 72%, ${toneRGBA("gold", 0.18)}, transparent 72%),` +
            `radial-gradient(880px 560px at 28% 78%, ${toneRGBA("teal", 0.22)}, transparent 76%)`,
          mixBlendMode: "screen",
          filter: "blur(0.45px)",
        }}
      />

      {/* vignette (multiply) — súper ligera, no “dark mode” */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 900px at 50% 50%, rgba(255,255,255,0.0) 58%, rgba(0,0,0,0.10) 94%)",
          opacity: 0.42,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

export function CrystalStageFX({ plane, tone, mouse }: { plane: Plane; tone: Tone; mouse: Mouse }) {
  const I = planeIntensity(plane);

  const holo = plane === "IDLE" ? 0.10 : plane === "ACCESS" ? 0.30 : 0.34;
  const scan = plane === "IDLE" ? 0.06 : 0.16;

  const pxm = (mouse.x - 0.5) * 11;
  const pym = (mouse.y - 0.5) * 9;

  return (
    <div className="absolute inset-0">
      <style>{`
        @keyframes s09_scan {
          0% { transform: translate3d(0,-18px,0); }
          100% { transform: translate3d(0,18px,0); }
        }
      `}</style>

      {/* micro grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: holo,
          transition: "opacity 520ms ease",
          transform: `translate3d(${pxm}px, ${pym}px, 0)`,
          backgroundImage:
            `linear-gradient(90deg, ${toneRGBA("cyan", 0.12)} 1px, transparent 1px),` +
            `linear-gradient(180deg, ${toneRGBA("teal", 0.10)} 1px, transparent 1px)`,
          backgroundSize: "240px 240px",
          mixBlendMode: "multiply",
          filter: "blur(0.15px)",
        }}
      />

      {/* scan */}
      <div
        className="absolute inset-0"
        style={{
          opacity: scan,
          transition: "opacity 520ms ease",
          backgroundImage: `linear-gradient(180deg, ${toneRGBA(tone, 0.18)} 1px, transparent 1px)`,
          backgroundSize: "100% 18px",
          mixBlendMode: "multiply",
          animation: plane === "ACCESS" || plane === "REGISTER" ? "s09_scan 1.8s linear infinite" : undefined,
        }}
      />

      {/* noise */}
      <div
        className="absolute inset-0"
        style={{
          opacity: plane === "IDLE" ? 0.12 : 0.16,
          backgroundImage: `url("${CRYSTAL_NOISE_DATA}")`,
          backgroundSize: "220px 220px",
          mixBlendMode: "overlay",
        }}
      />

      {/* glow discipline */}
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(0.20 + I * 0.20, 0.20, 0.44),
          background:
            `linear-gradient(90deg, transparent, ${toneRGBA(tone, 0.52)}, transparent),` +
            `linear-gradient(180deg, transparent, ${toneRGBA(tone2(tone), 0.22)}, transparent)`,
          mixBlendMode: "screen",
          filter: "blur(0.30px)",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   B2 — Crystal Visual Engine Fin
────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   B3 — Core Interactive Nodes Inicio
────────────────────────────────────────────────────────────── */

type NodeState = "IDLE" | "HOVER" | "SELECT" | "LOCK";
type NodeId = "SRG" | "GUARDIAN" | "ISN" | "PROD";

type EvidenceNode = {
  id: NodeId;
  label: string;
  route: string;
  why: string;
  outputs: string[];
  tone: Tone;
};

const NODES: EvidenceNode[] = [
  {
    id: "SRG",
    label: "SRG GLOBAL",
    route: "ACCESS_ROUTE://CLIENT/SRG",
    why: "Existe para convertir fallas recurrentes en trazabilidad operativa medible.",
    outputs: ["ServiceLogix: OT + evidencias", "ConditionScore: salud del activo", "FailMatrix: tendencias"],
    tone: "cyan",
  },
  {
    id: "GUARDIAN",
    label: "GUARDIAN",
    route: "ACCESS_ROUTE://CLIENT/GUARDIAN",
    why: "Existe para asegurar continuidad y handoff sin dependencia de una sola persona.",
    outputs: ["SOPs + checklists", "Bitácoras perpetuas", "Evidencia fotográfica 360"],
    tone: "teal",
  },
  {
    id: "ISN",
    label: "COMPLIANCE / ISN",
    route: "ACCESS_ROUTE://COMPLIANCE/ISN",
    why: "Existe para que el cumplimiento sea verificable, no una opinión.",
    outputs: ["Registros auditables", "Matrices + NOM/ISO mapeo", "Evidencia de inspecciones"],
    tone: "gold",
  },
  {
    id: "PROD",
    label: "PRODUCCIÓN REAL",
    route: "ACCESS_ROUTE://OPS/PRODUCTION",
    why: "Existe para amarrar el sistema al piso: tiempos, controles, resultados.",
    outputs: ["KPIs operativos", "Registros de intervención", "Trazabilidad de cierre"],
    tone: "cyan",
  },
];

function nodeStateLabel(s: NodeState) {
  if (s === "HOVER") return "ACCESS";
  if (s === "SELECT") return "REGISTER";
  if (s === "LOCK") return "LOCKED";
  return "IDLE";
}

function nodeStatePillStyle(s: NodeState, tone: Tone) {
  const base: React.CSSProperties = {
    border: `1px solid rgba(0,0,0,0.12)`,
    background: "rgba(255,255,255,0.10)",
    color: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(14px) saturate(1.55)",
    WebkitBackdropFilter: "blur(14px) saturate(1.55)",
    boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.08)} inset`,
  };

  if (s === "LOCK")
    return {
      ...base,
      background: "rgba(0,0,0,0.06)",
      border: `1px solid rgba(0,0,0,0.18)`,
      boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.16)} inset, 0 0 18px ${toneRGBA(tone, 0.12)}`,
    };

  if (s === "SELECT")
    return {
      ...base,
      background: "rgba(255,255,255,0.14)",
      boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.14)} inset`,
    };

  if (s === "HOVER")
    return {
      ...base,
      background: "rgba(255,255,255,0.12)",
      boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.10)} inset`,
    };

  return base;
}

function NodeCard({
  node,
  plane,
  mouse,
  state,
  isActive,
  onEnter,
  onLeave,
  onClick,
}: {
  node: EvidenceNode;
  plane: Plane;
  mouse: Mouse;
  state: NodeState;
  isActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const tone = node.tone;
  const sLabel = nodeStateLabel(state);

  const labelClr = state === "IDLE" ? toneRGBA(tone, 0.42) : toneRGBA(tone, 0.62);
  const routeClr = state === "IDLE" ? toneRGBA(tone, 0.34) : toneRGBA(tone, 0.54);

  return (
    <button
      className="text-left rounded-2xl px-6 py-5 w-full"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        ...crystalPanelStyle({
          plane,
          tone,
          mouse,
          role: "node",
          emphasis: isActive,
        }),
        transform:
          state === "HOVER"
            ? "translateY(-1px)"
            : state === "SELECT"
            ? "translateY(-2px)"
            : state === "LOCK"
            ? "translateY(-2px)"
            : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="font-mono text-[11px] uppercase tracking-[0.26em]"
            style={{ color: "rgba(0,0,0,0.50)" }}
          >
            NODO // RUTA OPERATIVA
          </div>

          <div className="mt-2 font-black text-[24px] text-black leading-tight">{node.label}</div>

          <div
            className="mt-2 font-mono text-[11px] uppercase tracking-[0.26em] truncate"
            style={{ color: routeClr }}
          >
            {node.route}
          </div>

          <div className="mt-3 text-black/72 text-[14px] leading-snug">
            <span className="font-semibold">Por qué existe:</span> {node.why}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1">
            {node.outputs.slice(0, 3).map((x) => (
              <div
                key={x}
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: labelClr }}
              >
                • {x}
              </div>
            ))}
          </div>
        </div>

        <div
          className="shrink-0 rounded-2xl px-3 py-2 font-mono text-[11px] uppercase tracking-[0.26em]"
          style={nodeStatePillStyle(state, tone)}
        >
          {sLabel}
        </div>
      </div>

      <div
        className="mt-4 h-[1px] w-full"
        style={{
          background:
            state === "LOCK"
              ? `linear-gradient(90deg, transparent, ${toneRGBA(tone, 0.52)}, transparent)`
              : state === "SELECT"
              ? `linear-gradient(90deg, transparent, ${toneRGBA(tone, 0.36)}, transparent)`
              : state === "HOVER"
              ? `linear-gradient(90deg, transparent, ${toneRGBA(tone, 0.22)}, transparent)`
              : "linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent)",
          mixBlendMode: state === "IDLE" ? "multiply" : "screen",
          filter: "blur(0.2px)",
        }}
      />
    </button>
  );
}

function NodeStack({
  plane,
  mouse,
  activeId,
  lockedId,
  onNodeEnter,
  onNodeLeave,
  onNodeClick,
}: {
  plane: Plane;
  mouse: Mouse;
  activeId: NodeId | null;
  lockedId: NodeId | null;
  onNodeEnter: (id: NodeId) => void;
  onNodeLeave: (id: NodeId) => void;
  onNodeClick: (id: NodeId) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {NODES.map((n) => {
        const locked = lockedId === n.id;
        const active = activeId === n.id;

        const state: NodeState =
          locked
            ? "LOCK"
            : active
            ? plane === "REGISTER"
              ? "SELECT"
              : plane === "ACCESS"
              ? "HOVER"
              : "IDLE"
            : "IDLE";

        return (
          <NodeCard
            key={n.id}
            node={n}
            plane={plane}
            mouse={mouse}
            state={state}
            isActive={locked || active}
            onEnter={() => onNodeEnter(n.id)}
            onLeave={() => onNodeLeave(n.id)}
            onClick={() => onNodeClick(n.id)}
          />
        );
      })}
    </div>
  );
}

function DetailPaneBody({
  plane,
  activeNode,
  lockedNode,
}: {
  plane: Plane;
  activeNode: EvidenceNode | null;
  lockedNode: EvidenceNode | null;
}) {
  const n = lockedNode || activeNode;
  const tone: Tone = n?.tone ?? "cyan";

  const headLabel =
    plane === "ACCESS"
      ? "ACCESO // CONTEXTO EMERGIENDO"
      : plane === "REGISTER"
      ? "REGISTRO // VALIDACIÓN SILENCIOSA"
      : plane === "LOCKED"
      ? "LOCK // ESTADO FORMAL"
      : "OBSERVACIÓN // SISTEMA EN VIGILANCIA";

  if (!n) {
    return (
      <>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.26em]"
          style={{ color: toneRGBA(tone, 0.52) }}
        >
          {headLabel}
        </div>

        <div className="mt-3 font-black text-[34px] text-black leading-tight">La tracción no se presume.</div>

        <div className="mt-4 text-black/70 text-[18px] leading-relaxed">
          No es una UI. Es un sistema operativo de evidencia. <br />
          Cada interacción existe porque responde una pregunta de auditoría.
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="font-mono text-[11px] uppercase tracking-[0.26em]"
        style={{ color: toneRGBA(tone, plane === "LOCKED" ? 0.62 : 0.52) }}
      >
        {headLabel}
      </div>

      <div className="mt-3 font-black text-[34px] text-black leading-tight">{n.label}</div>

      <div
        className="mt-3 font-mono text-[11px] uppercase tracking-[0.26em]"
        style={{ color: toneRGBA(tone, 0.54) }}
      >
        {n.route}
      </div>

      <div className="mt-5 text-black/72 text-[16px] leading-relaxed">
        <span className="font-semibold">Propósito:</span> {n.why}
      </div>

      <div className="mt-6">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.26em]"
          style={{ color: toneRGBA(tone, 0.52) }}
        >
          EVIDENCIA PRODUCIDA
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {n.outputs.map((o) => (
            <div
              key={o}
              className="rounded-2xl px-4 py-3"
              style={{
                border: `1px solid ${toneRGBA(tone, 0.14)}`,
                background:
                  `linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06)),` +
                  `radial-gradient(520px 240px at 18% 18%, ${toneRGBA(tone, 0.10)}, rgba(255,255,255,0) 70%)`,
                backdropFilter: "blur(10px) saturate(1.35)",
                WebkitBackdropFilter: "blur(10px) saturate(1.35)",
                boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.06)} inset`,
              }}
            >
              <div
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: toneRGBA(tone, 0.62) }}
              >
                {o}
              </div>

              <div className="mt-2 text-black/70 text-[13px] leading-snug">
                Registro trazable, listo para auditoría y handoff.
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   B3 — Core Interactive Nodes Fin
────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   B4 — Logic / State Planes Inicio
────────────────────────────────────────────────────────────── */

type EvidencePhase = {
  plane: Plane;
  since: number;
  nodeId: NodeId | null;
  lockedId: NodeId | null;
};

type EvidenceSignals = {
  accessHoldMs: number;
  registerMs: number;
  lockPulseMs: number;
};

const SIGNALS: EvidenceSignals = {
  accessHoldMs: 420,
  registerMs: 520,
  lockPulseMs: 720,
};

function nowMs() {
  return performance.now();
}

function useEvidenceStateMachine() {
  const [phase, setPhase] = useState<EvidencePhase>({
    plane: "IDLE",
    since: nowMs(),
    nodeId: null,
    lockedId: null,
  });

  const raf = useRef<number | null>(null);
  const target = useRef<EvidencePhase>(phase);

  useEffect(() => {
    target.current = phase;
  }, [phase]);

  const hardReset = () => {
    setPhase({
      plane: "IDLE",
      since: nowMs(),
      nodeId: null,
      lockedId: null,
    });
  };

  const setHover = (id: NodeId | null) => {
    setPhase((p) => {
      if (p.lockedId) return p;
      if (!id) return { ...p, plane: "IDLE", nodeId: null, since: nowMs() };
      return { ...p, plane: "ACCESS", nodeId: id, since: nowMs() };
    });
  };

  const clickSelect = (id: NodeId) => {
    setPhase((p) => ({ ...p, plane: "REGISTER", nodeId: id, since: nowMs() }));
  };

  const clearLock = () => {
    setPhase((p) => ({ ...p, plane: "IDLE", nodeId: null, lockedId: null, since: nowMs() }));
  };

  useEffect(() => {
    const tick = () => {
      raf.current = requestAnimationFrame(tick);

      const p = target.current;
      const t = nowMs();
      const dt = t - p.since;

      if (p.plane === "REGISTER" && p.nodeId && dt >= SIGNALS.registerMs) {
        setPhase((prev) => {
          if (prev.plane !== "REGISTER") return prev;
          return { ...prev, plane: "LOCKED", lockedId: prev.nodeId, since: nowMs() };
        });
      }

      if (p.plane === "ACCESS" && !p.nodeId && dt >= SIGNALS.accessHoldMs) {
        setPhase((prev) => {
          if (prev.plane !== "ACCESS") return prev;
          return { ...prev, plane: "IDLE", since: nowMs() };
        });
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, []);

  const telemetry = useMemo(() => {
    const t = nowMs();
    const dt = t - phase.since;
    const plane = phase.plane;

    const progress =
      plane === "REGISTER"
        ? clamp(dt / SIGNALS.registerMs, 0, 1)
        : plane === "LOCKED"
        ? 1
        : plane === "ACCESS"
        ? clamp(dt / SIGNALS.accessHoldMs, 0, 1)
        : 0;

    return {
      plane,
      nodeId: phase.nodeId,
      lockedId: phase.lockedId,
      dt,
      progress: easeInOut(progress),
    };
  }, [phase]);

  return {
    phase,
    telemetry,
    hardReset,
    setHover,
    clickSelect,
    clearLock,
  };
}


/* ──────────────────────────────────────────────────────────────
   B4 — Logic / State Planes Fin
────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   B5 — Narrative System Inicio
   - Fix monocromo: acentos por tono (sin perder seriedad)
   - NO cambia interacción: solo presenta mejor la narrativa
────────────────────────────────────────────────────────────── */

type Principle = { k: string; title: string; body: string };

const PRINCIPLES: Principle[] = [
  {
    k: "EVIDENCE_FIRST",
    title: "EVIDENCIA ANTES QUE OPINIÓN",
    body: "Si no queda un registro trazable, no ocurrió para el sistema.",
  },
  {
    k: "NO_BLACKBOX",
    title: "CERO CAJAS NEGRAS",
    body: "Todo acceso, cambio y cierre deja huella verificable.",
  },
  {
    k: "HANDOFF_READY",
    title: "HANDOFF SIN DEPENDENCIAS",
    body: "La operación debe sobrevivir a rotación de personal.",
  },
  {
    k: "AUDITABLE_BY_DEFAULT",
    title: "AUDITABLE POR DEFECTO",
    body: "La auditoría no se prepara: se produce en tiempo real.",
  },
];

function getNodeToneFromTelemetry(telemetry: {
  progress: number;
  dt: number;
  since: number;
  nodeId: NodeId | null;
  lockedId: NodeId | null;
}) {
  const id = telemetry.lockedId || telemetry.nodeId;
  const n = id ? NODES.find((x) => x.id === id) : null;
  return n?.tone ?? "cyan";
}

function protocolChipStyle(tone: Tone) {
  return {
    border: `1px solid ${toneRGBA(tone, 0.16)}`,
    background:
      `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06)),` +
      `radial-gradient(520px 240px at 18% 18%, ${toneRGBA(tone, 0.10)}, rgba(255,255,255,0) 70%)`,
    color: "rgba(0,0,0,0.72)",
    boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.06)} inset, 0 0 18px ${toneRGBA(tone, 0.10)}`,
    backdropFilter: "blur(10px) saturate(1.35)",
    WebkitBackdropFilter: "blur(10px) saturate(1.35)",
  } as React.CSSProperties;
}

function NarrativeSystem({
  plane,
  telemetry,
}: {
  plane: Plane;
  telemetry: { progress: number; dt: number; since: number; nodeId: NodeId | null; lockedId: NodeId | null };
}) {
  const tone = getNodeToneFromTelemetry(telemetry);

  const header =
    plane === "LOCKED"
      ? "PROTOCOLS // ACTO FORMAL"
      : plane === "REGISTER"
      ? "PROTOCOLS // REGISTRO"
      : plane === "ACCESS"
      ? "PROTOCOLS // ACCESO"
      : "PROTOCOLS // IDLE";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.26em]"
          style={{ color: toneRGBA(tone, plane === "LOCKED" ? 0.62 : 0.46) }}
        >
          {header}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="rounded-2xl px-3 py-2 font-mono text-[11px] uppercase tracking-[0.26em]"
            style={protocolChipStyle(tone)}
          >
            PROT-01..04
          </div>

          <div
            className="rounded-2xl px-3 py-2 font-mono text-[11px] uppercase tracking-[0.26em]"
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.10)",
              color: "rgba(0,0,0,0.62)",
              boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.06)} inset`,
              backdropFilter: "blur(10px) saturate(1.25)",
              WebkitBackdropFilter: "blur(10px) saturate(1.25)",
            }}
          >
            append-only
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {PRINCIPLES.map((p, idx) => {
          const isHot = plane !== "IDLE" && idx === 0; // un toque de jerarquía, sin circo
          return (
            <div
              key={p.k}
              className="rounded-2xl p-4"
              style={{
                border: `1px solid ${isHot ? toneRGBA(tone, 0.20) : "rgba(0,0,0,0.10)"}`,
                background:
                  `linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.06)),` +
                  `radial-gradient(520px 240px at 18% 18%, ${
                    isHot ? toneRGBA(tone, 0.14) : "rgba(255,255,255,0)"
                  }, rgba(255,255,255,0) 70%)`,
                boxShadow:
                  `0 0 0 1px ${isHot ? toneRGBA(tone, 0.08) : "rgba(0,0,0,0.04)"} inset`,
                backdropFilter: "blur(10px) saturate(1.30)",
                WebkitBackdropFilter: "blur(10px) saturate(1.30)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.26em]"
                  style={{ color: toneRGBA(tone, isHot ? 0.58 : 0.42) }}
                >
                  {`PROT-${String(idx + 1).padStart(2, "0")}`}
                </div>

                <div
                  className="font-mono text-[10px] uppercase tracking-[0.26em]"
                  style={{ color: "rgba(0,0,0,0.42)" }}
                >
                  EVIDENCE_CHAIN: INTACT
                </div>
              </div>

              <div className="mt-2 font-black text-[14px] text-black leading-snug">{p.title}</div>

              <div className="mt-2 text-black/65 text-[13px] leading-snug">{p.body}</div>

              <div
                className="mt-3 h-[1px] w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${
                    isHot ? toneRGBA(tone, 0.32) : "rgba(0,0,0,0.10)"
                  }, transparent)`,
                  mixBlendMode: isHot ? "screen" : "multiply",
                  filter: "blur(0.15px)",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-black/60 text-[12px] leading-relaxed">
        <span style={{ color: toneRGBA(tone, 0.62) }} className="font-mono uppercase tracking-[0.22em]">
          Garantía operativa:
        </span>{" "}
        reversible por hotfix • audit-ready • si no se registra, no existe.
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   B5 — Narrative System Fin
────────────────────────────────────────────────────────────── */


/* ──────────────────────────────────────────────────────────────
   B6 — Interaction & Telemetry Inicio (v2.0)
   - Instrument-mode: IDLE / ACCESS / LOCKED
   - Timeline ticks + progress marker
   - State seal (LOCKED)
   - Auditline ticker (optional)
────────────────────────────────────────────────────────────── */

type ParallaxTelemetry = { px: number; py: number; smoothX: number; smoothY: number; v: number };

function useParallaxTelemetry(shellRef: React.RefObject<HTMLDivElement>) {
  const target = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0, t: performance.now() });
  const raf = useRef<number | null>(null);

  const [sig, setSig] = useState<ParallaxTelemetry>({
    px: 0,
    py: 0,
    smoothX: 0,
    smoothY: 0,
    v: 0,
  });

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      target.current = { x: nx, y: ny };
    };
    const onLeave = () => {
      target.current = { x: 0, y: 0 };
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });

    const tick = () => {
      raf.current = requestAnimationFrame(tick);

      const t = performance.now();
      const dt = Math.max(1, t - last.current.t);

      const sx = lerp(sig.smoothX, target.current.x, 0.06);
      const sy = lerp(sig.smoothY, target.current.y, 0.06);

      const vx = (sx - last.current.x) / dt;
      const vy = (sy - last.current.y) / dt;
      const v = clamp(Math.sqrt(vx * vx + vy * vy) * 450, 0, 1);

      last.current = { x: sx, y: sy, t };

      setSig({
        px: target.current.x,
        py: target.current.y,
        smoothX: sx,
        smoothY: sy,
        v,
      });
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellRef]);

  return sig;
}

// tiny hash for SEAL id (deterministic, no deps)
function shortSeal(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = (h >>> 0).toString(16).toUpperCase();
  return n.slice(0, 8);
}

function modeFromPlane(p: Plane) {
  if (p === "LOCKED") return "LOCKED";
  if (p === "REGISTER") return "ACCESS";
  if (p === "ACCESS") return "ACCESS";
  return "IDLE";
}

function TelemetryStrip({
  tone,
  plane,
  telemetry,
  parallax,
  audit,
}: {
  tone: Tone;
  plane: Plane;
  telemetry: { dt: number; progress: number; nodeId: NodeId | null; lockedId: NodeId | null; plane: Plane };
  parallax: ParallaxTelemetry;
  audit?: { t: number; ev: string }[];
}) {
  const mode = modeFromPlane(plane);

  const activity = clamp(0.12 + parallax.v * 0.62, 0.12, 0.78);
  const prog = clamp(telemetry.progress, 0, 1);

  const nodeStr = telemetry.nodeId ?? "—";
  const lockStr = telemetry.lockedId ?? "—";
  const seal = telemetry.lockedId ? shortSeal(`${telemetry.lockedId}|${Math.round(telemetry.dt)}|${Math.round(prog * 1000)}`) : null;

  const headClr =
    mode === "LOCKED" ? toneRGBA(tone, 0.72) : mode === "ACCESS" ? toneRGBA(tone, 0.56) : toneRGBA(tone, 0.42);

  const subClr = mode === "LOCKED" ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.62)";
  const microClr = "rgba(0,0,0,0.46)";

  const border =
    mode === "LOCKED"
      ? `1px solid ${toneRGBA(tone, 0.22)}`
      : mode === "ACCESS"
      ? `1px solid rgba(0,0,0,0.12)`
      : `1px solid rgba(0,0,0,0.10)`;

  // strip “glass” internal optics (white-lab friendly)
  const glassBg =
    `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06)),` +
    `radial-gradient(560px 240px at 18% 18%, ${toneRGBA(tone, mode === "LOCKED" ? 0.16 : 0.10)}, rgba(255,255,255,0) 70%),` +
    `radial-gradient(520px 240px at 88% 82%, rgba(0,0,0,0.08), rgba(255,255,255,0) 70%)`;

  return (
    <div
      className="rounded-2xl px-5 py-4 relative overflow-hidden"
      style={{
        border,
        background: glassBg,
        backdropFilter: "blur(14px) saturate(1.35)",
        WebkitBackdropFilter: "blur(14px) saturate(1.35)",
        boxShadow:
          `inset 0 1px 0 rgba(255,255,255,0.70), ` +
          `inset 0 0 0 1px rgba(255,255,255,0.30), ` +
          `0 18px 70px rgba(0,0,0,0.10), ` +
          `0 0 0 1px ${toneRGBA(tone, mode === "LOCKED" ? 0.10 : 0.06)}`,
      }}
    >
      {/* top edge line */}
      <div
        className="absolute left-0 right-0 top-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${toneRGBA(tone, mode === "LOCKED" ? 0.42 : 0.22)}, transparent)`,
          mixBlendMode: "screen",
          opacity: mode === "IDLE" ? 0.55 : 0.95,
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.26em]" style={{ color: headClr }}>
            TELEMETRÍA // INPUT ENCAPSULADO
          </div>

          <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em]" style={{ color: subClr }}>
            PLANE:{plane} <span style={{ color: microClr }}>|</span> NODE:{nodeStr}{" "}
            <span style={{ color: microClr }}>|</span> LOCK:{lockStr}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {/* mode chip */}
          <div
            className="rounded-2xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.26em]"
            style={{
              border: `1px solid ${mode === "LOCKED" ? toneRGBA(tone, 0.22) : "rgba(0,0,0,0.12)"}`,
              background: mode === "LOCKED" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.10)",
              color: mode === "LOCKED" ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.66)",
              boxShadow: `0 0 0 1px ${toneRGBA(tone, mode === "LOCKED" ? 0.12 : 0.06)} inset`,
            }}
          >
            {mode}
          </div>

          {/* input energy */}
          <div className="font-mono text-[11px] uppercase tracking-[0.26em]" style={{ color: microClr }}>
            {Math.round(activity * 100)}% INPUT
          </div>
        </div>
      </div>

      {/* timeline */}
      <div className="mt-4">
        <div
          className="h-[10px] rounded-full overflow-hidden relative"
          style={{
            background: "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {/* ticks */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 11 }).map((_, i) => {
              const x = (i / 10) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[1px]"
                  style={{
                    left: `${x}%`,
                    background: i === 5 ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.08)",
                    opacity: i === 0 || i === 10 ? 0.40 : 0.70,
                  }}
                />
              );
            })}
          </div>

          {/* fill */}
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: `${Math.round(prog * 100)}%`,
              background: `linear-gradient(90deg,
                ${toneRGBA(tone, 0.08)},
                ${toneRGBA(tone, mode === "LOCKED" ? 0.48 : 0.36)},
                ${toneRGBA(tone, 0.12)})`,
              mixBlendMode: "screen",
              transition: "width 420ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />

          {/* marker */}
          <div
            className="absolute top-[-3px] h-[16px] w-[2px]"
            style={{
              left: `${Math.round(prog * 100)}%`,
              background: toneRGBA(tone, mode === "LOCKED" ? 0.68 : 0.54),
              boxShadow: `0 0 0 1px rgba(255,255,255,0.50), 0 0 16px ${toneRGBA(tone, 0.22)}`,
              transform: "translateX(-1px)",
            }}
          />
        </div>

        {/* auditline ticker (optional) */}
        {audit && audit.length > 0 && (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0 font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: microClr }}>
              AUDITLINE:
              <span style={{ color: toneRGBA(tone, 0.62) }}>
                {" "}
                {audit.slice(-1)[0]?.ev || "—"}
              </span>
            </div>

            {seal && (
              <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: microClr }}>
                SEAL:{/* formal */}
                <span style={{ color: toneRGBA(tone, 0.62) }}> {seal}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* footer row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: microClr }}>
          RAF: CONTROLLED
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: microClr }}>
          TIMER: {Math.round(telemetry.dt)}ms
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: microClr }}>
          CHAIN: INTACT
        </div>
      </div>

      {/* subtle bottom edge */}
      <div
        className="absolute left-0 right-0 bottom-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent)`,
          opacity: 0.70,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   B6 — Interaction & Telemetry Fin
────────────────────────────────────────────────────────────── */


/* ──────────────────────────────────────────────────────────────
   B7 — Overlays / Seals Inicio
────────────────────────────────────────────────────────────── */

type FormalAction = "REGISTER" | "LOCK_CONFIRM" | "RESET";

function fmtMs(ms: number) {
  return `${Math.round(ms)}ms`;
}
function pseudoHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const x = (h >>> 0).toString(16).padStart(8, "0");
  return `EVID-${x.toUpperCase()}-${x.slice(0, 4)}`;
}
function useDismissControls({ enabled, onDismiss }: { enabled: boolean; onDismiss: () => void }) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onDismiss]);
}

function SealStamp({
  tone,
  plane,
  route,
  dt,
  nodeId,
}: {
  tone: Tone;
  plane: Plane;
  route: string;
  dt: number;
  nodeId: string;
}) {
  const stamp = useMemo(() => {
    const id = pseudoHash(`${route}|${plane}|${nodeId}|${Math.round(dt)}`);
    return { id, route, plane, nodeId, t: fmtMs(dt), chain: "INTACT", auth: "VERIFIED" };
  }, [route, plane, nodeId, dt]);

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        border: `1px solid rgba(0,0,0,0.12)`,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px) saturate(1.5)",
        WebkitBackdropFilter: "blur(16px) saturate(1.5)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">
            FORMAL SEAL // EVIDENCE ACT
          </div>
          <div className="mt-2 font-black text-[18px] text-black leading-tight">{stamp.id}</div>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black/55 truncate">
            {stamp.route}
          </div>
        </div>

        <div
          className="shrink-0 rounded-2xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.26em]"
          style={{
            border: `1px solid rgba(0,0,0,0.14)`,
            background: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(255,255,255,0.08))`,
          }}
        >
          {stamp.auth}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ["PLANE", stamp.plane],
          ["NODE", stamp.nodeId],
          ["TIMER", stamp.t],
          ["CHAIN", stamp.chain],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-xl px-3 py-2"
            style={{ border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.06)" }}
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.26em] text-black/45">{k}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-black/75">{v}</div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 h-[1px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${toneRGBA(tone, 0.55)}, transparent)`,
          mixBlendMode: "screen",
          filter: "blur(0.25px)",
        }}
      />
      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.26em] text-black/45">
        RECORD_MODE: APPEND_ONLY // AUDIT_READY
      </div>
    </div>
  );
}

function FormalOverlay({
  open,
  tone,
  plane,
  telemetry,
  activeNode,
  lockedNode,
  onClose,
  onCommit,
}: {
  open: boolean;
  tone: Tone;
  plane: Plane;
  telemetry: { dt: number; progress: number; plane: Plane; nodeId: NodeId | null; lockedId: NodeId | null };
  activeNode: { id: string; label: string; route: string } | null;
  lockedNode: { id: string; label: string; route: string } | null;
  onClose: () => void;
  onCommit: (action: FormalAction) => void;
}) {
  useDismissControls({ enabled: open, onDismiss: onClose });
  if (!open) return null;

  const n = lockedNode || activeNode;
  const route = n?.route ?? "ACCESS_ROUTE://—";
  const nodeId = n?.id ?? "—";
  const title = plane === "REGISTER" ? "REGISTRO FORMAL" : plane === "LOCKED" ? "ESTADO BLOQUEADO" : "ACTO";
  const actionLabel = plane === "REGISTER" ? "COMMIT_REGISTER" : plane === "LOCKED" ? "CONFIRM_LOCK" : "ACK";

  return (
    <div className="absolute inset-0 z-[9999]" style={{ pointerEvents: "auto" }} aria-modal="true" role="dialog">
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(8px) saturate(1.15)",
          WebkitBackdropFilter: "blur(8px) saturate(1.15)",
        }}
      />

      <div
        className="absolute inset-[42px] rounded-[28px]"
        style={{
          border: `1px solid rgba(0,0,0,0.12)`,
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(18px) saturate(1.55)",
          WebkitBackdropFilter: "blur(18px) saturate(1.55)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            border: `1px solid ${toneRGBA(tone, 0.35)}`,
            boxShadow: `0 0 0 1px ${toneRGBA(tone, 0.15)} inset`,
            mixBlendMode: "screen",
          }}
        />

        <div className="flex items-center justify-between px-8 pt-7">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">OVERLAY // FORMAL ACT</div>
            <div className="mt-2 font-black text-[30px] text-black leading-none">{title}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black/55 truncate">
              TARGET: {n?.label ?? "—"} <span className="text-black/35">|</span> PLANE: {plane}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-3 font-mono text-[11px] uppercase tracking-[0.26em]"
            style={{ border: "1px solid rgba(0,0,0,0.14)", background: "rgba(255,255,255,0.10)" }}
          >
            CLOSE (ESC)
          </button>
        </div>

        <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 px-8 pb-8 pt-6 h-[calc(100%-98px)]">
          <div className="flex flex-col gap-4 overflow-hidden">
            <SealStamp tone={tone} plane={plane} route={route} dt={telemetry.dt} nodeId={nodeId} />

            <div className="rounded-2xl px-5 py-4" style={{ border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.07)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">
                DECLARACIÓN // PRINCIPIO OPERATIVO
              </div>
              <div className="mt-3 text-black/78 text-[16px] leading-relaxed">
                Este acto no “abre una pantalla”. <br />
                <span className="font-semibold">Registra una decisión</span> dentro del sistema.
              </div>

              <div
                className="mt-4 h-[1px] w-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent)", mixBlendMode: "multiply" }}
              />
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-black/45">
                WRITE_POLICY: APPEND_ONLY // REVERSAL: CONTROLLED
              </div>
            </div>

            <div className="rounded-2xl px-5 py-4" style={{ border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.06)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">AUDIT LINE // VISIBLE LOG</div>
              <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-black/75">
                [{plane}] {nodeId} :: T+{Math.round(telemetry.dt)}ms :: CHAIN_INTACT
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.26em] text-black/45">
                DISMISS: ESC / OUTSIDE_CLICK / CLOSE_BUTTON
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl px-5 py-4"
              style={{
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px) saturate(1.25)",
                WebkitBackdropFilter: "blur(14px) saturate(1.25)",
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">CONTROL // ACCIÓN FORMAL</div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  onClick={() => onCommit(plane === "REGISTER" ? "REGISTER" : "LOCK_CONFIRM")}
                  className="rounded-2xl px-5 py-4 text-left"
                  style={{ border: `1px solid ${toneRGBA(tone, 0.22)}`, background: "rgba(255,255,255,0.10)" }}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">{actionLabel}</div>
                  <div className="mt-2 font-black text-[18px] text-black leading-tight">Confirmar acto</div>
                  <div className="mt-2 text-black/70 text-[13px] leading-snug">
                    Esto fija el estado y mantiene la cadena íntegra.
                  </div>
                </button>

                <button
                  onClick={() => onCommit("RESET")}
                  className="rounded-2xl px-5 py-4 text-left"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)" }}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">RESET_CLEAN</div>
                  <div className="mt-2 font-black text-[18px] text-black leading-tight">Reinicio auditable</div>
                  <div className="mt-2 text-black/70 text-[13px] leading-snug">
                    Cierra overlay y regresa a IDLE sin residuos.
                  </div>
                </button>
              </div>

              <div
                className="mt-4 h-[1px] w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${toneRGBA(tone, 0.30)}, transparent)`,
                  mixBlendMode: "screen",
                  filter: "blur(0.2px)",
                }}
              />

              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-black/45">
                NOTE: Overlay ≠ marketing. Overlay = acto formal.
              </div>
            </div>

            <div className="rounded-2xl px-5 py-4" style={{ border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.06)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">SAFETY // EVENT DISCIPLINE</div>
              <div className="mt-2 text-black/72 text-[13px] leading-snug">
                El overlay captura interacción solo dentro del frame. Fuera = dismiss. <br />
                Nada “rebota”. Nada “grita”. Todo pesa.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06), inset 0 0 120px rgba(0,0,0,0.08)" }} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Slide09 — FINAL ASSEMBLY (B1..B7 integrated)
   + Background “white lab” (glass-friendly, NO dark)
   + Interactividad + FX pack (sin quitar features)
────────────────────────────────────────────────────────────── */

export const Slide09: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({ nextSlide, prevSlide }) => {
  const shellRef = useRef<HTMLDivElement>(null);

  // optics (B2) expects normalized mouse
  const mouse = useRafMouse(shellRef);

  // state machine (B4)
  const sm = useEvidenceStateMachine();
  const plane = sm.phase.plane;
  const activeId = sm.phase.nodeId;
  const lockedId = sm.phase.lockedId;

  const activeNode = useMemo(() => NODES.find((n) => n.id === activeId) || null, [activeId]);
  const lockedNode = useMemo(() => NODES.find((n) => n.id === lockedId) || null, [lockedId]);
  const tone = (lockedNode || activeNode)?.tone ?? "cyan";

  // telemetry (B6)
  const par = useParallaxTelemetry(shellRef);

  // overlay control: COMMIT closes overlay but keeps LOCK
  const [overlaySuppressed, setOverlaySuppressed] = useState(false);

  useEffect(() => {
    if (plane === "REGISTER" || plane === "LOCKED") setOverlaySuppressed(false);
  }, [plane]);

  const overlayOpen = (plane === "REGISTER" || plane === "LOCKED") && !overlaySuppressed;

  // Outside click resets lock (discipline)
  useOutsideClick(shellRef, !!lockedId, () => sm.clearLock());

  /* ============================
     Interaction+FX Pack (v1)
     ============================ */

  // Reduced motion (no rompe estética)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => setReducedMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Debug overlay toggle (D)
  const [debugOn, setDebugOn] = useState(false);

  // Hover delay (masa) — evita “instantáneo de SaaS”
  const hoverTimer = useRef<number | null>(null);
  const hoverDelayMs = plane === "IDLE" ? 110 : 80;

  const setHoverDelayed = (id: NodeId | null) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => sm.setHover(id), hoverDelayMs);
  };

  // “Operator keyboard” — flechas + Enter + L + Esc + D
  const nodeOrder = useMemo(() => NODES.map((n) => n.id), []);
  const idxOf = (id: NodeId | null) => (id ? Math.max(0, nodeOrder.indexOf(id)) : 0);

  // Observer mode (si no hay input, el sistema sigue vivo)
  const lastInputRef = useRef(performance.now());
  const [observer, setObserver] = useState(false);
  useEffect(() => {
    const tick = () => {
      const idleFor = performance.now() - lastInputRef.current;
      setObserver(idleFor > 2400 && plane === "IDLE" && !overlayOpen);
      rafObs.current = requestAnimationFrame(tick);
    };
    const rafObs = { current: 0 as number };
    rafObs.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafObs.current);
  }, [plane, overlayOpen]);

  // Audit trail in-mem (para debug/telemetría)
  const auditTrail = useRef<
    { t: number; ev: string; plane: Plane; node: NodeId | null; locked: NodeId | null }[]
  >([]);
  const lastPhaseKey = useRef<string>("");

  useEffect(() => {
    const key = `${plane}|${activeId || "-"}|${lockedId || "-"}`;
    if (key === lastPhaseKey.current) return;
    lastPhaseKey.current = key;

    auditTrail.current.push({
      t: performance.now(),
      ev: `PHASE_CHANGE:${plane}`,
      plane,
      node: activeId,
      locked: lockedId,
    });

    // keep short
    if (auditTrail.current.length > 40) auditTrail.current.splice(0, auditTrail.current.length - 40);
  }, [plane, activeId, lockedId]);

  // “Input velocity” → energía (para FX)
  const v = clamp(Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy), 0, 2.2);
  const energy = clamp(0.10 + v * 0.18 + (plane === "LOCKED" ? 0.28 : plane === "REGISTER" ? 0.22 : plane === "ACCESS" ? 0.14 : 0.08), 0.12, 0.72);

// ESC resets (discipline) + operator keys (NO slide nav aquí; App ya lo hace global)
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    lastInputRef.current = performance.now();

    // 🔒 NO manejar ArrowLeft/ArrowRight aquí.
    // App.tsx ya hace navegación global y si lo duplicamos se “brinca” slides.

    if (e.key === "Escape") {
      setOverlaySuppressed(false);
      auditTrail.current.push({
        t: performance.now(),
        ev: "RESET:ESC",
        plane,
        node: activeId,
        locked: lockedId,
      });
      sm.hardReset();
      return;
    }

    if (e.key.toLowerCase() === "d") {
      setDebugOn((s) => !s);
      return;
    }

    // Node navigation (operator)
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();

      const cur = lockedId || activeId || nodeOrder[0];
      const i = idxOf(cur);

      const next =
        e.key === "ArrowUp"
          ? nodeOrder[(i - 1 + nodeOrder.length) % nodeOrder.length]
          : nodeOrder[(i + 1) % nodeOrder.length];

      auditTrail.current.push({
        t: performance.now(),
        ev: `NAV:${e.key}`,
        plane,
        node: next,
        locked: lockedId,
      });

      sm.setHover(next);
      return;
    }

    // Enter = select/register
    if (e.key === "Enter") {
      const cur = lockedId || activeId || nodeOrder[0];
      auditTrail.current.push({
        t: performance.now(),
        ev: "ACT:ENTER_SELECT",
        plane,
        node: cur,
        locked: lockedId,
      });
      sm.clickSelect(cur);
      return;
    }

    // L = toggle lock cleanup
    if (e.key.toLowerCase() === "l") {
      if (lockedId) {
        auditTrail.current.push({
          t: performance.now(),
          ev: "LOCK:CLEAR",
          plane,
          node: activeId,
          locked: lockedId,
        });
        sm.clearLock();
      } else if (activeId) {
        auditTrail.current.push({
          t: performance.now(),
          ev: "LOCK:ARM",
          plane,
          node: activeId,
          locked: null,
        });
        sm.clickSelect(activeId);
      }
      return;
    }
  };

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [sm, plane, activeId, lockedId, nodeOrder]);


  // Camera (weighty, slow)
  const depth = plane === "ACCESS" || plane === "REGISTER" || plane === "LOCKED" ? 1.0 : 0.75;
  const tx = (mouse.x - 0.5) * 18 * depth;
  const ty = (mouse.y - 0.5) * 14 * depth;
  const rx = (mouse.y - 0.5) * 0.55 * (plane === "IDLE" ? 0.35 : 1);
  const ry = (mouse.x - 0.5) * -0.7 * (plane === "IDLE" ? 0.35 : 1);
  const scale = plane === "IDLE" ? 1.0 : 1.02;
  const dur = plane === "IDLE" ? 720 : 520;

  // Background optics helpers
  const hx = Math.round(16 + mouse.x * 68);
  const hy = Math.round(10 + mouse.y * 56);

  // Background should be LIGHT (not transparent), to “sell” glass edges
  const backgroundBase =
    `radial-gradient(1100px 760px at ${hx}% ${hy}%, rgba(255,255,255,0.95), rgba(255,255,255,0.82) 48%, rgba(255,255,255,0.72) 78%),` +
    `linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,250,252,0.94))`;

  // Holo stripe (subtle)
  const holoStripe =
    `linear-gradient(135deg,
      rgba(2,167,202,0.00) 0%,
      rgba(2,167,202,0.06) 18%,
      rgba(255,255,255,0.00) 34%,
      rgba(171,123,38,0.05) 52%,
      rgba(255,255,255,0.00) 70%,
      rgba(2,111,134,0.06) 86%,
      rgba(255,255,255,0.00) 100%)`;

  // Microtexture (png-less) — noise “impreso”
  const microTexture =
    `repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 6px),` +
    `repeating-linear-gradient(90deg, rgba(0,0,0,0.010) 0px, rgba(0,0,0,0.010) 1px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 8px)`;

  // Light sweep (follows mouse + energy)
  const sweep =
    `radial-gradient(760px 420px at ${hx}% ${hy}%,
      ${toneRGBA(tone, 0.16 + energy * 0.20)},
      rgba(255,255,255,0) 66%)`;

  return (
    <SlideContainer>
      <div
        ref={shellRef}
        className="relative w-full h-full overflow-hidden rounded-[24px]"
        style={{
          ...shellFont,
          // ✅ CHANGE: ya NO transparent. White lab base para que el vidrio luzca.
          background: backgroundBase,
        }}
        onMouseMove={() => (lastInputRef.current = performance.now())}
        onMouseDown={() => (lastInputRef.current = performance.now())}
      >
        {/* Local styles (no global) */}
        <style>{`
          @keyframes s09_breathe {
            0% { transform: translate3d(0,0,0); opacity: 0.16; }
            50% { transform: translate3d(0,-6px,0); opacity: 0.22; }
            100% { transform: translate3d(0,0,0); opacity: 0.16; }
          }
          @keyframes s09_shimmer {
            0% { transform: translate3d(-8px,0,0); opacity: 0.10; }
            50% { transform: translate3d(8px,0,0); opacity: 0.14; }
            100% { transform: translate3d(-8px,0,0); opacity: 0.10; }
          }
        `}</style>

        {/* BACKGROUND OPTICS LAYERS (glass-friendly) */}
        <LayerBG>
          {/* Base already in shell background; add subtle optics so edges pop */}
          <div className="absolute inset-0" style={{ background: holoStripe, opacity: 0.44, mixBlendMode: "multiply" }} />
          <div className="absolute inset-0" style={{ background: microTexture, opacity: 0.26, mixBlendMode: "multiply" }} />
          <div className="absolute inset-0" style={{ background: sweep, opacity: 0.80, mixBlendMode: "screen", filter: "blur(0.4px)" }} />

          {/* Observer breathing halo (only idle, no overlay) */}
          {!reducedMotion && observer && (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(900px 520px at 60% 40%, ${toneRGBA(tone, 0.14)}, rgba(255,255,255,0) 70%)`,
                mixBlendMode: "screen",
                animation: "s09_breathe 2.8s ease-in-out infinite",
              }}
            />
          )}

          {/* Original BG engine */}
          <CrystalStageBG plane={plane} tone={tone} mouse={mouse} />
        </LayerBG>

        <LayerFX>
          {/* Extra shimmer (discipline) */}
          {!reducedMotion && (
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.18 + energy * 0.18,
                background: `linear-gradient(90deg, rgba(255,255,255,0), ${toneRGBA(tone, 0.18)}, rgba(255,255,255,0))`,
                mixBlendMode: "screen",
                filter: "blur(0.35px)",
                animation: "s09_shimmer 2.2s ease-in-out infinite",
              }}
            />
          )}

          <CrystalStageFX plane={plane} tone={tone} mouse={mouse} />
        </LayerFX>

        <LayerUI>
          <div
            className="absolute inset-0"
            style={{
              transform:
                `perspective(1600px) translate3d(${tx}px, ${ty}px, 0) ` +
                `rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
              transformOrigin: "62% 44%",
              transition: reducedMotion ? undefined : `transform ${dur}ms cubic-bezier(.2,.9,.2,1)`,
            }}
          >
            <Header title={NARRATIVE.title} breadcrumb={NARRATIVE.breadcrumb} slideNum={10} />

            <div className="mt-8 grid grid-cols-12 gap-6 px-10">
              {/* LEFT column (nodes + narrative) */}
              <div className="col-span-5 flex flex-col gap-4">
                <NarrativeSystem plane={plane} telemetry={sm.telemetry} />

                <NodeStack
                  plane={plane}
                  mouse={mouse}
                  activeId={activeId}
                  lockedId={lockedId}
                  // ✅ hover con masa (delay)
                  onNodeEnter={(id) => {
                    lastInputRef.current = performance.now();
                    auditTrail.current.push({ t: performance.now(), ev: `HOVER_IN:${id}`, plane, node: id, locked: lockedId });
                    setHoverDelayed(id);
                  }}
                  onNodeLeave={() => {
                    lastInputRef.current = performance.now();
                    auditTrail.current.push({ t: performance.now(), ev: "HOVER_OUT", plane, node: activeId, locked: lockedId });
                    setHoverDelayed(null);
                  }}
                  onNodeClick={(id) => {
                    lastInputRef.current = performance.now();
                    auditTrail.current.push({ t: performance.now(), ev: `CLICK:${id}`, plane, node: id, locked: lockedId });
                    sm.clickSelect(id);
                  }}
                />

                <TelemetryStrip tone={tone} plane={plane} telemetry={sm.telemetry} parallax={par} />
              </div>

              {/* RIGHT column (detail pane) */}
              <div className="col-span-7 h-[640px] relative">
                <div
                  className="h-full rounded-3xl p-7 relative"
                  style={{
                    ...crystalPanelStyle({ plane, tone, mouse, role: "pane" }),
                  }}
                >
                  {/* subtle internal “lightline” to sell thickness */}
                  <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      boxShadow:
                        `inset 0 0 0 1px rgba(255,255,255,0.50), ` +
                        `inset 0 0 0 2px rgba(255,255,255,0.16), ` +
                        `inset 0 0 46px rgba(2,167,202,${0.05 + energy * 0.10})`,
                      mixBlendMode: "screen",
                    }}
                  />

                  <DetailPaneBody plane={plane} activeNode={activeNode} lockedNode={lockedNode} />

                  <div className="mt-8 border-t pt-4 text-[14px]" style={{ borderColor: "rgba(40,44,52,0.10)", color: TXT.secondary }}>
                    {NARRATIVE.principle}
                  </div>

                  <div className="absolute bottom-6 left-7 right-7 flex items-center justify-between">
                    <div className="text-[13px]" style={{ color: TXT.secondary }}>
                      {NARRATIVE.footer}
                    </div>
                    <div className="font-mono text-[11px] tracking-[0.26em] uppercase" style={{ color: TXT.faint }}>
                     ESC = RESET // ↑↓ NODES // ENTER = SELECT // L = LOCK // D = DEBUG
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 px-10">
              <NavArea prev={prevSlide} next={nextSlide} />
            </div>
          </div>

          {/* DEBUG OVERLAY (dev) */}
          {debugOn && (
            <div
              className="absolute left-6 top-6 rounded-2xl px-4 py-3"
              style={{
                border: "1px solid rgba(40,44,52,0.14)",
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(14px) saturate(1.25)",
                WebkitBackdropFilter: "blur(14px) saturate(1.25)",
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: TXT.micro }}>
                DEBUG // VIS
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: TXT.monoStrong }}>
                PLANE: {plane} · TONE: {tone}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: TXT.monoStrong }}>
                MOUSE: {mouse.x.toFixed(2)},{mouse.y.toFixed(2)} · v={v.toFixed(2)} · E={energy.toFixed(2)}
              </div>
              <div className="mt-2 h-[1px] w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(40,44,52,0.12), transparent)" }} />
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: TXT.faint }}>
                last: {auditTrail.current[auditTrail.current.length - 1]?.ev || "—"}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: TXT.faint }}>
                D toggle · ESC reset
              </div>
            </div>
          )}
        </LayerUI>

        <LayerOverlay>
          <FormalOverlay
            open={overlayOpen}
            tone={tone}
            plane={plane}
            telemetry={sm.telemetry}
            activeNode={activeNode ? { id: activeNode.id, label: activeNode.label, route: activeNode.route } : null}
            lockedNode={lockedNode ? { id: lockedNode.id, label: lockedNode.label, route: lockedNode.route } : null}
            onClose={() => {
              lastInputRef.current = performance.now();
              auditTrail.current.push({ t: performance.now(), ev: "OVERLAY:CLOSE", plane, node: activeId, locked: lockedId });
              setOverlaySuppressed(false);
              sm.hardReset();
            }}
            onCommit={(action) => {
              lastInputRef.current = performance.now();
              auditTrail.current.push({ t: performance.now(), ev: `OVERLAY:COMMIT:${action}`, plane, node: activeId, locked: lockedId });

              if (action === "RESET") {
                setOverlaySuppressed(false);
                return sm.hardReset();
              }
              // COMMIT: cierra overlay, mantiene LOCK
              setOverlaySuppressed(true);
            }}
          />
        </LayerOverlay>

        {/* Edge discipline frame (glass-friendly, light) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(40,44,52,0.06), " +
              "inset 0 0 140px rgba(0,0,0,0.06), " +
              `inset 0 0 0 2px ${toneRGBA(tone, 0.05)}`,
          }}
        />
      </div>
    </SlideContainer>
  );
};

