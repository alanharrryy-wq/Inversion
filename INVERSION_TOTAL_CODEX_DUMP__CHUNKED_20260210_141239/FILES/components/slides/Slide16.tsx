
/* =====================================================================================
   HEADER MONOLITO — SLIDE 16
   VERSION: 1.0.0
   PURPOSE:
   - Single React import (monolithic file)
   - Guard against double-evaluation
   - Enforce zero phantom imports
   - Centralize global compile rules
   ===================================================================================== */

/* =========================
   🚨 REGLAS NO NEGOCIABLES
   =========================
   1) ESTE ES EL ÚNICO `import * as React from "react";` DEL ARCHIVO
   2) PROHIBIDO importar desde "./Slide16Shell", "./B5_NarrativeEngine", etc.
      (todo vive en ESTE archivo)
   3) Ningún bloque vuelve a declarar `Z`
   4) Si algo truena, revisa imports duplicados ANTES de tocar lógica
*/

/* ===== ÚNICO IMPORT PERMITIDO ===== */
import * as React from "react";

/* =========================
   🧪 GUARD MONOLITO (DEV)
   =========================
   Detecta:
   - doble evaluación del archivo
   - redeclaración accidental
   - hot reload agresivo
*/
declare global {
  interface Window {
    __SLIDE16_MONOLITH_GUARD__?: number;
  }
}

if (typeof window !== "undefined") {
  window.__SLIDE16_MONOLITH_GUARD__ =
    (window.__SLIDE16_MONOLITH_GUARD__ || 0) + 1;

  if (window.__SLIDE16_MONOLITH_GUARD__ > 1) {
    console.warn(
      "[SLIDE16][MONOLITH]",
      "El archivo fue evaluado más de una vez.",
      "Si ves errores tipo 'Identifier already declared',",
      "revisa imports duplicados o hot-reload del entorno."
    );
  }
}

/* =========================
   🧠 GLOBAL CONSTANTS (SAFE)
   =========================
   (NO meter Z aquí, Z vive en B1)
*/
export const __SLIDE16_VERSION__ = "3.0.0";
export const __SLIDE16_BUILD_TS__ = new Date().toISOString();

/* =====================================================================================
   FIN DEL HEADER MONOLITO
   A PARTIR DE AQUÍ: B1, B2, B3, B4, B5, B6, B7, B0
   ===================================================================================== */

// HOTFIX v1.0.1 — encabezado único


// 1) BORRA todos los demás: `import * as React from "react";` dentro del archivo
// 2) BORRA: `import { Z } from "./Slide16Shell";` (si todo está en el mismo archivo)
// 3) BORRA: `import { Mode, NarrativeContext } from "./B5_NarrativeEngine";` (si todo está en el mismo archivo)

/* =====================================================================================
   B1 — SLIDE 16 ARCHITECTURE & SHELL (CORREGIDO)
   VERSION: 1.0.1
   PURPOSE:
   - Establish strict layer system (BG / FX / DECOR / UI / UI_FLOAT / OVERLAYS)
   - Prevent duplicated layers (NO "reserved" mounts inside shell)
   - Serve as immutable foundation for all other blocks
   ===================================================================================== */


/* =====================================================================================
   GLOBAL RULES (DO NOT BREAK)
   =====================================================================================
   1) FX layers NEVER capture pointer events
   2) UI layers NEVER assume z-index implicitly
   3) Overlays ALWAYS live above UI
   4) Nothing visual decides interaction
   5) Shell must NOT mount "reserved" layers internally (avoid duplicates)
*/

/* =====================================================================================
   Z-INDEX CONTRACT
   ===================================================================================== */

export const Z = {
  BG: 0,
  FX: 10,
  DECOR: 15,
  UI: 20,
  UI_FLOAT: 30,
  OVERLAY: 40,
  DEBUG: 90,
} as const;

/* =====================================================================================
   BASE TYPES
   ===================================================================================== */

type LayerProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/* =====================================================================================
   LOW LEVEL LAYERS
   ===================================================================================== */

/* ---------- BACKGROUND (static, no interaction) ---------- */
export const LayerBG = ({ children, className, style }: LayerProps) => {
  return (
    <div
      data-layer="bg"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Z.BG,
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- FX (glass, noise, glow, scanlines) ---------- */
export const LayerFX = ({ children, className, style }: LayerProps) => {
  return (
    <div
      data-layer="fx"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Z.FX,
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- DECOR (purely visual UI-adjacent) ---------- */
export const LayerDecor = ({ children, className, style }: LayerProps) => {
  return (
    <div
      data-layer="decor"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Z.DECOR,
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- MAIN UI (all interaction lives here) ---------- */
export const LayerUI = ({ children, className, style }: LayerProps) => {
  return (
    <div
      data-layer="ui"
      className={className}
      style={{
        position: "relative",
        zIndex: Z.UI,
        pointerEvents: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- FLOATING UI (tooltips, helper widgets) ---------- */
export const LayerUIFloat = ({ children, className, style }: LayerProps) => {
  return (
    <div
      data-layer="ui-float"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Z.UI_FLOAT,
        pointerEvents: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- OVERLAYS (drawers, modals, proofs) ---------- */
export const LayerOverlay = ({
  open,
  children,
  className,
  style,
}: LayerProps & { open: boolean }) => {
  return (
    <div
      data-layer="overlay"
      aria-hidden={!open}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Z.OVERLAY,
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transition: "opacity 260ms ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* =====================================================================================
   SHELL CONTAINER — SLOT BASED (NO DUPLICATE LAYERS)
   ===================================================================================== */

export type Slide16ShellProps = {
  /** Main interactive UI goes here */
  children?: React.ReactNode;

  /** Optional slots: mount these from B0 (or your root) */
  bg?: React.ReactNode;        // LayerBG content
  fx?: React.ReactNode;        // LayerFX content (VisualEngine)
  decor?: React.ReactNode;     // LayerDecor content
  uiFloat?: React.ReactNode;   // LayerUIFloat content
  overlays?: React.ReactNode;  // Overlay content (your OverlayShell/Drawer, etc.)

  debug?: boolean;
};

export const Slide16Shell = ({
  children,
  bg,
  fx,
  decor,
  uiFloat,
  overlays,
  debug = false,
}: Slide16ShellProps) => {
  return (
    <div
      data-slide="16"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 24,
        background: "#05080C",
        color: "white",
      }}
    >
      {/* BG SLOT */}
      {bg ? <LayerBG>{bg}</LayerBG> : null}

      {/* FX SLOT */}
      {fx ? <LayerFX>{fx}</LayerFX> : null}

      {/* DECOR SLOT */}
      {decor ? <LayerDecor>{decor}</LayerDecor> : null}

      {/* UI (always present) */}
      <LayerUI>{children}</LayerUI>

      {/* FLOATING UI SLOT */}
      {uiFloat ? <LayerUIFloat>{uiFloat}</LayerUIFloat> : null}

      {/* OVERLAYS SLOT (already controls open/close internally) */}
      {overlays ? overlays : null}

      {debug ? <DebugOverlay /> : null}
    </div>
  );
};

/* =====================================================================================
   DEBUG (OPTIONAL, SAFE)
   ===================================================================================== */

const DebugOverlay = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Z.DEBUG,
        pointerEvents: "none",
        fontSize: 10,
        color: "#22c55e",
      }}
    >
      <pre style={{ opacity: 0.6, margin: 12 }}>
{`Z-INDEX MAP
BG:       ${Z.BG}
FX:       ${Z.FX}
DECOR:    ${Z.DECOR}
UI:       ${Z.UI}
UI_FLOAT: ${Z.UI_FLOAT}
OVERLAY:  ${Z.OVERLAY}
`}
      </pre>
    </div>
  );
};

/* =====================================================================================
   END OF B1 v1.0.1
   ===================================================================================== */

/* =====================================================================================
   END OF B1
   NOTHING BELOW THIS LINE BELONGS HERE
   ===================================================================================== */
/* =====================================================================================
   B2 — VISUAL ENGINE (MONOLITO SAFE)
   VERSION: 1.0.1
   PURPOSE:
   - Provide premium glass + depth visuals
   - Zero interaction, zero business logic
   - Uses Z from B1 (same file). NO imports here.
   ===================================================================================== */

/* =====================================================================================
   VISUAL TOKENS
   ===================================================================================== */

export const VisualTokens = {
  glass: {
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.18)",
    blur: "blur(14px)",
  },
  glow: {
    cyan: "rgba(2,167,202,0.35)",
    gold: "rgba(171,123,38,0.35)",
    soft: "rgba(255,255,255,0.15)",
  },
  noiseOpacity: 0.05,
};

/* =====================================================================================
   GLASS PANEL
   ===================================================================================== */

export const GlassPanel = ({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      data-visual="glass"
      style={{
        position: "relative",
        background: VisualTokens.glass.bg,
        backdropFilter: VisualTokens.glass.blur,
        WebkitBackdropFilter: VisualTokens.glass.blur,
        border: `1px solid ${VisualTokens.glass.border}`,
        borderRadius: 20,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* =====================================================================================
   GLOW LAYERS
   ===================================================================================== */

export const GlowOrb = ({
  color,
  size = 420,
  x = "50%",
  y = "50%",
}: {
  color: string;
  size?: number;
  x?: string;
  y?: string;
}) => {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: "translate(-50%,-50%)",
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: "blur(40px)",
        opacity: 0.9,
        zIndex: Z.FX,
        pointerEvents: "none",
      }}
    />
  );
};

/* =====================================================================================
   SCANLINES
   ===================================================================================== */

export const Scanlines = () => {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 4px)",
        opacity: 0.12,
        zIndex: Z.FX,
        pointerEvents: "none",
      }}
    />
  );
};

/* =====================================================================================
   NOISE OVERLAY (SVG DATA)
   ===================================================================================== */

const noiseSvg = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)' opacity='0.4'/>
</svg>
`);

export const NoiseOverlay = () => {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,${noiseSvg}")`,
        opacity: VisualTokens.noiseOpacity,
        zIndex: Z.FX,
        pointerEvents: "none",
      }}
    />
  );
};

