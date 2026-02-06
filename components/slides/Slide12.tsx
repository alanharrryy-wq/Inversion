
/* =====================================================================================
   FILE: components/slides/Slide12.tsx
   PROJECT: Hitech RTS Deck (Deck v32+)
   STYLE: Tailwind inline + embedded styles (NO global CSS)
   VERSION: v12.3.0 (Dark Mode + Neon Glass)
   ===================================================================================== */

/* eslint-disable react/no-dangerously-set-inner-html */

/* =====================================================================================
   BLOCK 1) IMPORTS + PUBLIC PROPS (YOUR PROJECT)
   ===================================================================================== */

import React, { ReactNode, useEffect, useId, useMemo, useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";

export interface Slide12Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

/* =====================================================================================
   BLOCK 2) BRAND TOKENS + INTERNAL TYPES + HOTFIX SWITCHES
   ===================================================================================== */

type BrandTokens = {
  gold: string;         // #AB7B26
  deepBlue: string;     // #026F86
  energyCyan: string;   // #02A7CA
  darkBronze: string;   // #553E13
  ink: string;          // Text color (Light in dark mode)
  slate: string;        // Secondary text
  bg: string;           // Background
  surface: string;      // Surface color
  lineBlueA10: string;
  lineBlueA08: string;
  goldA10: string;
  goldA20: string;
  cyanA08: string;
  shadowSoft: string;
  white: string;        // Added to fix type error
};

type CoreModule = {
  key: "smartservice" | "conditionscore" | "healthradar" | "failmatrix";
  title: string;
  trademark?: string;
  subtitle: string;
  bullets: string[];
  badge: string;
  accent: "gold" | "cyan" | "deepBlue";
  icon: ReactNode;
};

type TraditionalPain = {
  title: string;
  desc: string;
  icon: ReactNode;
};

const BRAND_DARK: BrandTokens = {
  gold: "#AB7B26",
  deepBlue: "#00F0FF", // Cyan pop
  energyCyan: "#02A7CA",
  darkBronze: "#553E13",
  ink: "#F8FAFC",        // Almost White
  slate: "#94A3B8",      // Slate 400
  bg: "#05080C",         // Dark Deep
  surface: "rgba(255,255,255,0.03)",
  lineBlueA10: "rgba(0, 240, 255, 0.15)",
  lineBlueA08: "rgba(0, 240, 255, 0.10)",
  goldA10: "rgba(171, 123, 38, 0.15)",
  goldA20: "rgba(171, 123, 38, 0.25)",
  cyanA08: "rgba(2, 167, 202, 0.10)",
  shadowSoft: "0 24px 60px rgba(0,0,0,0.6)",
  white: "#FFFFFF",      // Added to fix type error
};

const S12 = {
  neon: {
    enable: true,
    ringBoost: true,
    scanBoost: true,
    cardHoverBoost: true,
  },
  debugGrid: false,
};

/* =====================================================================================
   BLOCK 3) UTILITIES + REDUCED MOTION
   ===================================================================================== */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

/* =====================================================================================
   BLOCK 4) ICONS (INLINE SVG)
   ===================================================================================== */

const IconClipboard = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 4h6a2 2 0 0 1 2 2v1H7V6a2 2 0 0 1 2-2Z" fill="none" stroke={stroke} strokeWidth="1.8" />
    <path d="M7 7h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z" fill="none" stroke={stroke} strokeWidth="1.8" />
    <path d="M9.5 4.5h5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconPuzzle = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M13 3h2a2 2 0 0 1 2 2v2h1a2 2 0 1 1 0 4h-1v2a2 2 0 0 1-2 2h-2v-1a2 2 0 1 0-4 0v1H7a2 2 0 0 1-2-2v-2H4a2 2 0 1 1 0-4h1V5a2 2 0 0 1 2-2h2v1a2 2 0 1 0 4 0V3Z"
      fill="none"
      stroke={stroke}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth="1.8" />
    <path d="M12 7v6l4 2" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPulse = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12h5l2-6 4 12 2-6h5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconScore = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 19V5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 19V5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 17l3-3 3 2 4-5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRadar = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="none" stroke={stroke} strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" fill="none" stroke={stroke} strokeWidth="1.6" />
    <path d="M12 12l6-6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3.5 12h4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconMatrix = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" fill="none" stroke={stroke} strokeWidth="1.6" />
    <path d="M7 7h0M17 7h0M7 17h0M17 17h0" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

/* =====================================================================================
   BLOCK 5) EMBEDDED STYLES / KEYFRAMES
   ===================================================================================== */

function EmbeddedStyles({ brand, reducedMotion }: { brand: BrandTokens; reducedMotion: boolean }) {
  const css = useMemo(() => {
    // Glows adapted for Dark Mode
    const goldGlow = rgba(brand.gold, 0.4);
    const cyanGlow = rgba(brand.energyCyan, 0.4);

    const ringGold = S12.neon.ringBoost
      ? `
        box-shadow:
          0 0 0 1px ${rgba(brand.gold, 0.5)},
          0 0 18px ${rgba(brand.gold, 0.3)},
          0 0 44px ${rgba(brand.gold, 0.1)};
      `
      : `box-shadow: 0 0 0 1px ${rgba(brand.gold, 0.3)}, 0 0 22px ${goldGlow};`;

    const ringCyan = S12.neon.ringBoost
      ? `
        box-shadow:
          0 0 0 1px ${rgba(brand.energyCyan, 0.5)},
          0 0 20px ${rgba(brand.energyCyan, 0.3)},
          0 0 54px ${rgba(brand.energyCyan, 0.1)};
      `
      : `box-shadow: 0 0 0 1px ${rgba(brand.energyCyan, 0.3)}, 0 0 22px ${cyanGlow};`;

    const scanGradient = `linear-gradient(180deg, transparent, ${rgba(brand.energyCyan, 0.3)}, ${rgba(brand.gold, 0.15)}, transparent)`;

    const cardHoverGlow = S12.neon.cardHoverBoost
      ? `
        [data-s12] .s12_card:hover{
          box-shadow:
            0 10px 30px rgba(0,0,0,0.5),
            0 0 0 1px ${rgba(brand.energyCyan, 0.3)},
            0 0 28px ${rgba(brand.energyCyan, 0.1)},
            0 0 40px ${rgba(brand.gold, 0.05)};
          transform: translateY(-2px);
          background: rgba(255,255,255,0.08) !important;
        }
      `
      : `
        [data-s12] .s12_card:hover{
          box-shadow: 0 10px 26px rgba(0,0,0,0.5);
          transform: translateY(-2px);
        }
      `;

    return `
      @keyframes s12_fadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes s12_sheen {
        0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
        10%  { opacity: 0.3; }
        40%  { opacity: 0.1; }
        70%  { opacity: 0.3; }
        100% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
      }

      @keyframes s12_microFloat {
        0%,100% { transform: translateY(0); }
        50%     { transform: translateY(-4px); }
      }

      @keyframes s12_trace {
        0%   { stroke-dashoffset: 110; opacity: 0.2; }
        50%  { opacity: 0.7; }
        100% { stroke-dashoffset: 0; opacity: 0.2; }
      }

      @keyframes s12_scanLine {
        0%   { transform: translateY(-25%); opacity: 0; }
        10%  { opacity: 0.5; }
        80%  { opacity: 0.5; }
        100% { transform: translateY(125%); opacity: 0; }
      }

      [data-s12] .s12_fadeUp { animation: s12_fadeUp 700ms ease-out both; }
      [data-s12] .s12_delay_1 { animation-delay: 90ms; }
      [data-s12] .s12_delay_2 { animation-delay: 180ms; }
      [data-s12] .s12_delay_3 { animation-delay: 270ms; }
      [data-s12] .s12_delay_4 { animation-delay: 360ms; }

      [data-s12] .s12_sheen::after {
        content: "";
        position: absolute;
        inset: -20%;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(255,255,255,0.0) 30%,
          rgba(255,255,255,0.1) 50%,
          rgba(255,255,255,0.0) 70%,
          transparent 100%
        );
        transform: translateX(-120%) skewX(-18deg);
        animation: s12_sheen 4s ease-in-out infinite;
        pointer-events: none;
        mix-blend-mode: overlay;
      }

      [data-s12] .s12_ringGold { ${ringGold} }
      [data-s12] .s12_ringCyan { ${ringCyan} }

      [data-s12] .s12_tracePath {
        stroke-dasharray: 110;
        stroke-dashoffset: 110;
        animation: s12_trace 2s ease-out infinite;
      }

      [data-s12] .s12_scan {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.0;
      }
      [data-s12] .s12_scan::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        height: 150px;
        background: ${scanGradient};
        filter: blur(2px);
        animation: s12_scanLine 5s ease-in-out infinite;
        mix-blend-mode: screen;
      }

      ${cardHoverGlow}

      ${reducedMotion ? `
        [data-s12] .s12_fadeUp,
        [data-s12] .s12_sheen::after,
        [data-s12] .s12_tracePath,
        [data-s12] .s12_scan::before { animation: none !important; }
        [data-s12] .s12_card:hover{ transform: none !important; }
      ` : ``}
    `;
  }, [brand, reducedMotion]);

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/* =====================================================================================
   BLOCK 6) SHELL
   ===================================================================================== */

function SlideShellDark({
  children,
  brand,
  debugGrid,
}: {
  children: ReactNode;
  brand: BrandTokens;
  debugGrid?: boolean;
}) {
  const patternId = useId();

  return (
    <div
      data-s12
      className={cx("w-full h-full rounded-xl relative overflow-hidden", "border")}
      style={{
        backgroundColor: brand.bg,
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow: brand.shadowSoft,
      }}
    >
      {/* Dark Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0%, #111827 0%, #05080C 70%)",
        }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Diagonal Trace */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="stripeFade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={rgba(brand.energyCyan, 0.0)} />
              <stop offset="35%" stopColor={rgba(brand.energyCyan, 0.05)} />
              <stop offset="55%" stopColor={rgba(brand.gold, 0.05)} />
              <stop offset="100%" stopColor={rgba(brand.energyCyan, 0.0)} />
            </linearGradient>
          </defs>

          <g transform="translate(-220, 0) rotate(-12 800 450)">
            <rect
              x="0"
              y="350"
              width="2000"
              height="120"
              fill="url(#stripeFade)"
              opacity={0.3}
            />
            {/* Trace Path */}
            <path
              className="s12_tracePath"
              d="M120 410 H380 L460 380 H720 L820 440 H1040 L1120 400 H1480"
              fill="none"
              stroke={rgba(brand.energyCyan, 0.4)}
              strokeWidth="2"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(0,240,255,0.5))"
            />
          </g>
        </svg>
      </div>

      {debugGrid && <DebugGridOverlay brand={brand} />}

      <div className="relative z-10 w-full h-full p-10">{children}</div>
    </div>
  );
}

/* =====================================================================================
   BLOCK 7) HEADER + PANELS + CORE GRID
   ===================================================================================== */

function SlideHeaderDark({
  breadcrumb,
  title,
  subtitle,
  slideNum,
  brand,
}: {
  breadcrumb: string;
  title: string;
  subtitle: string;
  slideNum: number;
  brand: BrandTokens;
}) {
  return (
    <div className="w-full grid grid-cols-12 items-end gap-6">
      <div className="col-span-9">
        <div className={cx("s12_fadeUp")}>
          <div className="font-mono text-[13px] tracking-[0.35em] uppercase text-cyan/70">
            {breadcrumb}
          </div>

          <h2 className="mt-2 font-black leading-[0.95] tracking-[-0.02em]" style={{ fontSize: 64, color: brand.ink }}>
            {title}
          </h2>

          <div className="mt-3 text-[18px] tracking-[0.12em] uppercase font-semibold" style={{ color: brand.slate }}>
            {subtitle}
          </div>

          <div
            className="mt-5 h-[1px] w-[520px]"
            style={{
              background: `linear-gradient(90deg, ${brand.gold}, ${brand.energyCyan}, transparent)`,
              opacity: 0.7
            }}
          />
        </div>
      </div>

      <div className="col-span-3 flex items-end justify-end">
        <div
          className={cx("s12_fadeUp s12_delay_1")}
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.05)",
            lineHeight: 1,
          }}
          aria-label={`Slide ${slideNum}`}
        >
          {String(slideNum).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}

function TraditionalPanel({ brand, items }: { brand: BrandTokens; items: TraditionalPain[] }) {
  return (
    <div
      className={cx("relative rounded-2xl border p-8", "s12_fadeUp s12_delay_2")}
      style={{
        borderColor: "rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.4)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
      }}
    >
      <CornerMarks brand={brand} mode="left" />

      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold tracking-[0.10em] uppercase text-[12px]" style={{ color: brand.slate }}>
            El enfoque tradicional
          </div>
          <h3 className="mt-2 text-[28px] font-black" style={{ color: brand.ink }}>
            Cumplir no es controlar
          </h3>
        </div>

        <Pill label="REACTIVO" color="slate" brand={brand} />
      </div>

      <div
        className="mt-6 h-[1px] w-full"
        style={{ background: `linear-gradient(90deg, rgba(255,255,255,0.1), transparent)` }}
      />

      <ul className="mt-6 space-y-5">
        {items.map((it, i) => (
          <li
            key={i}
            className={cx("group flex gap-4 items-start rounded-xl p-4 transition-all", "hover:bg-white/5")}
            style={{
              border: `1px solid rgba(255,255,255,0.05)`,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              className={cx("w-11 h-11 rounded-xl flex items-center justify-center shrink-0")}
              style={{
                border: `1px solid rgba(255,255,255,0.1)`,
                background: `linear-gradient(180deg, rgba(255,255,255,0.05), transparent)`,
                color: brand.slate
              }}
            >
              {it.icon}
            </div>

            <div className="flex-1">
              <div className="font-bold text-[18px]" style={{ color: brand.ink }}>
                {it.title}
              </div>
              <div className="mt-1 text-[15px] leading-snug" style={{ color: brand.slate }}>
                {it.desc}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-7 text-[13px] leading-relaxed" style={{ color: brand.slate }}>
        <span className="font-semibold" style={{ color: brand.ink }}>
          Nota:
        </span>{" "}
        La evidencia existe… pero llega tarde, dispersa, y no se convierte en decisiones.
      </div>

      <div className="s12_scan" />
    </div>
  );
}

function CoreGrid({ brand, modules, reducedMotion }: { brand: BrandTokens; modules: CoreModule[]; reducedMotion: boolean }) {
  return (
    <div
      className={cx("relative rounded-2xl border p-8", "s12_fadeUp s12_delay_3")}
      style={{
        borderColor: "rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.6)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
      }}
    >
      <CornerMarks brand={brand} mode="right" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold tracking-[0.10em] uppercase text-[12px]" style={{ color: brand.slate }}>
            El modelo HITECH
          </div>
          <h3 className="mt-2 text-[28px] font-black" style={{ color: brand.ink }}>
            CORE HITECH™ — Control operativo en tiempo real
          </h3>
        </div>

        <Pill label="ACCIONABLE" color="gold" brand={brand} />
      </div>

      <div
        className="mt-6 h-[1px] w-full"
        style={{
          background: `linear-gradient(90deg, ${brand.gold}, ${brand.energyCyan}, transparent)`,
          opacity: 0.5
        }}
      />

      <div className="mt-6 grid grid-cols-2 gap-5">
        {modules.map((m) => (
          <CoreCard key={m.key} module={m} brand={brand} reducedMotion={reducedMotion} />
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <div className="text-[13px] leading-relaxed" style={{ color: brand.slate }}>
          <span className="font-semibold" style={{ color: brand.ink }}>
            Resultado:
          </span>{" "}
          Cumplimiento documentado, trazable y{" "}
          <span style={{ color: brand.deepBlue, fontWeight: 700 }}>medible</span>.
        </div>

        <div className="flex items-center gap-2">
          <MiniStat label="Trazabilidad" value="360°" brand={brand} />
          <MiniStat label="Velocidad" value="Real-time" brand={brand} />
          <MiniStat label="Evidencia" value="Audit-Ready" brand={brand} />
        </div>
      </div>

      <div className={cx("absolute inset-0 rounded-2xl pointer-events-none s12_sheen")} style={{ opacity: reducedMotion ? 0 : 0.5 }} />
    </div>
  );
}

function CoreCard({ module, brand, reducedMotion }: { module: CoreModule; brand: BrandTokens; reducedMotion: boolean }) {
  const [open, setOpen] = useState(false);

  const accentColor = module.accent === "gold" ? brand.gold : module.accent === "cyan" ? brand.energyCyan : brand.deepBlue;
  const ringClass = module.accent === "gold" ? "s12_ringGold" : module.accent === "cyan" ? "s12_ringCyan" : "";

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className={cx(
        "s12_card relative text-left rounded-2xl border p-5 transition-all duration-300",
        "hover:-translate-y-[2px] focus:outline-none focus:ring-1 focus:ring-white/20"
      )}
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(4px)",
      }}
    >
      <span className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `0 0 0 1px ${rgba(accentColor, 0.0)}` }} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cx(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              ringClass
            )}
            style={{
              border: `1px solid ${rgba(accentColor, 0.4)}`,
              background: `linear-gradient(180deg, ${rgba(accentColor, 0.2)}, transparent)`,
              color: brand.ink
            }}
          >
            {module.icon}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <div className="text-[18px] font-black" style={{ color: brand.ink }}>
                {module.title}
              </div>
              <div
                className="text-[11px] font-mono tracking-[0.18em] uppercase"
                style={{
                  color: accentColor,
                  background: rgba(accentColor, 0.10),
                  border: `1px solid ${rgba(accentColor, 0.3)}`,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {module.badge}
              </div>
            </div>

            <div className="mt-1 text-[14px]" style={{ color: brand.slate }}>
              {module.subtitle}
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono tracking-[0.20em] uppercase opacity-50" style={{ color: brand.slate }}>
          {open ? "CLOSE" : "OPEN"}
        </div>
      </div>

      <div
        className="mt-4 transition-all duration-300 overflow-hidden"
        style={{
          maxHeight: open ? 220 : 0,
          opacity: open ? 1 : 0,
        }}
        aria-hidden={!open}
      >
        <div
          className="mt-3 rounded-xl border p-4"
          style={{
            borderColor: rgba(accentColor, 0.2),
            background: `linear-gradient(180deg, ${rgba(accentColor, 0.05)}, rgba(0,0,0,0.3))`,
          }}
        >
          <ul className="space-y-2">
            {module.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px]" style={{ color: brand.ink }}>
                <span className="mt-[6px] inline-block w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                <span style={{ color: brand.slate }}>
                  <span className="font-semibold" style={{ color: brand.ink }}>
                    {b.split("—")[0]?.trim()}
                  </span>{" "}
                  {b.includes("—") ? `— ${b.split("—").slice(1).join("—").trim()}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {!reducedMotion && (
          <div className="mt-3 flex items-center justify-between">
            <MicroPulseBar brand={brand} accent={accentColor} />
            <div className="text-[10px] font-mono tracking-[0.22em] uppercase" style={{ color: brand.slate }}>
              CORE_SIGNAL // OK
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function MicroPulseBar({ brand, accent }: { brand: BrandTokens; accent: string }) {
  return (
    <div
      className="relative h-[4px] w-[180px] rounded-full overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: "60%",
          background: accent,
          animation: "s12_microFloat 2.4s ease-in-out infinite",
          opacity: 0.6
        }}
      />
    </div>
  );
}

/* =====================================================================================
   BLOCK 8) QUOTE BAR + SMALL UI PIECES
   ===================================================================================== */

function QuoteBar({ brand, quote, author }: { brand: BrandTokens; quote: string; author: string }) {
  return (
    <div
      className={cx("relative rounded-2xl border px-8 py-6", "s12_fadeUp s12_delay_4")}
      style={{
        borderColor: "rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="text-[22px] font-black leading-tight" style={{ color: brand.ink }}>
            “{quote}”
          </div>
          <div className="mt-2 text-[12px] font-mono tracking-[0.28em] uppercase" style={{ color: brand.deepBlue }}>
            — {author}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <SealBadge brand={brand} />
          <div className="text-right">
            <div className="text-[12px] font-semibold tracking-[0.10em] uppercase" style={{ color: brand.slate }}>
              Evidence
            </div>
            <div className="text-[14px] font-black" style={{ color: brand.ink }}>
              Audit-Ready
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute left-8 right-8 bottom-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, ${brand.gold}, ${brand.energyCyan}, transparent)`,
          opacity: 0.5
        }}
      />
    </div>
  );
}

function SealBadge({ brand }: { brand: BrandTokens }) {
  return (
    <div className="relative w-12 h-12 rounded-full flex items-center justify-center" style={{ background: rgba(brand.gold, 0.1) }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${rgba(brand.gold, 0.3)}`,
          boxShadow: `0 0 10px ${rgba(brand.gold, 0.1)}`,
        }}
      />
      <div className="relative w-8 h-8 rounded-full flex items-center justify-center" style={{ background: brand.ink }}>
        <div className="text-[8px] font-mono tracking-[0.2em] font-bold" style={{ color: brand.white }}>
          CORE
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color, brand }: { label: string; color: "gold" | "slate"; brand: BrandTokens }) {
  const bg = color === "gold" ? rgba(brand.gold, 0.15) : "rgba(255,255,255,0.05)";
  const bd = color === "gold" ? rgba(brand.gold, 0.4) : "rgba(255,255,255,0.1)";
  const fg = color === "gold" ? brand.gold : brand.slate;

  return (
    <div
      className="px-3 py-2 rounded-md text-[11px] font-mono tracking-[0.22em] uppercase"
      style={{ background: bg, border: `1px solid ${bd}`, color: fg }}
    >
      {label}
    </div>
  );
}

function MiniStat({ label, value, brand }: { label: string; value: string; brand: BrandTokens }) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
      <div className="text-[10px] font-mono tracking-[0.22em] uppercase" style={{ color: brand.slate }}>
        {label}
      </div>
      <div className="text-[13px] font-black" style={{ color: brand.energyCyan }}>
        {value}
      </div>
    </div>
  );
}

function CornerMarks({ brand, mode }: { brand: BrandTokens; mode: "left" | "right" }) {
  const c1 = mode === "left" ? rgba(brand.energyCyan, 0.5) : rgba(brand.gold, 0.5);
  const c2 = mode === "left" ? rgba(brand.gold, 0.5) : rgba(brand.energyCyan, 0.5);

  return (
    <>
      <div className="absolute -top-[1px] -left-[1px] w-4 h-4" style={{ borderTop: `2px solid ${c1}`, borderLeft: `2px solid ${c1}` }} />
      <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4" style={{ borderBottom: `2px solid ${c2}`, borderRight: `2px solid ${c2}` }} />
    </>
  );
}

function DebugGridOverlay({ brand }: { brand: BrandTokens }) {
  return null;
}

/* =====================================================================================
   BLOCK 9) INTERNAL MAMUT BODY (MAIN CONTENT)
   ===================================================================================== */

function Slide12_MamutDarkPremium({
  brand,
  reducedMotion,
  nextSlide,
  prevSlide,
}: {
  brand: BrandTokens;
  reducedMotion: boolean;
  nextSlide: () => void;
  prevSlide: () => void;
}) {
  const slideNum = 12;

  const breadcrumb = "CORE HITECH™ / COMPLIANCE";
  const title = "Compliance no es papel.\nEs control operativo.";
  const subtitle = "CORE HITECH™ transforma normas en decisiones medibles.";

  const pains: TraditionalPain[] = useMemo(
    () => [
      {
        title: "Auditorías reactivas",
        desc: "Se corre cuando ya hay incidente, visita o regaño.",
        icon: <IconClipboard stroke={brand.slate} />,
      },
      {
        title: "Evidencia fragmentada",
        desc: "Fotos, formatos y bitácoras en islas que no hablan entre sí.",
        icon: <IconPuzzle stroke={brand.slate} />,
      },
      {
        title: "Cumplimiento tardío y costoso",
        desc: "El costo real aparece en paros, riesgos y retrabajo.",
        icon: <IconClock stroke={brand.slate} />,
      },
    ],
    [brand.slate]
  );

  const modules: CoreModule[] = useMemo(
    () => [
      {
        key: "smartservice",
        title: "SmartService™",
        subtitle: "Gestión viva de inspecciones, tareas y hallazgos críticos.",
        bullets: [
          "Inspecciones — programadas y post-evento, con responsables.",
          "Acciones — tickets con fecha de cierre y evidencia.",
          "Bitácoras — trazables y auditables (sin cajas negras).",
        ],
        badge: "OPS",
        accent: "deepBlue",
        icon: <IconPulse stroke={brand.ink} />,
      },
      {
        key: "conditionscore",
        title: "ConditionScore™",
        subtitle: "Salud operativa cuantificada por activo y criticidad.",
        bullets: [
          "Priorización — foco en lo que sí pega al riesgo.",
          "Tendencias — historial por equipo y área.",
          "Decisión — mantenimiento antes del paro.",
        ],
        badge: "SCORE",
        accent: "gold",
        icon: <IconScore stroke={brand.ink} />,
      },
      {
        key: "healthradar",
        title: "HealthRadar™",
        subtitle: "Alertas tempranas antes del incidente.",
        bullets: [
          "Desviaciones — identifica cuando se sale del estándar.",
          "Señales — riesgo eléctrico, químicos, orden/limpieza, EPP.",
          "Acción — dispara tareas y evidencia.",
        ],
        badge: "ALERT",
        accent: "cyan",
        icon: <IconRadar stroke={brand.ink} />,
      },
      {
        key: "failmatrix",
        title: "FailMatrix™",
        subtitle: "Patrones de riesgo convertidos en prevención inteligente.",
        bullets: [
          "Causas raíz — conecta incidentes + hallazgos + tendencias.",
          "Escenarios — identifica riesgos recurrentes.",
          "Prevención — controles antes de repetición.",
        ],
        badge: "MATRIX",
        accent: "gold",
        icon: <IconMatrix stroke={brand.ink} />,
      },
    ],
    [brand.ink]
  );

  const quote = "Si no se puede medir, no se puede proteger.";
  const author = "CORE HITECH™";

  return (
    <div className="w-full h-full">
      <EmbeddedStyles brand={brand} reducedMotion={reducedMotion} />

      <SlideShellDark brand={brand} debugGrid={S12.debugGrid}>
        {/* HEADER */}
        <div className="h-[18%]">
          <SlideHeaderDark breadcrumb={breadcrumb} title={title} subtitle={subtitle} slideNum={slideNum} brand={brand} />
        </div>

        {/* BODY */}
        <div className="h-[68%] mt-8 grid grid-cols-12 gap-6">
          <div className="col-span-5">
            <TraditionalPanel brand={brand} items={pains} />
          </div>

          <div className="col-span-7">
            <CoreGrid brand={brand} modules={modules} reducedMotion={reducedMotion} />
          </div>
        </div>

        {/* FOOTER */}
        <div className="h-[14%] mt-6 grid grid-cols-12 gap-6 items-end">
          <div className="col-span-9">
            <QuoteBar brand={brand} quote={quote} author={author} />
          </div>

          <div className="col-span-3">
            <div className="w-full flex items-center justify-center gap-6 pt-2">
              <NavArea prev={prevSlide} next={nextSlide} />
            </div>
          </div>
        </div>
      </SlideShellDark>
    </div>
  );
}

/* =====================================================================================
   BLOCK 10) FINAL EXPORTED SLIDE (YOUR PROJECT)
   ===================================================================================== */

export const Slide12: React.FC<Slide12Props> = ({ nextSlide, prevSlide }) => {
  const brand = BRAND_DARK;
  const reducedMotion = usePrefersReducedMotion();

  return (
    <SlideContainer>
      <Header title="HITECH CORE" breadcrumb="CEREBRO" slideNum={12} />

      <div className="h-full w-full">
        <Slide12_MamutDarkPremium brand={brand} reducedMotion={reducedMotion} nextSlide={nextSlide} prevSlide={prevSlide} />
      </div>
    </SlideContainer>
  );
};

export default Slide12;