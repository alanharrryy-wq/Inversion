// components/Slide/SlideShell.tsx
import React from "react";
import { useDeckMode, useDeckModeForSlide } from "../DeckRuntimeMode";

type SlideContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * SlideShell v2.3.0
 * - Header/Nav: invisibles pero conservan espacio (sin salto)
 * - Stealth mini HUD
 * - Safe-area (móvil/tablet)
 * - LensWrapper heavy: respeta heavyFx por slide (whitelist en Track)
 */

// =========================================================
// [B1] Helper: invisible pero conserva espacio
// =========================================================
function InvisibleButTakesSpace({
  hidden,
  children,
}: {
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={hidden ? "opacity-0 pointer-events-none select-none" : "opacity-100"}>
      {children}
    </div>
  );
}

// =========================================================
// [B2] Safe-area wrapper (móvil/tablet)
// =========================================================
export function SlideContainer({ children, className = "" }: SlideContainerProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Fondo */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[radial-gradient(circle_at_top,_rgba(0,240,255,0.22),transparent_55%)]" />

      {/* Safe-area */}
      <div className="relative z-10 w-full h-full safearea-pad">{children}</div>
    </div>
  );
}

// =========================================================
// [B3] Stealth mini HUD (solo en stealth)
// =========================================================
export function StealthMiniHud({ slideNum }: { slideNum?: number }) {
  const { mode } = useDeckMode();
  if (!mode.stealth) return null;

  return (
    <div className="absolute top-4 right-5 z-50 px-3 py-2 rounded-xl border border-white/10 bg-black/25">
      <div className="font-code text-[10px] tracking-[0.22em] text-white/55">
        SL {typeof slideNum === "number" ? String(slideNum).padStart(2, "0") : "--"} ·{" "}
        {mode.track ? "TRACK" : "STD"} · {mode.investorLock ? "LOCK" : "FREE"}
      </div>
    </div>
  );
}

// =========================================================
// [B4] Header (Stealth inteligente: NO null)
// =========================================================
export function Header(props: {
  title: string;
  breadcrumb?: string;
  slideNum?: number;
  rightBadge?: string;
}) {
  const { mode } = useDeckMode();
  const { title, breadcrumb, slideNum, rightBadge } = props;

  return (
    <InvisibleButTakesSpace hidden={mode.stealth}>
      <div className="w-full px-12 pt-10 pb-6 relative z-20">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="font-code text-xs tracking-[0.32em] text-white/45 uppercase">
              {breadcrumb ?? "HITECH"}
              {typeof slideNum === "number" ? (
                <span className="ml-3 text-white/30">
                  / SLIDE {String(slideNum).padStart(2, "0")}
                </span>
              ) : null}
            </div>

            <div className="mt-2 text-4xl font-black text-white leading-tight">{title}</div>

            <div className="mt-4 h-[2px] w-[420px] max-w-full bg-gradient-to-r from-cyan/60 via-white/10 to-transparent opacity-70" />
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {rightBadge ? (
              <div className="px-3 py-2 rounded-xl border border-white/10 bg-black/35 text-xs font-code tracking-[0.26em] text-white/65">
                {rightBadge}
              </div>
            ) : null}

            <div className="px-3 py-2 rounded-xl border border-white/10 bg-black/35 text-[10px] font-code tracking-[0.24em] text-white/55">
              {mode.track ? "TRACK" : "TRACK-OFF"} · {mode.investorLock ? "LOCK" : "FREE"}
            </div>
          </div>
        </div>
      </div>
    </InvisibleButTakesSpace>
  );
}

// =========================================================
// [B5] NavArea (Stealth/Lock: invisible pero ocupa espacio)
// =========================================================
export function NavArea(props: {
  prev?: () => void;
  next?: () => void;
  labelPrev?: string;
  labelNext?: string;
}) {
  const { mode } = useDeckMode();
  const { prev, next, labelPrev = "PREV", labelNext = "NEXT" } = props;

  const hidden = mode.stealth || mode.investorLock;

  return (
    <InvisibleButTakesSpace hidden={hidden}>
      <div className="absolute bottom-8 left-0 right-0 z-30 px-12">
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            className={[
              "px-5 py-3 rounded-xl border",
              "bg-black/35 border-white/10 text-white/70",
              "hover:border-white/25 hover:bg-black/45 hover:text-white",
              "transition-all duration-200",
              prev ? "" : "opacity-40 pointer-events-none",
            ].join(" ")}
          >
            <span className="font-code text-xs tracking-[0.28em]">← {labelPrev}</span>
          </button>

          <div className="text-[10px] font-code tracking-[0.24em] text-white/35">
            SPACE / → = NEXT · ← = PREV
          </div>

          <button
            onClick={next}
            className={[
              "px-5 py-3 rounded-xl border",
              "bg-black/35 border-white/10 text-white/70",
              "hover:border-white/25 hover:bg-black/45 hover:text-white",
              "transition-all duration-200",
              next ? "" : "opacity-40 pointer-events-none",
            ].join(" ")}
          >
            <span className="font-code text-xs tracking-[0.28em]">{labelNext} →</span>
          </button>
        </div>
      </div>
    </InvisibleButTakesSpace>
  );
}

// =========================================================
// [B6] DataBox
// =========================================================
export function DataBox(props: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  rightTag?: string;
  highlight?: "cyan" | "gold";
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const { mode } = useDeckMode();
  const { title, children, className = "", rightTag, highlight, onClick, style } = props;

  let borderClass = "border-white/10";
  if (highlight === "cyan") borderClass = "border-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]";
  if (highlight === "gold") borderClass = "border-gold/50 shadow-[0_0_15px_rgba(171,123,38,0.15)]";

  return (
    <div
      onClick={onClick}
      style={style}
      className={[
        "relative rounded-2xl border bg-black/35 overflow-hidden",
        borderClass,
        !highlight && "shadow-[0_0_40px_rgba(0,240,255,0.06)]",
        onClick ? "cursor-pointer hover:-translate-y-1 transition-transform duration-200" : "",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {!mode.stealth && (title || rightTag) ? (
        <div className="relative z-10 px-5 pt-5 pb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <div className="font-code text-xs tracking-[0.26em] text-white/60 uppercase truncate">
                {title}
              </div>
            ) : null}
          </div>
          {rightTag ? (
            <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-code tracking-[0.22em] text-white/55">
              {rightTag}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 px-5 pb-5">{children}</div>
    </div>
  );
}

// =========================================================
// [B7] LensWrapper (heavy respeta heavyFx por slide si se pasa slideIndex)
// =========================================================
export function LensWrapper(props: {
  children: React.ReactNode;
  className?: string;
  heavy?: boolean;
  slideIndex?: number;
}) {
  const { heavy, slideIndex, children, className = "" } = props;

  // Si no pasas slideIndex, usa modo global.
  // Si lo pasas, aplica whitelist por slide (Track mode).
  const api = typeof slideIndex === "number" ? useDeckModeForSlide(slideIndex) : useDeckMode();
  const mode = api.mode as any;
  const heavyFxEffective = mode.heavyFx ?? mode.heavyFxGlobal ?? true;

  if (heavy && !heavyFxEffective) return <>{children}</>;

  return (
    <div
      className={[
        "relative rounded-2xl border border-white/10 bg-black/25 overflow-hidden",
        "backdrop-blur-[10px]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 pointer-events-none opacity-35 bg-[radial-gradient(circle_at_top,_rgba(0,240,255,0.18),transparent_60%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}