/* =====================================================================================
   DEPTH GRID
   ===================================================================================== */

export const DepthGrid = () => {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        opacity: 0.25,
        zIndex: Z.DECOR,
        pointerEvents: "none",
      }}
    />
  );
};

/* =====================================================================================
   VISUAL ENGINE WRAPPER
   ===================================================================================== */

export const VisualEngine = () => {
  return (
    <>
      {/* ambient glows */}
      <GlowOrb color={VisualTokens.glow.cyan} x="25%" y="30%" />
      <GlowOrb color={VisualTokens.glow.gold} x="75%" y="70%" />

      {/* grid + noise */}
      <DepthGrid />
      <NoiseOverlay />

      {/* scanlines on top */}
      <Scanlines />
    </>
  );
};

/* =====================================================================================
   END OF B2 v1.0.1
   ===================================================================================== */



/* =====================================================================================
   B3 — FUNDS CORE (SACRED VITRAL DONUT + LEGEND)
   VERSION: 2.1.0
   CHANGES:
   - Higher color contrast between slices
   - Added "inner channel" (transparent / invisible center of ring) via cut-out stroke
   - Stronger vitral identity per slice (neon cyan vs hot magenta vs gold)
   - Kept: 3D parallax, specular sweep, prism texture, micro-noise
   ===================================================================================== */

type FundKey = "debt" | "ops" | null;

type FundSlice = {
  key: FundKey;
  label: string;
  pct: number;      // 0..1
  amount: string;
  colorA: string;   // gradient start
  colorB: string;   // gradient mid
  colorC: string;   // gradient end
  glow: string;     // glow color
};

const B3_FUND_SLICES: FundSlice[] = [
  {
    key: "debt",
    label: "SANEAMIENTO",
    pct: 0.6,
    amount: "$200,000 MXN",
    // CONTRASTE: cyan eléctrico + magenta caliente + gold
    colorA: "#00E5FF",
    colorB: "#FF2BD6",
    colorC: "#FFD166",
    glow: "rgba(0,229,255,0.65)",
  },
  {
    key: "ops",
    label: "OPERACIÓN 60 DÍAS",
    pct: 0.4,
    amount: "$130,000 MXN",
    // CONTRASTE: verde neón + violeta profundo + cyan
    colorA: "#39FF14",
    colorB: "#7C3AED",
    colorC: "#00E5FF",
    glow: "rgba(255,43,214,0.55)",
  },
];

const B3_VB = 300;
const B3_CX = 150;
const B3_CY = 150;

const B3_R = 96;
const B3_STROKE = 15;
const B3_STROKE_ACTIVE = 19;
const B3_GAP = 10;

const B3_CIRC = 2 * Math.PI * B3_R;

/* === Inner transparent channel settings === */
const B3_CHANNEL_WIDTH = 12; // qué tan “hueco” queda el centro del aro
const B3_CHANNEL_ALPHA = 0.98; // fuerza del hueco (más alto = más transparente)

const B3_STYLE_ID = "__SLIDE16_B3_DONUT_STYLES__";

const useB3Styles = () => {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(B3_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = B3_STYLE_ID;
    style.textContent = `
      @keyframes b3_prismSpin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
      @keyframes b3_sweep { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
      @keyframes b3_breathe { 0%,100% { opacity: .65 } 50% { opacity: 1 } }
      @keyframes b3_float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-6px) } }
    `;
    document.head.appendChild(style);
  }, []);
};

export const FundsCore = () => {
  useB3Styles();

  const [hover, setHover] = React.useState<FundKey>(null);
  const [locked, setLocked] = React.useState<FundKey>(null);
  const active = locked ?? hover;

  const onToggle = (k: FundKey) => setLocked((p) => (p === k ? null : k));

  return (
    <div
      data-block="funds-core"
      style={{
        display: "grid",
        gridTemplateColumns: "440px 1fr",
        gap: 36,
        alignItems: "center",
      }}
    >
      <SacredDonut
        slices={B3_FUND_SLICES}
        active={active}
        onHover={setHover}
        onLeave={() => setHover(null)}
        onToggle={onToggle}
      />

      <Legend
        slices={B3_FUND_SLICES}
        active={active}
        onHover={setHover}
        onLeave={() => setHover(null)}
        onToggle={onToggle}
      />
    </div>
  );
};

const SacredDonut = ({
  slices,
  active,
  onHover,
  onLeave,
  onToggle,
}: {
  slices: FundSlice[];
  active: FundKey;
  onHover: (k: FundKey) => void;
  onLeave: () => void;
  onToggle: (k: FundKey) => void;
}) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 });

  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;

      const rx = Math.max(-10, Math.min(10, dy * 14));
      const ry = Math.max(-10, Math.min(10, -dx * 14));
      setTilt({ rx, ry });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const totalPct = Math.round(slices.reduce((a, s) => a + s.pct, 0) * 100);

  return (
    <div
      ref={hostRef}
      style={{
        position: "relative",
        width: 440,
        height: 440,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 900,
      }}
    >
      {/* Halo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(0,229,255,0.28), rgba(255,43,214,0.20), transparent 62%)",
          filter: "blur(26px)",
          opacity: 0.95,
          animation: "b3_breathe 3.2s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Object */}
      <div
        style={{
          width: 420,
          height: 420,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: "transform 120ms ease-out",
          animation: "b3_float 4.6s ease-in-out infinite",
        }}
      >
        {/* Prism texture ring */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 52,
            borderRadius: 999,
            background:
              "conic-gradient(from 0deg, rgba(0,229,255,0.00), rgba(0,229,255,0.22), rgba(255,43,214,0.18), rgba(255,209,102,0.16), rgba(57,255,20,0.16), rgba(0,229,255,0.00))",
            filter: "blur(10px)",
            opacity: 0.62,
            mixBlendMode: "screen",
            animation: "b3_prismSpin 7.5s linear infinite",
            pointerEvents: "none",
          }}
        />

        <svg
          width="420"
          height="420"
          viewBox={`0 0 ${B3_VB} ${B3_VB}`}
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotate(-90deg)",
          }}
        >
          <defs>
            <filter id="b3_noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 0.14" />
              </feComponentTransfer>
            </filter>

            <filter id="b3_softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="b3_innerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feOffset dx="0" dy="2" />
              <feGaussianBlur stdDeviation="4" result="offBlur" />
              <feComposite in="offBlur" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner" />
              <feColorMatrix
                in="inner"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"
              />
              <feComposite in2="SourceGraphic" operator="over" />
            </filter>

            <linearGradient id="b3_sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="46%" stopColor="rgba(255,255,255,0.0)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.75)" />
              <stop offset="63%" stopColor="rgba(255,255,255,0.0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <radialGradient id="b3_glass" cx="30%" cy="30%" r="80%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.11)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
            </radialGradient>
          </defs>

          {/* TRACK glass */}
          <circle
            cx={B3_CX}
            cy={B3_CY}
            r={B3_R}
            fill="none"
            stroke="url(#b3_glass)"
            strokeWidth={B3_STROKE}
            opacity={0.95}
            filter="url(#b3_innerShadow)"
          />

          {/* track rim */}
          <circle
            cx={B3_CX}
            cy={B3_CY}
            r={B3_R}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={2}
            opacity={0.75}
          />

          {/* slices */}
          {(() => {
            let offset = 0;
            return slices.map((s) => {
              const dash = B3_CIRC * s.pct;
              const dashArr = `${Math.max(1, dash - B3_GAP)} ${B3_CIRC}`;
              const dashOff = -offset;
              offset += dash;

              const isActive = active === s.key;
              const isDimmed = active && active !== s.key;

              const gradId = `b3_grad_${s.key}`;
              const rimId = `b3_rim_${s.key}`;

              const strokeW = isActive ? B3_STROKE_ACTIVE : B3_STROKE;

              return (
                <g key={s.key}>
                  <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={s.colorA} stopOpacity="1" />
                      <stop offset="52%" stopColor={s.colorB} stopOpacity="1" />
                      <stop offset="100%" stopColor={s.colorC} stopOpacity="1" />
                    </linearGradient>

                    <linearGradient id={rimId} x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                      <stop offset="42%" stopColor={s.glow} />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                    </linearGradient>
                  </defs>

                  {/* glow under */}
                  <circle
                    cx={B3_CX}
                    cy={B3_CY}
                    r={B3_R}
                    fill="none"
                    stroke={s.glow}
                    strokeWidth={strokeW + 12}
                    strokeDasharray={dashArr}
                    strokeDashoffset={dashOff}
                    strokeLinecap="round"
                    opacity={isDimmed ? 0.08 : 0.38}
                    filter="url(#b3_softGlow)"
                  />

                  {/* main vitral */}
                  <circle
                    cx={B3_CX}
                    cy={B3_CY}
                    r={B3_R}
                    fill="none"
                    stroke={`url(#${gradId})`}
                    strokeWidth={strokeW}
                    strokeDasharray={dashArr}
                    strokeDashoffset={dashOff}
                    strokeLinecap="round"
                    opacity={isDimmed ? 0.72 : 1}
                    style={{
                      cursor: "pointer",
                      transition: "all 260ms ease",
                    }}
                    onMouseEnter={() => onHover(s.key)}
                    onMouseLeave={onLeave}
                    onClick={() => onToggle(s.key)}
                  />

                  {/* holo rim highlight */}
                  <circle
                    cx={B3_CX}
                    cy={B3_CY}
                    r={B3_R}
                    fill="none"
                    stroke={`url(#${rimId})`}
                    strokeWidth={Math.max(2, strokeW * 0.30)}
                    strokeDasharray={dashArr}
                    strokeDashoffset={dashOff}
                    strokeLinecap="round"
                    opacity={isDimmed ? 0.18 : 0.90}
                    style={{
                      mixBlendMode: "screen",
                      pointerEvents: "none",
                      transition: "opacity 260ms ease",
                    }}
                  />

                  {/* ===== INNER TRANSPARENT CHANNEL (the "invisible center") =====
                     We "cut" the center by painting a dark/transparent stroke on top.
                     It's a visual trick: looks like the ring is hollow in the middle.
                  */}
                  <circle
                    cx={B3_CX}
                    cy={B3_CY}
                    r={B3_R}
                    fill="none"
                    stroke="rgba(0,0,0,1)"
                    strokeWidth={Math.max(2, B3_CHANNEL_WIDTH)}
                    strokeDasharray={dashArr}
                    strokeDashoffset={dashOff}
                    strokeLinecap="round"
                    opacity={isDimmed ? 0.35 : B3_CHANNEL_ALPHA}
                    style={{
                      mixBlendMode: "destination-out",
                      pointerEvents: "none",
                    }}
                  />
                </g>
              );
            });
          })()}

          {/* Specular sweep */}
          <g
            style={{
              transformOrigin: `${B3_CX}px ${B3_CY}px`,
              animation: "b3_sweep 3.1s linear infinite",
            }}
          >
            <circle
              cx={B3_CX}
              cy={B3_CY}
              r={B3_R}
              fill="none"
              stroke="url(#b3_sweepGrad)"
              strokeWidth={B3_STROKE_ACTIVE}
              opacity={0.24}
              style={{ mixBlendMode: "screen" }}
            />
          </g>

          {/* micro-noise pass */}
          <circle
            cx={B3_CX}
            cy={B3_CY}
            r={B3_R}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={B3_STROKE_ACTIVE}
            filter="url(#b3_noise)"
            opacity={0.26}
            style={{ mixBlendMode: "overlay", pointerEvents: "none" }}
          />
        </svg>

        <DonutCenter active={active} totalPct={totalPct} slices={slices} />
      </div>
    </div>
  );
};

const DonutCenter = ({
  active,
  totalPct,
  slices,
}: {
  active: FundKey;
  totalPct: number;
  slices: FundSlice[];
}) => {
  const activeSlice = slices.find((s) => s.key === active) || null;
  const label = activeSlice ? activeSlice.label : "ASIGNACIÓN";
  const pct = activeSlice ? Math.round(activeSlice.pct * 100) : totalPct;
  const accent = activeSlice ? activeSlice.glow : "rgba(255,255,255,0.20)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 212,
          height: 212,
          borderRadius: 999,
          background:
            "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.24), rgba(0,0,0,0.80) 62%, rgba(0,0,0,0.96))",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 44px ${accent}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.34em", opacity: 0.72 }}>
          TOTAL
        </div>

        <div style={{ fontSize: 58, fontWeight: 950, lineHeight: 1 }}>
          {pct}%
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.26em",
            opacity: 0.84,
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 6,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: 10,
            letterSpacing: "0.22em",
            opacity: 0.88,
          }}
        >
          {activeSlice ? "LOCK/FOCUS" : "HOVER O CLICK"}
        </div>
      </div>
    </div>
  );
};

const Legend = ({
  slices,
  active,
  onHover,
  onLeave,
  onToggle,
}: {
  slices: FundSlice[];
  active: FundKey;
  onHover: (k: FundKey) => void;
  onLeave: () => void;
  onToggle: (k: FundKey) => void;
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {slices.map((s) => {
        const isActive = active === s.key;
        const isDimmed = active && active !== s.key;

        return (
          <LegendCard
            key={s.key}
            slice={s}
            active={isActive}
            dimmed={!!isDimmed}
            onHover={onHover}
            onLeave={onLeave}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
};

const LegendCard = ({
  slice,
  active,
  dimmed,
  onHover,
  onLeave,
  onToggle,
}: {
  slice: FundSlice;
  active: boolean;
  dimmed: boolean;
  onHover: (k: FundKey) => void;
  onLeave: () => void;
  onToggle: (k: FundKey) => void;
}) => {
  return (
    <div
      data-fund={slice.key}
      onMouseEnter={() => onHover(slice.key)}
      onMouseLeave={onLeave}
      onClick={() => onToggle(slice.key)}
      style={{
        padding: 22,
        borderRadius: 18,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${active ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.14)"}`,
        borderLeft: `7px solid ${slice.colorB}`,
        cursor: "pointer",
        color: "white",
        opacity: dimmed ? 0.38 : 1,
        transform: active ? "translateX(8px)" : "none",
        boxShadow: active ? `0 0 30px ${slice.glow}` : "none",
        transition: "all 240ms ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0) 70%)",
          transform: active ? "translateX(0)" : "translateX(-40px)",
          opacity: active ? 0.95 : 0.35,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      <div style={{ fontSize: 12, letterSpacing: "0.28em", opacity: 0.72 }}>
        {slice.label}
      </div>

      <div style={{ fontSize: 30, fontWeight: 950, marginTop: 6 }}>
        {slice.amount}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: slice.colorB }}>
          {Math.round(slice.pct * 100)}%
        </div>
        <div style={{ fontSize: 12, opacity: 0.72, letterSpacing: "0.18em" }}>
          click = lock
        </div>
      </div>
    </div>
  );
};

/* =====================================================================================
   END OF B3 v2.1.0
   ===================================================================================== */

/* =====================================================================================
   END OF B3 v2.0.0
   ===================================================================================== */

/* =====================================================================================
   B4 — FINANCIAL LOGIC (RISK · RUNWAY · ROI)
   VERSION: 1.0.0
   PURPOSE:
   - Model risk coverage
   - Visualize 60-day runway
   - Simulate ROI scenarios
   - Keep math explicit and auditable
   ===================================================================================== */


/* =====================================================================================
   TYPES
   ===================================================================================== */

type FinanceMode = "investor" | "ops" | "audit";

type RiskInput = {
  investment: number;
  contractValue: number;
};

type RunwayWeek = {
  label: string;
  title: string;
  detail: string;
};

type ROIState = {
  contract: number;
  marginPct: number;
  months: number;
};

/* =====================================================================================
   B2 — RISK COVERAGE MODULE (NIVEL DIOS)
   VERSION: 3.1.0

   Includes (codificado):
   - Glass base pro (dual blur, inner rim, top highlight, rim sheen)
   - Caustics + shimmer (respetando prefers-reduced-motion)
   - Micro-noise film (subtle, no “grano sucio”)
   - Risk bar segmented + gradient + glow controlado
   - Buffer band (zona de holgura) + threshold line + label
   - Engineering ticks + micro grid (no decorativo)
   - Readout con tipografía técnica y jerarquía real
   - Hover/focus sin afectar otros bloques (pointer discipline)
   - Accesible: role="meter", aria-labels
   - Tunable via TOKENS + CONFIG

   Drop-in React component (inline styles + injected keyframes)
   ===================================================================================== */

const __B2_RISK_STYLE_ID__ = "__SLIDE16_B2_RISK_V310__";

const useB2RiskStyles = () => {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(__B2_RISK_STYLE_ID__)) return;

    const style = document.createElement("style");
    style.id = __B2_RISK_STYLE_ID__;
    style.textContent = `
      @keyframes b2_caustics { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
      @keyframes b2_sheen   { 0% { transform: translateX(-18%) } 100% { transform: translateX(118%) } }
      @keyframes b2_breathe { 0%,100% { opacity: .72 } 50% { opacity: 1 } }
      @keyframes b2_pulse   { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(1.012) } }

      /* Prefers reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .b2-anim-caustics, .b2-anim-sheen, .b2-anim-breathe, .b2-anim-pulse {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);
};

type RiskCoverageProps = {
  /** 0..1 */
  value?: number;
  /** threshold 0..1 */
  threshold?: number;
  /** buffer size 0..1 (how much extra “safe headroom” to show) */
  buffer?: number;
  label?: string;
  subtitle?: string;
  /** optional: show debug/tech line */
  techLine?: string;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const RiskCoverage = ({
  value = 0.82,
  threshold = 0.70,
  buffer = 0.12,
  label = "COBERTURA DE RIESGO",
  subtitle = "CAPACIDAD DE CONTENCIÓN OPERATIVA",
  techLine = "RISK-CONTAINMENT · SIGNAL LOCK · ENGINEERING READOUT",
}: RiskCoverageProps) => {
  useB2RiskStyles();

  const v = clamp01(value);
  const th = clamp01(threshold);
  const buf = clamp01(buffer);

  const pct = Math.round(v * 100);
  const thPct = Math.round(th * 100);
  const bufEnd = clamp01(th + buf);
  const bufEndPct = Math.round(bufEnd * 100);

  const status =
    v >= bufEnd ? "SATURADO" : v >= th ? "ESTABLE" : "BAJO";

  // Visual tone (Hitech palette align)
  // Azul Hitech: #026F86 / #02A7CA
  // Esmeralda: approx #10B981
  const TOK = {
    glassBgA: "rgba(12,14,18,0.64)",
    glassBgB: "rgba(8,10,14,0.58)",
    border: "rgba(255,255,255,0.16)",
    borderSoft: "rgba(255,255,255,0.10)",
    inner: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    shadow: "0 22px 64px rgba(0,0,0,0.56)",
    blur: "blur(16px) saturate(125%)",

    tintCyan: "rgba(2,167,202,0.13)",
    tintGold: "rgba(171,123,38,0.09)",

    barA: "#10B981", // esmeralda
    barB: "#02A7CA", // cyan
    barGlow: "rgba(16,185,129,0.42)",
    barGlow2: "rgba(2,167,202,0.28)",

    txtMain: "rgba(255,255,255,0.92)",
    txtSub: "rgba(255,255,255,0.70)",
    txtMute: "rgba(255,255,255,0.48)",
    txtFaint: "rgba(255,255,255,0.32)",
  } as const;

  const CONFIG = {
    radius: 22,
    pad: 22,
    barH: 22,
    barRad: 999,
    ticks: 56,
    segW: 14,      // segment width px
    segGap: 10,    // segment gap px
    sheenOpacity: 0.55,
    noiseOpacity: 0.12,
  } as const;

  return (
    <div
      data-block="risk-coverage"
      role="group"
      aria-label="Módulo de Cobertura de Riesgo"
      style={{
        position: "relative",
        borderRadius: CONFIG.radius,
        padding: CONFIG.pad,
        background: `linear-gradient(180deg, ${TOK.glassBgA}, ${TOK.glassBgB})`,
        border: `1px solid ${TOK.border}`,
        boxShadow: `${TOK.shadow}, ${TOK.inner}`,
        backdropFilter: TOK.blur,
        WebkitBackdropFilter: TOK.blur,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* ===== Ambient tints (no oscurece todo, da “vitral”) ===== */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -2,
          background: `
            radial-gradient(900px 420px at 18% 12%, ${TOK.tintCyan}, transparent 62%),
            radial-gradient(900px 420px at 84% 86%, ${TOK.tintGold}, transparent 64%)
          `,
          opacity: 0.95,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* ===== Inner rim ===== */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: CONFIG.radius,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 18px 36px rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      {/* ===== Top highlight strip ===== */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: 10,
          height: 34,
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00))",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />

      {/* ===== Caustics (slow) ===== */}
      <div
        aria-hidden
        className="b2-anim-caustics"
        style={{
          position: "absolute",
          inset: -120,
          borderRadius: 999,
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.00), rgba(191,234,255,0.09), rgba(207,250,234,0.10), rgba(255,255,255,0.00))",
          filter: "blur(16px)",
          opacity: 0.65,
          mixBlendMode: "screen",
          animation: "b2_caustics 10.5s linear infinite",
          pointerEvents: "none",
        }}
      />


      {/* ===== Noise film (micro) ===== */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: CONFIG.noiseOpacity,
          pointerEvents: "none",
          mixBlendMode: "overlay",
          backgroundImage: `
            repeating-linear-gradient(0deg,
              rgba(255,255,255,0.05) 0px,
              rgba(255,255,255,0.05) 1px,
              rgba(0,0,0,0.00) 2px,
              rgba(0,0,0,0.00) 4px
            )
          `,
        }}
      />

      {/* ===== HEADER ===== */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.34em",
            opacity: 0.70,
          }}
        >
          {label}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 6,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.86 }}>
            {subtitle}
          </div>

          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.28em",
              opacity: 0.44,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              whiteSpace: "nowrap",
            }}
          >
            {techLine}
          </div>
        </div>
      </div>

      {/* ===== BAR + READOUT ===== */}
      <div style={{ position: "relative", zIndex: 2, marginTop: 18 }}>
        {/* BAR WRAP */}
        <div
          role="meter"
          aria-label="Cobertura de Riesgo"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          style={{
            position: "relative",
            height: CONFIG.barH,
            borderRadius: CONFIG.barRad,
            overflow: "hidden",
            background: "rgba(255,255,255,0.10)",
            border: `1px solid ${TOK.borderSoft}`,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
          }}
        >
          {/* Track grid / segments */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  rgba(255,255,255,0.10) 0px,
                  rgba(255,255,255,0.10) ${CONFIG.segW}px,
                  rgba(255,255,255,0.00) ${CONFIG.segW}px,
                  rgba(255,255,255,0.00) ${CONFIG.segW + CONFIG.segGap}px
                )
              `,
              opacity: 0.36,
              pointerEvents: "none",
            }}
          />

          {/* Fill (main) */}
          <div
            className="b2-anim-pulse"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              borderRadius: CONFIG.barRad,
              background: `linear-gradient(90deg, ${TOK.barA}, ${TOK.barB})`,
              boxShadow: `0 0 22px ${TOK.barGlow}, 0 0 44px ${TOK.barGlow2}`,
              transition: "width 420ms ease",
              animation: "b2_pulse 2.8s ease-in-out infinite",
            }}
          />

          {/* Sheen sweep over fill */}
          <div
            aria-hidden
            className="b2-anim-sheen"
            style={{
              position: "absolute",
              top: -18,
              bottom: -18,
              width: 120,
              left: `calc(${pct}% - 90px)`,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.00), rgba(255,255,255,0.22), rgba(255,255,255,0.00))",
              opacity: CONFIG.sheenOpacity,
              filter: "blur(2px)",
              mixBlendMode: "screen",
              pointerEvents: "none",
              animation: "b2_sheen 2.9s linear infinite",
            }}
          />

          {/* Buffer band (from threshold to threshold+buffer) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: `${thPct}%`,
              top: 0,
              bottom: 0,
              width: `${Math.max(0, bufEndPct - thPct)}%`,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.00), rgba(255,255,255,0.10), rgba(255,255,255,0.00))",
              opacity: 0.55,
              pointerEvents: "none",
            }}
          />

          {/* Threshold line */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: `${thPct}%`,
              top: -10,
              bottom: -10,
              width: 1,
              background: "rgba(255,255,255,0.32)",
              boxShadow: "0 0 10px rgba(255,255,255,0.18)",
              pointerEvents: "none",
            }}
          />

          {/* Threshold label */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: `calc(${thPct}% + 8px)`,
              top: -22,
              fontSize: 10,
              letterSpacing: "0.26em",
              opacity: 0.56,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            TH {thPct}%
          </div>
        </div>

        {/* Engineering ticks under bar */}
        <div
          aria-hidden
          style={{
            position: "relative",
            height: 14,
            marginTop: 10,
            opacity: 0.55,
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(i / 27) * 100}%`,
                top: 0,
                width: 1,
                height: i % 4 === 0 ? 12 : 7,
                background: "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>

        {/* Readout row */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div
              style={{
                fontSize: 46,
                fontWeight: 950,
                lineHeight: 1,
                color: TOK.txtMain,
                textShadow: "0 0 16px rgba(255,255,255,0.10)",
              }}
            >
              {pct}%
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.28em",
                  opacity: 0.66,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                STATUS · {status}
              </div>

              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  opacity: 0.52,
                }}
              >
                {v >= th
                  ? "Dentro de umbral operativo. Buffer disponible."
                  : "Bajo umbral: elevar cobertura o reducir exposición."}
              </div>
            </div>
          </div>

          {/* Right side hint chip */}
          <div
            className="b2-anim-breathe"
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.22)",
              fontSize: 10,
              letterSpacing: "0.28em",
              opacity: 0.72,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              animation: "b2_breathe 2.6s ease-in-out infinite",
              whiteSpace: "nowrap",
            }}
          >
            BUFFER {Math.max(0, bufEndPct - thPct)}% · TH {thPct}%
          </div>
        </div>
      </div>

      {/* ===== Bottom micro footer (quiet, technical) ===== */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          opacity: 0.44,
          fontSize: 10,
          letterSpacing: "0.22em",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        <div>INTEGRITY: OK</div>
        <div>VISUAL: GLASS-SAFE</div>
        <div>MODE: EVIDENCE</div>
      </div>
    </div>
  );
};

/* =====================================================================================
   END B2 — RiskCoverage v3.1.0
   ===================================================================================== */


/* =====================================================================================
   RUNWAY (60 DAYS)
   ===================================================================================== */

const RUNWAY_WEEKS: RunwayWeek[] = [
  { label: "Semana 1", title: "Arranque", detail: "Setup, logística, baseline" },
  { label: "Semana 2", title: "Ejecución", detail: "Primeros entregables" },
  { label: "Semana 3", title: "Continuidad", detail: "Ritmo estable" },
  { label: "Semana 4", title: "Optimización", detail: "Mejora costos/tiempos" },
  { label: "Semana 5", title: "Escalado", detail: "Más frentes activos" },
  { label: "Semana 6–8", title: "Cierre", detail: "Facturación y expansión" },
];

export const Runway60 = ({ mode }: { mode: FinanceMode }) => {
  const hint =
    mode === "investor"
      ? "Capital compra foco y tiempo"
      : mode === "ops"
      ? "Plan semanal ejecutable"
      : "Trazabilidad auditable";

  return (
    <div style={card}>
      <Header title="RUNWAY 60 DÍAS" subtitle={hint} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginTop: 12,
        }}
      >
        {RUNWAY_WEEKS.map((w, i) => (
          <div key={i} style={weekCard}>
            <div style={weekLabel}>{w.label}</div>
            <div style={weekTitle}>{w.title}</div>
            <div style={weekDetail}>{w.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =====================================================================================
   ROI SIMULATOR
   ===================================================================================== */

export const ROISimulator = ({ investment }: { investment: number }) => {
  const [state, setState] = React.useState<ROIState>({
    contract: 5_000_000,
    marginPct: 18,
    months: 6,
  });

  const profit = state.contract * (state.marginPct / 100);
  const monthly = profit / state.months;
  const payback = investment / monthly;

  const presets = {
    conservador: { marginPct: 14, months: 9 },
    base: { marginPct: 18, months: 6 },
    agresivo: { marginPct: 25, months: 4 },
  };

  return (
    <div style={card}>
      <Header title="ROI SIMULATOR" subtitle="Escenarios auditables" />

      <PresetRow
        presets={presets}
        onApply={(p) =>
          setState((s) => ({ ...s, marginPct: p.marginPct, months: p.months }))
        }
      />

      <Slider
        label={`Contrato: $${state.contract.toLocaleString()} MXN`}
        min={1_000_000}
        max={9_000_000}
        step={100_000}
        value={state.contract}
        onChange={(v) => setState((s) => ({ ...s, contract: v }))}
      />

      <Slider
        label={`Margen: ${state.marginPct}%`}
        min={10}
        max={35}
        step={1}
        value={state.marginPct}
        onChange={(v) => setState((s) => ({ ...s, marginPct: v }))}
      />

      <Slider
        label={`Horizonte: ${state.months} meses`}
        min={3}
        max={12}
        step={1}
        value={state.months}
        onChange={(v) => setState((s) => ({ ...s, months: v }))}
      />

      <div style={{ marginTop: 14, fontSize: 14 }}>
        <b>Profit:</b> ${profit.toLocaleString()} MXN
        <br />
        <b>Ingreso mensual:</b> ${Math.round(monthly).toLocaleString()} MXN
        <br />
        <b>Payback:</b> {payback.toFixed(1)} meses
      </div>
    </div>
  );
};

/* =====================================================================================
   SHARED UI ATOMS
   ===================================================================================== */

const card: React.CSSProperties = {
  padding: 20,
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(12,14,18,0.66), rgba(8,10,14,0.58))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow:
    "0 22px 64px rgba(0,0,0,0.56), inset 0 0 0 1px rgba(255,255,255,0.06)",
  backdropFilter: "blur(16px) saturate(125%)",
  WebkitBackdropFilter: "blur(16px) saturate(125%)",
  color: "white",
  position: "relative",
  overflow: "hidden",
};


const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <div style={{ fontSize: 12, letterSpacing: "0.28em", opacity: 0.7 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, opacity: 0.85 }}>{subtitle}</div>
  </div>
);

const KV = ({ label, value }: { label: string; value: string }) => (
  <div style={{ marginTop: 6, fontSize: 14 }}>
    {label}: <b>{value}</b>
  </div>
);

const barTrack: React.CSSProperties = {
  height: 14,
  borderRadius: 999,
  background: "rgba(255,255,255,0.10)",
  overflow: "hidden",
};

const barFill: React.CSSProperties = {
  height: "100%",
  transition: "width 320ms ease",
};

const weekCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const weekLabel: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
};

const weekTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
};

const weekDetail: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.85,
};

const PresetRow = ({
  presets,
  onApply,
}: {
  presets: Record<string, { marginPct: number; months: number }>;
  onApply: (p: { marginPct: number; months: number }) => void;
}) => (
  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
    {Object.entries(presets).map(([k, v]) => (
      <button key={k} style={pill} onClick={() => onApply(v)}>
        {k.toUpperCase()}
      </button>
    ))}
  </div>
);

const Slider = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div style={{ marginTop: 12 }}>
    <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      style={{ width: "100%" }}
    />
  </div>
);

const pill: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "white",
  fontSize: 11,
  cursor: "pointer",
};

/* =====================================================================================
   END OF B4
   FINANCIAL LOGIC COMPLETE
   ===================================================================================== */
/* =====================================================================================
   B5 — NARRATIVE & COPY ENGINE
   VERSION: 1.0.0
   PURPOSE:
   - Centralize all copy and narrative rules
   - Provide authoritative, technical language
   - Adapt messaging by mode and interaction context
   - No UI mounting, no overlays
   ===================================================================================== */


/* =====================================================================================
   TYPES
   ===================================================================================== */

export type Mode = "investor" | "ops" | "audit";

export type NarrativeContext =
  | "idle"
  | "funds_overview"
  | "risk_review"
  | "roi_review"
  | "runway_review"
  | "ready_to_close";

type CopyBlock = {
  title?: string;
  body: string;
  footnote?: string;
};

type NarrativeSet = {
  headline: string;
  principle: string;
  blocks: CopyBlock[];
};

/* =====================================================================================
   CORE COPY DATABASE
   ===================================================================================== */

const COPY_DB: Record<Mode, Record<NarrativeContext, NarrativeSet>> = {
  investor: {
    idle: {
      headline: "Asignación con control",
      principle: "El capital no se diluye: se ejecuta.",
      blocks: [
        {
          body:
            "Esta estructura no busca prometer retornos. Busca reducir incertidumbre mediante procesos visibles.",
        },
        {
          body:
            "Cada peso tiene una función definida desde el día uno.",
        },
      ],
    },
    funds_overview: {
      headline: "Destino del capital",
      principle: "Sin ambigüedad operativa.",
      blocks: [
        {
          body:
            "La asignación prioriza continuidad operativa antes que expansión.",
        },
        {
          body:
            "No se financia crecimiento hasta estabilizar ejecución.",
        },
      ],
    },
    risk_review: {
      headline: "Riesgo controlado",
      principle: "El contrato absorbe la exposición.",
      blocks: [
        {
          body:
            "La inversión está cubierta por flujos contractuales activos.",
        },
        {
          body:
            "El riesgo financiero se traslada a ejecución, no a capital.",
        },
      ],
    },
    roi_review: {
      headline: "Retorno modelado",
      principle: "Escenarios auditables, no supuestos.",
      blocks: [
        {
          body:
            "El ROI se calcula sobre márgenes conservadores y plazos realistas.",
        },
        {
          body:
            "No se consideran ingresos hipotéticos.",
        },
      ],
    },
    runway_review: {
      headline: "Tiempo comprado",
      principle: "Foco total en ejecución.",
      blocks: [
        {
          body:
            "El runway elimina distracción financiera durante 60 días críticos.",
        },
      ],
    },
    ready_to_close: {
      headline: "Decisión informada",
      principle: "No es fe. Es visibilidad.",
      blocks: [
        {
          body:
            "A este punto, no quedan variables ocultas.",
        },
        {
          body:
            "La decisión es binaria y consciente.",
        },
        {
          footnote:
            "Entrar es aceptar el método. Salir es entenderlo.",
          body: "",
        },
      ],
    },
  },

  ops: {
    idle: {
      headline: "Sistema operativo",
      principle: "Nada improvisado.",
      blocks: [
        {
          body:
            "La estructura está diseñada para ejecutarse bajo presión.",
        },
      ],
    },
    funds_overview: {
      headline: "Asignación funcional",
      principle: "Primero estabilidad.",
      blocks: [
        {
          body:
            "Cada bloque responde a una necesidad operativa concreta.",
        },
      ],
    },
    risk_review: {
      headline: "Exposición acotada",
      principle: "El riesgo se gestiona, no se evita.",
      blocks: [
        {
          body:
            "La cobertura permite operar sin fricción financiera.",
        },
      ],
    },
    roi_review: {
      headline: "Retorno operativo",
      principle: "Eficiencia antes que volumen.",
      blocks: [
        {
          body:
            "El margen es consecuencia de proceso, no de presión comercial.",
        },
      ],
    },
    runway_review: {
      headline: "Plan semanal",
      principle: "Ritmo sostenido.",
      blocks: [
        {
          body:
            "Cada semana tiene entregables verificables.",
        },
      ],
    },
    ready_to_close: {
      headline: "Listo para ejecutar",
      principle: "No hay pasos pendientes.",
      blocks: [
        {
          body:
            "El sistema entra en marcha inmediatamente.",
        },
      ],
    },
  },

  audit: {
    idle: {
      headline: "Trazabilidad completa",
      principle: "Todo deja rastro.",
      blocks: [
        {
          body:
            "No existen decisiones sin justificación documentada.",
        },
      ],
    },
    funds_overview: {
      headline: "Asignación auditable",
      principle: "Origen y destino claros.",
      blocks: [
        {
          body:
            "Cada partida puede ser revisada de forma independiente.",
        },
      ],
    },
    risk_review: {
      headline: "Cobertura demostrable",
      principle: "Exposición documentada.",
      blocks: [
        {
          body:
            "La relación inversión–contrato es verificable.",
        },
      ],
    },
    roi_review: {
      headline: "Modelo transparente",
      principle: "Supuestos explícitos.",
      blocks: [
        {
          body:
            "No se usan proyecciones sin base contractual.",
        },
      ],
    },
    runway_review: {
      headline: "Continuidad controlada",
      principle: "Plazos definidos.",
      blocks: [
        {
          body:
            "El uso del capital está calendarizado.",
        },
      ],
    },
    ready_to_close: {
      headline: "Conclusión técnica",
      principle: "Cumple criterios.",
      blocks: [
        {
          body:
            "La propuesta satisface condiciones mínimas de control.",
        },
      ],
    },
  },
};

/* =====================================================================================
   API
   ===================================================================================== */

export const useNarrative = (
  mode: Mode,
  context: NarrativeContext
): NarrativeSet => {
  return React.useMemo(() => {
    return COPY_DB[mode][context];
  }, [mode, context]);
};

/* =====================================================================================
   HELPERS (NON-UI)
   ===================================================================================== */

export const listAvailableContexts = (mode: Mode): NarrativeContext[] => {
  return Object.keys(COPY_DB[mode]) as NarrativeContext[];
};

export const getPrinciple = (mode: Mode, ctx: NarrativeContext): string => {
  return COPY_DB[mode][ctx].principle;
};

export const hasFootnotes = (mode: Mode, ctx: NarrativeContext): boolean => {
  return COPY_DB[mode][ctx].blocks.some((b) => !!b.footnote);
};

/* =====================================================================================
   END OF B5
   NARRATIVE ENGINE COMPLETE
   ===================================================================================== */

/* =====================================================================================
   B6 — INTERACTION · TELEMETRY · STATE ORCHESTRATION (MONOLITO SAFE)
   VERSION: 1.0.1
   PURPOSE:
   - Centralize interaction state
   - Capture local telemetry (no external analytics)
   - Orchestrate narrative contexts
   - Provide deterministic transitions
   NOTES:
   - Uses Mode + NarrativeContext from B5 (same file). NO imports here.
   ===================================================================================== */

export const ORCH_FLAGS = {
  DEV_LOG: false,
  HINTS_ENABLED: true,
  AUTO_CONTEXT: true,
} as const;

export type InteractionEvent =
  | "hover_fund"
  | "lock_fund"
  | "unlock_fund"
  | "view_risk"
  | "view_runway"
  | "view_roi"
  | "roi_adjust"
  | "idle_tick";

type TelemetryEntry = {
  ts: number;
  ev: InteractionEvent;
  meta?: Record<string, any>;
};

type OrchestratorState = {
  mode: Mode;
  context: NarrativeContext;
  events: TelemetryEntry[];
  touched: Set<InteractionEvent>;
  startedAt: number;
  lastActivity: number;
};

const OrchestratorCtx = React.createContext<{
  state: OrchestratorState;
  emit: (ev: InteractionEvent, meta?: Record<string, any>) => void;
  setMode: (m: Mode) => void;
  forceContext: (c: NarrativeContext) => void;
} | null>(null);

export const OrchestratorProvider = ({
  initialMode = "investor",
  children,
}: {
  initialMode?: Mode;
  children: React.ReactNode;
}) => {
  const [state, setState] = React.useState<OrchestratorState>(() => ({
    mode: initialMode,
    context: "idle",
    events: [],
    touched: new Set(),
    startedAt: Date.now(),
    lastActivity: Date.now(),
  }));

  const emit = React.useCallback(
    (ev: InteractionEvent, meta?: Record<string, any>) => {
      setState((s) => {
        const entry: TelemetryEntry = { ts: Date.now(), ev, meta };
        const touched = new Set(s.touched);
        touched.add(ev);

        if (ORCH_FLAGS.DEV_LOG) console.debug("[S16][EV]", entry);

        return {
          ...s,
          events: [...s.events, entry],
          touched,
          lastActivity: Date.now(),
        };
      });
    },
    []
  );

  const setMode = React.useCallback((m: Mode) => {
    setState((s) => ({ ...s, mode: m }));
  }, []);

  const forceContext = React.useCallback((c: NarrativeContext) => {
    setState((s) => ({ ...s, context: c }));
  }, []);

  React.useEffect(() => {
    if (!ORCH_FLAGS.AUTO_CONTEXT) return;

    const s = state;
    let next: NarrativeContext;

    if (s.touched.has("view_roi")) next = "roi_review";
    else if (s.touched.has("view_risk")) next = "risk_review";
    else if (s.touched.has("view_runway")) next = "runway_review";
    else if (s.touched.has("lock_fund")) next = "funds_overview";
    else next = "idle";

    if (next !== s.context) setState((p) => ({ ...p, context: next }));
  }, [state]);

  React.useEffect(() => {
    const id = setInterval(() => {
      const idleFor = Date.now() - state.lastActivity;
      if (idleFor > 6000) emit("idle_tick", { idleFor });
    }, 3000);

    return () => clearInterval(id);
  }, [state.lastActivity, emit]);

  return (
    <OrchestratorCtx.Provider value={{ state, emit, setMode, forceContext }}>
      {children}
    </OrchestratorCtx.Provider>
  );
};

export const useOrchestrator = () => {
  const ctx = React.useContext(OrchestratorCtx);
  if (!ctx) throw new Error("useOrchestrator must be used within OrchestratorProvider");
  return ctx;
};

export const Instrument = {
  hoverFund: (emit: any, key?: string) => emit("hover_fund", { key }),
  lockFund: (emit: any, key?: string) => emit("lock_fund", { key }),
  unlockFund: (emit: any, key?: string) => emit("unlock_fund", { key }),
  viewRisk: (emit: any) => emit("view_risk"),
  viewRunway: (emit: any) => emit("view_runway"),
  viewROI: (emit: any) => emit("view_roi"),
  roiAdjust: (emit: any, v?: any) => emit("roi_adjust", v),
};

export const selectElapsedSeconds = (s: OrchestratorState): number =>
  Math.round((Date.now() - s.startedAt) / 1000);

export const selectTouchedCount = (s: OrchestratorState): number => s.touched.size;

export const selectHasViewedROI = (s: OrchestratorState): boolean =>
  s.touched.has("view_roi");

/* =====================================================================================
   END OF B6 v1.0.1
   ===================================================================================== */


/* =====================================================================================
   B7 — OVERLAYS & CLOSE SYSTEM
   VERSION: 1.1.1
   GOALS:
   - OverlayShell CENTRADO (no tapa toda la slide como sábana)
   - Backdrop GLASS-DIM (no blackout)
   - Drawer sigue existiendo (lado derecho) y NO “encima” raro
   - Mantiene: ESC / click fuera / scroll lock / transiciones / blur / lujo
   ===================================================================================== */

export type OverlayKind = "proof" | "decision" | "audit";

type OverlayState = {
  open: boolean;
  kind: OverlayKind | null;
};

/* =========================
   INTERNAL HOOKS
   ========================= */

const useScrollLock = (locked: boolean) => {
  React.useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
};

const useEscape = (active: boolean, onClose: () => void) => {
  React.useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, onClose]);
};

/* =========================
   CONTEXT
   ========================= */

const OverlayCtx = React.createContext<{
  state: OverlayState;
  open: (k: OverlayKind) => void;
  close: () => void;
} | null>(null);

export const OverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = React.useState<OverlayState>({
    open: false,
    kind: null,
  });

  const open = React.useCallback((k: OverlayKind) => {
    setState({ open: true, kind: k });
  }, []);

  const close = React.useCallback(() => {
    setState({ open: false, kind: null });
  }, []);

  return (
    <OverlayCtx.Provider value={{ state, open, close }}>
      {children}
    </OverlayCtx.Provider>
  );
};

export const useOverlay = () => {
  const ctx = React.useContext(OverlayCtx);
  if (!ctx) throw new Error("useOverlay must be used within OverlayProvider");
  return ctx;
};

/* =====================================================================================
   TOKENS (B7-local)
   ===================================================================================== */

const OV = {
  fadeMs: 220,
  // 🔑 Dim elegante: deja ver la UI (no “apagón”)
  backdrop: {
    opacity: 1,
    blur: "blur(7px) saturate(135%)",
    bg: `
      radial-gradient(900px 520px at 24% 26%, rgba(2,167,202,0.12), transparent 62%),
      radial-gradient(900px 520px at 76% 72%, rgba(171,123,38,0.10), transparent 64%),
      linear-gradient(180deg, rgba(0,0,0,0.44), rgba(0,0,0,0.34))
    `,
  },
  panel: {
    bg: "rgba(12,12,14,0.66)",
    bg2: "rgba(8,10,14,0.60)",
    border: "rgba(255,255,255,0.16)",
    inner: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    shadow: "0 22px 70px rgba(0,0,0,0.55)",
    blur: "blur(16px) saturate(125%)",
    rim: `
      linear-gradient(120deg,
        rgba(2,167,202,0.00),
        rgba(2,167,202,0.18),
        rgba(171,123,38,0.12),
        rgba(2,167,202,0.00)
      )
    `,
  },
  // Centered modal sizing (no full-screen slab)
  shell: {
    maxW: 1080, // cambia si quieres
    maxHvh: 86, // % viewport height
    pad: 18,
  },
  drawer: {
    width: "clamp(520px, 42vw, 820px)",
    inset: 22,
  },
} as const;

/* =====================================================================================
   BACKDROP
   ===================================================================================== */

const Backdrop = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <div
      aria-hidden
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: OV.backdrop.bg,
        opacity: open ? OV.backdrop.opacity : 0,
        transition: `opacity ${OV.fadeMs}ms ease`,
        backdropFilter: OV.backdrop.blur,
        WebkitBackdropFilter: OV.backdrop.blur,
        pointerEvents: open ? "auto" : "none",
      }}
    />
  );
};

/* =====================================================================================
   WRAPPER (shared)
   ===================================================================================== */

const OverlayStage = ({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div
      aria-hidden={!open}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transition: `opacity ${OV.fadeMs}ms ease`,
      }}
    >
      {children}
    </div>
  );
};

/* =====================================================================================
   OVERLAY SHELL (CENTERED MODAL)
   ===================================================================================== */

export const OverlayShell = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  useScrollLock(open);
  useEscape(open, onClose);

  return (
    <OverlayStage open={open}>
      <Backdrop open={open} onClose={onClose} />

      {/* CENTERED PANEL */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: open
            ? "translate(-50%,-50%) scale(1)"
            : "translate(-50%,-50%) scale(0.992)",
          transition: `transform ${OV.fadeMs + 80}ms ease`,
          width: `min(${OV.shell.maxW}px, calc(100% - ${OV.shell.pad * 2}px))`,
          maxHeight: `min(${OV.shell.maxHvh}%, calc(100% - ${OV.shell.pad * 2}px))`,
          borderRadius: 22,
          background: `linear-gradient(180deg, ${OV.panel.bg}, ${OV.panel.bg2})`,
          border: `1px solid ${OV.panel.border}`,
          boxShadow: `${OV.panel.shadow}, ${OV.panel.inner}`,
          backdropFilter: OV.panel.blur,
          WebkitBackdropFilter: OV.panel.blur,
          overflow: "hidden",
        }}
      >
        {/* rim sheen */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: OV.panel.rim,
            opacity: 0.55,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            padding: 24,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {children}
        </div>
      </div>
    </OverlayStage>
  );
};

/* =====================================================================================
   OVERLAY DRAWER (SIDE)
   ===================================================================================== */

export const OverlayDrawer = ({
  open,
  onClose,
  side = "right",
  width = OV.drawer.width,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: string;
  children: React.ReactNode;
}) => {
  useScrollLock(open);
  useEscape(open, onClose);

  const isRight = side === "right";

  return (
    <OverlayStage open={open}>
      <Backdrop open={open} onClose={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "absolute",
          top: OV.drawer.inset,
          bottom: OV.drawer.inset,
          [isRight ? "right" : "left"]: OV.drawer.inset,
          width,
          borderRadius: 20,
          background: `linear-gradient(180deg, ${OV.panel.bg}, ${OV.panel.bg2})`,
          border: `1px solid ${OV.panel.border}`,
          boxShadow: `${OV.panel.shadow}, ${OV.panel.inner}`,
          backdropFilter: OV.panel.blur,
          WebkitBackdropFilter: OV.panel.blur,
          overflow: "hidden",
          transform: open
            ? "translateX(0)"
            : `translateX(${isRight ? "18px" : "-18px"})`,
          transition: `transform ${OV.fadeMs + 120}ms ease`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: OV.panel.rim,
            opacity: 0.48,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: 22,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {children}
        </div>
      </div>
    </OverlayStage>
  );
};

/* =====================================================================================
   HEADER / FOOTER
   ===================================================================================== */

export const OverlayHeader = ({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: "0.32em", opacity: 0.72 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 14, opacity: 0.88, marginTop: 4 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      <button
        onClick={onClose}
        style={{
          padding: "7px 10px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "white",
          cursor: "pointer",
        }}
      >
        CERRAR ✕
      </button>
    </div>
  );
};

export const OverlayFooter = ({ hint }: { hint?: string }) => {
  return (
    <div
      style={{
        marginTop: "auto",
        fontSize: 11,
        letterSpacing: "0.28em",
        opacity: 0.62,
        paddingTop: 10,
      }}
    >
      {hint ?? "ESC · CLICK FUERA · BOTÓN (cierre limpio)"}
    </div>
  );
};

/* =====================================================================================
   END OF B7 v1.1.1
   ===================================================================================== */


  /* =====================================================================================
   B0 — SLIDE16 ROOT (FINAL MOUNT) — SLOT-BASED
   VERSION: 1.0.1
   PURPOSE:
   - Wire B1..B7 together using Slide16Shell slots (bg/fx/decor/uiFloat/overlays)
   - Provide a working Slide16 component
   ASSUMPTIONS:
   - Monolithic file: B1..B7 live in same TSX
   - HOTFIX applied: single React import at top-level; no phantom imports
   ===================================================================================== */

/* ==========================================
   [B0.1] Local helpers
   ========================================== */

const SectionTitle = ({ t, s }: { t: string; s?: string }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, letterSpacing: "0.32em", opacity: 0.65 }}>{t}</div>
    {s ? <div style={{ fontSize: 14, opacity: 0.85 }}>{s}</div> : null}
  </div>
);

const Divider = () => (
  <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "18px 0" }} />
);

const TopBarPill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 12px",
      borderRadius: 999,
      background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "white",
      cursor: "pointer",
      fontSize: 11,
      letterSpacing: "0.18em",
      opacity: active ? 1 : 0.85,
    }}
  >
    {label}
  </button>
);

const actionBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "white",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.12em",
};

const actionBtnStrong: React.CSSProperties = {
  ...actionBtn,
  background: "linear-gradient(90deg,#AB7B26,#02A7CA)",
  color: "black",
  border: "1px solid rgba(255,255,255,0.18)",
};

/* ==========================================
   NarrativeBanner v1.1.0 — Guided Evidence
   PURPOSE:
   - Act as reading guide, not headline block
   - Tie copy explicitly to visible modules
   - Legible in projector / screen-share
   ========================================== */

const NarrativeBanner = () => {
  const { state } = useOrchestrator();
  const n = useNarrative(state.mode, state.context);

  return (
    <div
      style={{
        padding: 22,
        borderRadius: 20,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.16)",
      }}
    >
      {/* HEADLINE */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.01em",
        }}
      >
        {n.headline}
      </div>

      {/* PRINCIPLE */}
      <div
        style={{
          marginTop: 6,
          fontSize: 15,
          opacity: 0.9,
        }}
      >
        <b>{n.principle}</b>
      </div>

      {/* CONTEXT GUIDE */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.10)",
          fontSize: 13,
          opacity: 0.92,
        }}
      >
        {state.context === "idle" && (
          <>👇 Empieza revisando <b>la asignación del capital</b> y cómo se protege.</>
        )}
        {state.context === "funds_overview" && (
          <>🔍 Observa <b>cómo se divide el capital</b> y por qué no se mezcla.</>
        )}
        {state.context === "risk_review" && (
          <>🛡️ Esta barra muestra <b>qué riesgo existe y cuál no</b>.</>
        )}
        {state.context === "roi_review" && (
          <>📐 Aquí se exploran <b>escenarios</b>, no promesas.</>
        )}
        {state.context === "runway_review" && (
          <>🗓️ Esto explica <b>qué tiempo compra</b> la inversión.</>
        )}
        {state.context === "ready_to_close" && (
          <>✅ Ya no hay variables ocultas. La decisión es consciente.</>
        )}
      </div>

      {/* BULLETS (EVIDENCE) */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {n.blocks
          .filter((b) => (b.body || "").trim().length > 0)
          .slice(0, 4)
          .map((b, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 16,
                background: "rgba(0,0,0,0.32)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontSize: 14,
                lineHeight: 1.45,
                opacity: 0.95,
              }}
            >
              {b.body}
            </div>
          ))}
      </div>
    </div>
  );

};

/* ==========================================
   [B0.3] Controls (Mode switch + overlay triggers)
   ========================================== */

const SlideControls = () => {
  const { state, setMode, emit } = useOrchestrator();
  const { open } = useOverlay();

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <TopBarPill label="INVESTOR" active={state.mode === "investor"} onClick={() => setMode("investor")} />
        <TopBarPill label="OPS" active={state.mode === "ops"} onClick={() => setMode("ops")} />
        <TopBarPill label="AUDIT" active={state.mode === "audit"} onClick={() => setMode("audit")} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => {
            emit("view_risk");
            open("proof");
          }}
          style={actionBtn}
        >
          EVIDENCIA
        </button>

        <button
          onClick={() => {
            emit("view_roi");
            open("decision");
          }}
          style={actionBtnStrong}
        >
          CERRAR DECISIÓN
        </button>
      </div>
    </div>
  );
};

/* ==========================================
   [B0.4] Financial Panel (B4 + emits B6)
   ========================================== */

const FinancialPanel = () => {
  const { state, emit } = useOrchestrator();

  const investment = 330000;
  const contractValue = 5_000_000;

  React.useEffect(() => {
    emit("idle_tick", { seed: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 22,
      marginTop: 18,
      width: "100%",

      // 🔑: hace que el grid pueda encogerse dentro de un padre con height fijo
      minHeight: 0,
      height: "100%",
      overflow: "hidden", // ojo: hidden aquí, pero damos scroll por columna
      alignItems: "stretch",
    }}
  >
    {/* LEFT COLUMN (scroll limpio si hace falta) */}
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto auto",
        gap: 22,

        minHeight: 0,
        height: "100%",
        overflow: "auto",
        paddingRight: 6, // para que el scroll no tape sombras
      }}
    >
      <div
        onMouseEnter={() => emit("view_risk")}
        style={{ cursor: "default", minHeight: 0, overflow: "visible" }}
      >
        <RiskCoverage investment={investment} contractValue={contractValue} />
      </div>

      <div
        onMouseEnter={() => emit("view_runway")}
        style={{ cursor: "default", minHeight: 0, overflow: "visible" }}
      >
        <Runway60 mode={state.mode as any} />
      </div>
    </div>

    {/* RIGHT COLUMN (scroll limpio si hace falta) */}
    <div
      onMouseEnter={() => emit("view_roi")}
      style={{
        cursor: "default",
        minHeight: 0,
        height: "100%",
        overflow: "auto",
        paddingRight: 6,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ minHeight: 0, overflow: "visible" }}>
        <ROISimulator investment={investment} />
      </div>
    </div>
  </div>
);

};

/* ==========================================
   [B0.5] Overlay content (B7 + reads B5/B6)
   ========================================== */

const OverlaysMounted = () => {
  const { state: orch } = useOrchestrator();
  const { state: ov, close } = useOverlay();
  const n = useNarrative(orch.mode, orch.context);

  const subtitle =
    orch.mode === "investor"
      ? "Cierre basado en control y evidencia"
      : orch.mode === "ops"
      ? "Cierre basado en ejecución"
      : "Cierre basado en trazabilidad";

  const proofOpen = ov.open && ov.kind === "proof";
  const decisionOpen = ov.open && ov.kind === "decision";
  const auditOpen = ov.open && ov.kind === "audit";

  return (
    <>
      <OverlayDrawer open={proofOpen} onClose={close} side="right">
        <OverlayHeader title="EVIDENCIA" subtitle={subtitle} onClose={close} />
        <Divider />
        <div style={overlayBody}>
          <SectionTitle t="PRINCIPIO" s={n.principle} />
          <ul style={{ paddingLeft: 18, margin: 0, opacity: 0.92 }}>
            <li>Contrato activo como cobertura del capital</li>
            <li>Asignación con función definida (sin ambigüedad)</li>
            <li>Runway semanal con entregables verificables</li>
            <li>ROI modelado por escenarios, no promesas</li>
          </ul>
          <div style={{ marginTop: 14, fontSize: 13, opacity: 0.85 }}>
            Traducción: reduce “riesgo de fe” y lo vuelve “riesgo de ejecución”.
          </div>
        </div>
        <OverlayFooter />
      </OverlayDrawer>

      <OverlayShell open={decisionOpen} onClose={close}>
        <OverlayHeader title="ACTO DE DECISIÓN" subtitle="Binario: entrar o no entrar" onClose={close} />
        <Divider />
        <div style={overlayBody}>
          <SectionTitle t="LO QUE YA VISTE" s="Sin variables ocultas, con control visible" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {n.blocks
              .filter((b) => (b.body || "").trim().length > 0)
              .slice(0, 6)
              .map((b, i) => (
                <div key={i} style={miniProof}>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>{b.body}</div>
                </div>
              ))}
          </div>

          <div style={{ marginTop: 16, fontSize: 13, opacity: 0.9 }}>
            Si quieres, pasamos a términos: monto, forma y fecha.
          </div>
        </div>
        <OverlayFooter hint="ESC · CLICK FUERA · BOTÓN (cierre limpio)" />
      </OverlayShell>

      <OverlayShell open={auditOpen} onClose={close}>
        <OverlayHeader title="AUDIT VIEW" subtitle="Trazabilidad y supuestos explícitos" onClose={close} />
        <Divider />
        <div style={overlayBody}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Aquí luego metemos: supuestos, anexos y checklist de due diligence.
          </div>
        </div>
        <OverlayFooter />
      </OverlayShell>
    </>
  );
};

const overlayBody: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  paddingRight: 8,
};

const miniProof: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
};
/* ==========================================
   [B0.6] Slide16 Root (EXPORT) — FIX NAMED EXPORT
   ========================================== */

export const Slide16: React.FC<any> = () => {
  return (
    <OrchestratorProvider initialMode="investor">
      <OverlayProvider>
        <Slide16Shell
          fx={<VisualEngine />}
          overlays={<OverlaysMounted />}
          debug={false}
        >
          <div style={{ padding: 28 }}>
            <SlideControls />
            <NarrativeBanner />
            <Divider />
            <FundsCore />
            <FinancialPanel />
          </div>
        </Slide16Shell>
      </OverlayProvider>
    </OrchestratorProvider>
  );
};

// Compat: por si algún lugar lo quiere como default
export default Slide16;

/* =====================================================================================
   END OF B0 v1.0.2
   ===================================================================================== */


/* =====================================================================================
   END OF B0 v1.0.1
   ===================================================================================== */

