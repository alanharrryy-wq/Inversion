import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import { WOW_DEMO, WOW_EVIDENCE_IMPACT, WOW_PROOF_LOCK } from "../../config/wow";
import { useStableTimeout } from "../../wow";
import { emitTourEvent } from "../../wow/tour";

/**
 * =============================================================
 * Slide04 — AUDIT-PROOF REALITY (NASA-level)
 * SOLUCIÓN / PROPUESTA DE VALOR
 * "La realidad que nos obligó a crear el motor"
 * =============================================================
 *
 * Concept:
 * - Not "how the engine works" (that's SmartService slide)
 * - This is "why the engine had to exist"
 *
 * Narrative in 3 acts:
 *   Act I   — BEFORE / Black Box
 *   Act II  — THE QUESTION (executive tension) [focus core]
 *   Act III — THE SHIFT (truth in the instant) + badges
 *
 * Closing statement:
 *   "Y sé que es así,
 *    porque así es como se accede a la operación real."
 *
 * Interactions (15+):
 *  1) Hover Act II => global focus mode (dims others)
 *  2) Hover Act I => subtle uncertainty distortion overlay
 *  3) Hover Act III => badges glow + scan accent
 *  4) Hover invalid items => animated strike + micro-jitter
 *  5) Hover badges => tooltip with auto-placement
 *  6) Click badge => lock tooltip
 *  7) ESC => clear focus + tooltip lock
 *  8) TAB outlines (auditor-friendly)
 *  9) Enter on badge => lock/unlock tooltip
 * 10) Proximity glow => panel reacts to cursor distance
 * 11) Idle narrative pulse => Act II subtly "breathes" every ~14s
 * 12) Long-hover Act II => caption appears ("This is where systems fail.")
 * 13) Long-hover Act III => caption appears ("This is where evidence begins.")
 * 14) Toggle "Evidence Overlay" => shows evidence markers, no engine explanation
 * 15) Copy-to-clipboard on evidence token click (ID) + toast
 *
 * Motion safety:
 *  - Prefers Reduced Motion honored (kills loops / parallax)
 *
 * Styling:
 *  - Tailwind inline + embedded <style> tokens, like your Slide06
 *
 * IMPORTANT:
 *  - No external CSS, no global changes.
 */

type Placement = "top" | "bottom" | "left" | "right";
type BadgeId = "REAL_TIME" | "TRACEABLE" | "EVIDENCE_READY";
type ActId = "ACT_I" | "ACT_II" | "ACT_III";

type BadgeDef = {
  id: BadgeId;
  label: string;
  sub: string;
  hint: string;
  meta: string[];
  tone: "cyan" | "emerald" | "amber";
};

const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function useInterval(callback: () => void, delay: number | null) {
  const cb = useRef(callback);
  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay == null) return;
    const id = window.setInterval(() => cb.current(), delay);
    return () => window.clearInterval(id);
  }, [delay]);
}

function useRafLoop(enabled: boolean, cb: (t: number) => void) {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (t - lastRef.current < 16) return; // ~60fps
      lastRef.current = t;
      cb(t);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, cb]);
}

/** Clipboard helper with graceful fallback */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const COLORS = {
  BG: "#070A0F",
  CYAN: "#02A7CA",
  TEAL: "#00F5D4",
  GOLD: "#AB7B26",
  EMERALD: "#34D399",
  AMBER: "#F59E0B",
  RED: "#FB7185",
  WHITE: "#EAF2FF",
};

const GLOW = {
  CYAN_A: "drop-shadow-[0_0_10px_rgba(2,167,202,0.20)]",
  CYAN_B: "drop-shadow-[0_0_16px_rgba(2,167,202,0.30)]",
  CYAN_C: "drop-shadow-[0_0_22px_rgba(2,167,202,0.42)]",
  EMERALD_A: "drop-shadow-[0_0_10px_rgba(52,211,153,0.18)]",
  EMERALD_B: "drop-shadow-[0_0_16px_rgba(52,211,153,0.26)]",
  AMBER_A: "drop-shadow-[0_0_10px_rgba(245,158,11,0.18)]",
  AMBER_B: "drop-shadow-[0_0_16px_rgba(245,158,11,0.26)]",
  WHITE_A: "drop-shadow-[0_0_10px_rgba(255,255,255,0.10)]",
  WHITE_B: "drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]",
};

const BADGES: BadgeDef[] = [
  {
    id: "REAL_TIME",
    label: "REAL-TIME",
    sub: "Latency < 1s",
    hint: "See it as it happens — not after.",
    meta: ["Streaming telemetry", "SLA-grade cadence", "No blind windows"],
    tone: "cyan",
  },
  {
    id: "TRACEABLE",
    label: "TRACEABLE",
    sub: "Chain of custody",
    hint: "Every signal has a source, timestamp, and lineage.",
    meta: ["Event lineage", "Source attribution", "Immutable references"],
    tone: "emerald",
  },
  {
    id: "EVIDENCE_READY",
    label: "EVIDENCE-READY",
    sub: "Audit-defensible",
    hint: "Recorded at the moment of occurrence.",
    meta: ["Evidence capsule", "Export-ready", "Defensible records"],
    tone: "amber",
  },
];

const INVALID_SOURCES = [
  { k: "Reports written later", note: "Post-fact narrative" },
  { k: "Opinions", note: "Human variance" },
  { k: "Assumptions", note: "No defensibility" },
];

const BEFORE_BULLETS = [
  "Signals existed",
  "Systems were running",
  "Explanations came after the fact",
];

function toneClasses(tone: BadgeDef["tone"]) {
  if (tone === "cyan") {
    return {
      border: "border-cyan/35 hover:border-cyan/60",
      text: "text-cyan/90",
      glow: "shadow-[0_0_28px_rgba(2,167,202,0.20)]",
      glowHover: "hover:shadow-[0_0_46px_rgba(2,167,202,0.26)]",
      chip: "bg-cyan/12",
      dot: "bg-cyan/70",
      ring: "ring-cyan/25",
      grad: "from-cyan/14 via-cyan/6 to-transparent",
    };
  }
  if (tone === "emerald") {
    return {
      border: "border-emerald-300/25 hover:border-emerald-300/55",
      text: "text-emerald-200/95",
      glow: "shadow-[0_0_28px_rgba(52,211,153,0.16)]",
      glowHover: "hover:shadow-[0_0_46px_rgba(52,211,153,0.22)]",
      chip: "bg-emerald-400/10",
      dot: "bg-emerald-300/70",
      ring: "ring-emerald-300/25",
      grad: "from-emerald-400/14 via-emerald-400/6 to-transparent",
    };
  }
  return {
    border: "border-amber-300/25 hover:border-amber-300/55",
    text: "text-amber-200/95",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.16)]",
    glowHover: "hover:shadow-[0_0_46px_rgba(245,158,11,0.22)]",
    chip: "bg-amber-400/10",
    dot: "bg-amber-300/70",
    ring: "ring-amber-300/25",
    grad: "from-amber-400/14 via-amber-400/6 to-transparent",
  };
}

/** Tooltip auto placement using bounds + anchor rect */
function computePlacement(
  anchor: DOMRect,
  tipW: number,
  tipH: number,
  bounds?: { width: number; height: number }
): Placement {
  const pad = 12;
  const vw = bounds?.width ?? window.innerWidth;
  const vh = bounds?.height ?? window.innerHeight;

  const topOk = anchor.top - tipH - pad > 0;
  const bottomOk = anchor.bottom + tipH + pad < vh;
  const leftOk = anchor.left - tipW - pad > 0;
  const rightOk = anchor.right + tipW + pad < vw;

  // Prefer bottom, then top, then right, then left — unless blocked
  if (bottomOk) return "bottom";
  if (topOk) return "top";
  if (rightOk) return "right";
  if (leftOk) return "left";
  return "bottom";
}

function placeStyle(
  anchor: DOMRect,
  placement: Placement,
  tipW: number,
  tipH: number,
  bounds?: { width: number; height: number }
): React.CSSProperties {
  const pad = 12;
  const vw = bounds?.width ?? window.innerWidth;
  const vh = bounds?.height ?? window.innerHeight;

  const centerX = anchor.left + anchor.width / 2;
  const centerY = anchor.top + anchor.height / 2;

  let left = 0;
  let top = 0;

  if (placement === "bottom") {
    left = centerX - tipW / 2;
    top = anchor.bottom + pad;
  } else if (placement === "top") {
    left = centerX - tipW / 2;
    top = anchor.top - tipH - pad;
  } else if (placement === "right") {
    left = anchor.right + pad;
    top = centerY - tipH / 2;
  } else {
    left = anchor.left - tipW - pad;
    top = centerY - tipH / 2;
  }

  // clamp into viewport
  left = clamp(left, 10, vw - tipW - 10);
  top = clamp(top, 10, vh - tipH - 10);

  return { left, top };
}

function useLongHover(active: boolean, ms: number) {
  const [long, setLong] = useState(false);
  useEffect(() => {
    if (!active) {
      setLong(false);
      return;
    }
    const id = window.setTimeout(() => setLong(true), ms);
    return () => window.clearTimeout(id);
  }, [active, ms]);
  return long;
}

/** Toast system (simple, local) */
type Toast = { id: string; msg: string; tone: "ok" | "warn" | "err" };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (msg: string, tone: Toast["tone"] = "ok") => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2400);
  };
  return { toasts, push };
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="absolute right-5 bottom-5 z-[99999] space-y-2">
      {toasts.map((t) => {
        const tone =
          t.tone === "ok"
            ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
            : t.tone === "warn"
            ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
            : "border-rose-300/25 bg-rose-400/10 text-rose-100";
        return (
          <div
            key={t.id}
            className={cx(
              "w-[320px] rounded-xl border px-3 py-2 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.55)]",
              tone
            )}
          >
            <div className="text-[12px] font-code tracking-[0.18em] opacity-80">SYSTEM</div>
            <div className="mt-1 text-[13px] font-main leading-snug">{t.msg}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Dark-glass surface wrapper (shared) */
function GlassSurface({
  className,
  children,
  sheen = true,
  noise = true,
  innerBorder = true,
  pulse = false,
  tone = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  sheen?: boolean;
  noise?: boolean;
  innerBorder?: boolean;
  pulse?: boolean;
  tone?: "neutral" | "focus" | "cyan";
}) {
  const toneCls =
    tone === "focus"
      ? "bg-black/45 border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
      : tone === "cyan"
      ? "bg-black/42 border-cyan/18 shadow-[0_34px_110px_rgba(0,0,0,0.46)]"
      : "bg-black/40 border-white/8 shadow-[0_34px_110px_rgba(0,0,0,0.46)]";

  return (
    <div className={cx("relative rounded-2xl border backdrop-blur-xl overflow-hidden", toneCls, className)}>
      {sheen && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              "radial-gradient(900px 520px at 22% 18%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 22%, transparent 60%)",
          }}
        />
      )}
      {innerBorder && (
        <div className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/10 opacity-[0.55]" />
      )}
      {noise && (
        <svg className="pointer-events-none absolute inset-0 opacity-[0.07]" width="100%" height="100%">
          <filter id="nf">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#nf)" />
        </svg>
      )}
      {pulse && <div className="pointer-events-none absolute inset-0 opacity-[0.16] scan-ambient" />}
      {children}
    </div>
  );
}

/** Soft divider line */
function SoftLine({ className }: { className?: string }) {
  return <div className={cx("h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent", className)} />;
}

/** Badge tooltip content */
function BadgeTooltip({
  badge,
  placement,
  style,
  locked,
  onClose,
}: {
  badge: BadgeDef;
  placement: Placement;
  style: React.CSSProperties;
  locked: boolean;
  onClose: () => void;
}) {
  const t = toneClasses(badge.tone);
  return (
    <div
      className={cx(
        "absolute z-[99990] w-[340px] rounded-2xl border px-4 py-3 backdrop-blur-xl",
        "bg-black/55 border-white/12 shadow-[0_0_80px_rgba(0,0,0,0.65)]"
      )}
      style={style}
      role="dialog"
      aria-label={`${badge.label} details`}
      data-tooltip="badge"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cx("text-[12px] font-code tracking-[0.26em] opacity-80", t.text)}>{badge.label}</div>
          <div className="mt-1 text-[14px] font-display font-semibold text-white/92">{badge.sub}</div>
          <div className="mt-2 text-[13px] font-main leading-snug text-white/78">{badge.hint}</div>
        </div>
        {locked && (
          <button
            type="button"
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-code tracking-[0.24em] text-white/70 hover:text-white"
            onClick={onClose}
          >
            CLOSE
          </button>
        )}
      </div>

      <SoftLine className="my-3 opacity-70" />

      <div className="grid grid-cols-1 gap-2">
        {badge.meta.map((m, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className={cx("mt-[7px] h-1.5 w-1.5 rounded-full", t.dot)} />
            <div className="text-[12px] font-code tracking-[0.10em] text-white/70">{m}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] font-code tracking-[0.26em] text-white/45">PRESS ENTER TO LOCK · ESC TO CLEAR</div>
        <div className={cx("h-6 rounded-full px-2 flex items-center text-[10px] font-code tracking-[0.22em]", t.chip)}>
          VERIFIED
        </div>
      </div>

      <div className={cx("pointer-events-none absolute inset-0 opacity-[0.12]", t.glow)} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.20]"
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.06), transparent 55%)` }}
      />

      {/* tooltip arrow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={cx(
            "absolute h-2.5 w-2.5 rotate-45 border border-white/12 bg-black/55",
            placement === "top"
              ? "left-1/2 bottom-[-6px] -translate-x-1/2 border-t-0 border-l-0"
              : placement === "bottom"
              ? "left-1/2 top-[-6px] -translate-x-1/2 border-b-0 border-r-0"
              : placement === "left"
              ? "right-[-6px] top-1/2 -translate-y-1/2 border-b-0 border-l-0"
              : "left-[-6px] top-1/2 -translate-y-1/2 border-t-0 border-r-0"
          )}
        />
      </div>
    </div>
  );
}

/** Evidence overlay (optional) */
function EvidenceOverlay({
  show,
  reducedMotion,
}: {
  show: boolean;
  reducedMotion: boolean;
}) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[20]">
      <div className={cx("absolute inset-0 opacity-[0.10]", !reducedMotion && "scan-strong")} />
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          background:
            "radial-gradient(1000px 600px at 50% 35%, rgba(2,167,202,0.11) 0%, rgba(2,167,202,0.05) 28%, transparent 60%)",
        }}
      />
      <div className="absolute left-6 top-6 rounded-xl border border-cyan/20 bg-cyan/8 px-3 py-2 backdrop-blur-md">
        <div className="text-[10px] font-code tracking-[0.26em] text-cyan/85">EVIDENCE OVERLAY</div>
        <div className="mt-1 text-[12px] font-main text-white/70">Markers indicate defensible capture points.</div>
      </div>

      {/* crosshair */}
      <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]">
        <div className="absolute inset-0 rounded-full border border-white/12" />
        <div className="absolute inset-[14px] rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/10" />
      </div>
    </div>
  );
}

/** Small affordance strip */
function AffordanceStrip({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <div className="text-[10px] font-code tracking-[0.26em] text-white/45">{left}</div>
      <div className="text-[10px] font-code tracking-[0.26em] text-white/45">{right}</div>
    </div>
  );
}

export const Slide04: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const { toasts, push } = useToasts();
  const wowEvidence = WOW_DEMO && WOW_EVIDENCE_IMPACT;
  const wowProofLock = WOW_DEMO && WOW_PROOF_LOCK;

  // Global focus + interactive state
  const [activeAct, setActiveAct] = useState<ActId | null>(null);
  const [lockFocus, setLockFocus] = useState(false);

  // Badge tooltip
  const [hoverBadge, setHoverBadge] = useState<BadgeId | null>(null);
  const [lockedBadge, setLockedBadge] = useState<BadgeId | null>(null);
  const [tipPlacement, setTipPlacement] = useState<Placement>("bottom");
  const [tipStyle, setTipStyle] = useState<React.CSSProperties>({ left: -9999, top: -9999 });

  // Evidence overlay toggle
  const [evidenceOverlay, setEvidenceOverlay] = useState(false);
  const [evidenceFlash, setEvidenceFlash] = useState(false);
  const [proofCommitPulse, setProofCommitPulse] = useState(false);
  const proofPulseTimeout = useStableTimeout();

  // Proximity glow
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [prox, setProx] = useState({ x: 0.5, y: 0.35, a: 0 }); // normalized + intensity
  const proxTarget = useRef(prox);

  // Narrative pulse
  const [narrativePulse, setNarrativePulse] = useState(false);

  // Long-hover captions
  const act2Hover = activeAct === "ACT_II" || lockFocus;
  const act3Hover = activeAct === "ACT_III";
  const act2Long = useLongHover(act2Hover && !reducedMotion, 800);
  const act3Long = useLongHover(act3Hover && !reducedMotion, 800);

  // compute effective focus mode
  const focusOn: ActId | null = lockFocus ? "ACT_II" : activeAct;

  // Idle narrative pulse every ~14s
  useInterval(
    () => {
      if (reducedMotion) return;
      if (lockFocus) return;
      // only pulse if user isn't hovering anything
      if (activeAct != null) return;
      setNarrativePulse(true);
      window.setTimeout(() => setNarrativePulse(false), 900);
    },
    reducedMotion ? null : 14000
  );

  // Keyboard controls: ESC clears lock and tooltip; "E" toggles overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F1" || e.key === "F2" || e.key === "F3" || e.key === "F4") return;
      if (e.key === "Escape") {
        setLockFocus(false);
        setActiveAct(null);
        setLockedBadge(null);
        setHoverBadge(null);
      }
      if (e.key.toLowerCase() === "e" && (e.ctrlKey || e.metaKey)) {
        // Ctrl/Cmd+E toggles evidence overlay
        e.preventDefault();
        setEvidenceOverlay((v) => !v);
        push("Evidence overlay toggled.", "ok");
      }
      if (e.key === "Enter") {
        // If a badge is hovered, toggle lock
        if (hoverBadge) {
          setLockedBadge((prev) => (prev === hoverBadge ? null : hoverBadge));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hoverBadge, push]);

  // Proximity glow: track mouse, smooth with RAF
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (ev: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (ev.clientX - r.left) / r.width;
      const ny = (ev.clientY - r.top) / r.height;
      const dx = nx - 0.5;
      const dy = ny - 0.35;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const a = clamp(1 - dist * 1.35, 0, 1);

      proxTarget.current = { x: clamp(nx, 0, 1), y: clamp(ny, 0, 1), a };
    };

    const onLeave = () => {
      proxTarget.current = { x: 0.5, y: 0.35, a: 0 };
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useRafLoop(!reducedMotion, () => {
    setProx((p) => {
      const t = proxTarget.current;
      const nx = lerp(p.x, t.x, 0.08);
      const ny = lerp(p.y, t.y, 0.08);
      const na = lerp(p.a, t.a, 0.08);
      return { x: nx, y: ny, a: na };
    });
  });

  // Badge tooltip position update (on hover or lock)
  useLayoutEffect(() => {
    const bid = lockedBadge ?? hoverBadge;
    if (!bid) return;

    const btn = document.querySelector<HTMLButtonElement>(`[data-badge="${bid}"]`);
    if (!btn) return;

    const anchor = btn.getBoundingClientRect();
    const container = containerRef.current;
    const tipW = 340;
    const tipH = 220;

    if (container) {
      const bounds = container.getBoundingClientRect();
      const relAnchor = new DOMRect(
        anchor.left - bounds.left,
        anchor.top - bounds.top,
        anchor.width,
        anchor.height
      );
      const placement = computePlacement(relAnchor, tipW, tipH, { width: bounds.width, height: bounds.height });
      const style = placeStyle(relAnchor, placement, tipW, tipH, { width: bounds.width, height: bounds.height });
      setTipPlacement(placement);
      setTipStyle(style);
      return;
    }

    const placement = computePlacement(anchor, tipW, tipH);
    const style = placeStyle(anchor, placement, tipW, tipH);

    setTipPlacement(placement);
    setTipStyle(style);
  }, [hoverBadge, lockedBadge]);

  // Helper: dims for focus
  const DIM_OTHER =
    focusOn == null
      ? "opacity-100"
      : "opacity-[0.14] blur-[0.7px] saturate-0";

  const DIM_SELF =
    focusOn == null
      ? "opacity-100"
      : "opacity-100";

  const mainBgStyle: React.CSSProperties = useMemo(() => {
    const x = (prox.x * 100).toFixed(2);
    const y = (prox.y * 100).toFixed(2);
    const a = prox.a;

    return {
      background:
        `radial-gradient(900px 560px at ${x}% ${y}%, rgba(2,167,202,${0.10 + 0.12 * a}) 0%, rgba(2,167,202,${0.04 + 0.06 * a}) 22%, transparent 60%),` +
        `radial-gradient(1200px 720px at 50% 35%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 22%, transparent 58%),` +
        `linear-gradient(180deg, rgba(7,10,15,1) 0%, rgba(7,10,15,0.98) 100%)`,
    };
  }, [prox]);

  const badgeTooltipBadge = useMemo(() => {
    const id = lockedBadge ?? hoverBadge;
    if (!id) return null;
    return BADGES.find((b) => b.id === id) ?? null;
  }, [hoverBadge, lockedBadge]);

  // click outside tooltip closes lock (avoid accidental close inside)
  useEffect(() => {
    if (!lockedBadge) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest?.('[data-tooltip="badge"]')) return;
      if (t.closest?.("[data-badge]")) return;
      setLockedBadge(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [lockedBadge]);

  const onBadgeEnter = (id: BadgeId) => {
    setHoverBadge(id);
    emitTourEvent("evidence:hover", { badge: id });
  };
  const onBadgeLeave = (id: BadgeId) => {
    // If locked, keep it
    if (lockedBadge === id) return;
    setHoverBadge((prev) => (prev === id ? null : prev));
  };

  // Evidence token click (simulate)
  const onEvidenceTokenClick = async () => {
    const token = `EV-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.random()
      .toString(16)
      .slice(2, 6)
      .toUpperCase()}`;
    const ok = await copyText(token);
    if (wowEvidence) {
      setEvidenceFlash(true);
      window.setTimeout(() => setEvidenceFlash(false), 560);
    }
    if (wowProofLock) {
      setProofCommitPulse(true);
      proofPulseTimeout.schedule(() => setProofCommitPulse(false), 640);
    }
    emitTourEvent("evidence:copied", { tokenCopied: ok });
    push(ok ? `Evidence token copied: ${token}` : `Could not copy token: ${token}`, ok ? "ok" : "warn");
  };

  const onBadgeLockToggle = (id: BadgeId) => {
    setLockedBadge((prev) => {
      const next = prev === id ? null : id;
      if (next) emitTourEvent("evidence:locked", { badge: id });
      return next;
    });
  };

  // Act container handlers
  const setAct = (id: ActId | null) => {
    if (lockFocus) return;
    setActiveAct(id);
  };

  const toggleLockFocus = () => {
    // Lock always centers on Act II (the question)
    setLockFocus((v) => !v);
    setActiveAct(null);
    if (wowProofLock) {
      setProofCommitPulse(true);
      proofPulseTimeout.schedule(() => setProofCommitPulse(false), 640);
    }
  };

  const selectedEvidence = hoverBadge ?? lockedBadge;

  return (
    <div data-testid="slide-04-root" className="w-full h-full">
      <SlideContainer>
      <style>{`
        /* ===========================================================
           NASA SYSTEM — Motion + Glass + Scanlines + Noise
           =========================================================== */

        @keyframes scanAmbient {
          0% { transform: translateY(-14px); opacity: 0.0; }
          10% { opacity: 0.15; }
          50% { opacity: 0.18; }
          100% { transform: translateY(14px); opacity: 0.0; }
        }
        .scan-ambient {
          background: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.06) 0px,
            rgba(255,255,255,0.06) 1px,
            transparent 1px,
            transparent 6px
          );
          animation: scanAmbient 6.5s linear infinite;
        }

        @keyframes scanStrong {
          0% { transform: translateY(-18px); opacity: 0.0; }
          20% { opacity: 0.22; }
          50% { opacity: 0.26; }
          100% { transform: translateY(18px); opacity: 0.0; }
        }
        .scan-strong {
          background: repeating-linear-gradient(
            180deg,
            rgba(2,167,202,0.10) 0px,
            rgba(2,167,202,0.10) 1px,
            transparent 1px,
            transparent 7px
          );
          animation: scanStrong 5.2s linear infinite;
        }

        @keyframes badgeBreath {
          0%, 100% { filter: brightness(1); transform: translateY(0px); }
          50% { filter: brightness(1.08); transform: translateY(-1px); }
        }
        .badge-breath {
          animation: badgeBreath 7.2s ease-in-out infinite;
        }

        @keyframes strikeDraw {
          0% { transform: scaleX(0); opacity: 0.0; }
          35% { opacity: 0.7; }
          100% { transform: scaleX(1); opacity: 0.9; }
        }
        .strike-draw {
          transform-origin: left;
          animation: strikeDraw 360ms ease-out both;
        }

        @keyframes microJitter {
          0% { transform: translateX(0px); }
          20% { transform: translateX(-0.5px); }
          40% { transform: translateX(0.6px); }
          60% { transform: translateX(-0.4px); }
          80% { transform: translateX(0.4px); }
          100% { transform: translateX(0px); }
        }
        .micro-jitter {
          animation: microJitter 240ms ease-out;
        }

        @keyframes narrativePulse {
          0% { box-shadow: 0 0 0 rgba(2,167,202,0.0); }
          50% { box-shadow: 0 0 60px rgba(2,167,202,0.12); }
          100% { box-shadow: 0 0 0 rgba(2,167,202,0.0); }
        }
        .narrative-pulse {
          animation: narrativePulse 900ms ease-out;
        }

        @keyframes wowEvidencePulse {
          0% { opacity: 0; transform: scale(0.985); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1); }
        }
        .wow-evidence-pulse {
          animation: wowEvidencePulse 540ms cubic-bezier(.2,.8,.2,1);
        }

        @keyframes proofCommitCeremony {
          0% { opacity: 0; transform: scale(0.985); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(1); }
        }
        .proof-commit-pulse {
          animation: proofCommitCeremony 640ms cubic-bezier(.2,.8,.2,1);
        }

        @keyframes softGlowSweep {
          0% { transform: translateX(-40%); opacity: 0.0; }
          20% { opacity: 0.10; }
          60% { opacity: 0.10; }
          100% { transform: translateX(40%); opacity: 0.0; }
        }
        .soft-sweep::after {
          content: "";
          position: absolute;
          inset: -20%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transform: translateX(-40%);
          animation: softGlowSweep 8.6s ease-in-out infinite;
          pointer-events: none;
        }

        /* Uncertainty overlay (Act I hover) */
        @keyframes uncertainty {
          0% { opacity: 0.0; transform: translateY(0px); }
          50% { opacity: 0.16; transform: translateY(1px); }
          100% { opacity: 0.0; transform: translateY(0px); }
        }
        .uncertainty {
          background: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.06) 0px,
            rgba(255,255,255,0.06) 1px,
            transparent 1px,
            transparent 10px
          );
          animation: uncertainty 1.8s ease-in-out infinite;
        }

        /* Nice keyboard focus that doesn't look ugly */
        .a11y-focus:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(2,167,202,0.28), 0 0 0 6px rgba(2,167,202,0.10);
        }

        /* Reduced motion overrides */
        @media (prefers-reduced-motion: reduce) {
          .scan-ambient, .scan-strong, .badge-breath, .soft-sweep::after, .uncertainty {
            animation: none !important;
          }
        }
      `}</style>

      {/* Background master - ADDED pointer-events-none */}
      <div className="absolute inset-0 pointer-events-none" style={mainBgStyle} />

      {/* Ambient vignette + subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.80]"
        style={{
          background:
            "radial-gradient(1400px 900px at 50% 35%, transparent 0%, rgba(0,0,0,0.40) 60%, rgba(0,0,0,0.70) 100%)",
        }}
      />
      <svg className="pointer-events-none absolute inset-0 opacity-[0.06]" width="100%" height="100%">
        <filter id="bgNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bgNoise)" />
      </svg>

      <Header title="PROPUESTA DE VALOR" breadcrumb="SOLUCIÓN" slideNum={5} />

      {/* Layout wrapper */}
      <div ref={containerRef} className={`relative h-full w-full px-16 pt-4 pb-10 ${wowEvidence ? "wow-s04-evidence" : ""}`}>
        {wowProofLock && selectedEvidence && (
          <div
            className="pointer-events-none absolute inset-0 z-[26]"
            style={{
              background: "radial-gradient(920px 640px at 74% 42%, rgba(0,0,0,0.02), rgba(0,0,0,0.44) 72%)",
            }}
          />
        )}
        {/* Top header line (right tag) */}
        <div className="absolute right-16 top-[92px] z-[5] flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan/60 shadow-[0_0_16px_rgba(2,167,202,0.20)]" />
          <div className="text-[11px] font-code tracking-[0.32em] text-white/60">AUDIT-PROOF REALITY</div>
        </div>

        {/* MAIN GRID */}
        <div className="relative mt-[118px] grid grid-cols-12 gap-6 h-[792px]">
          {/* Act I */}
          <div
            className={cx("col-span-4 transition-all duration-200", focusOn && focusOn !== "ACT_I" ? DIM_OTHER : DIM_SELF)}
            onMouseEnter={() => setAct("ACT_I")}
            onMouseLeave={() => setAct(null)}
          >
            <GlassSurface
              className={cx("h-full p-10 soft-sweep", focusOn === "ACT_I" && "shadow-[0_0_70px_rgba(255,255,255,0.06)]")}
              tone="neutral"
              pulse={!reducedMotion}
            >
              <div className="relative z-[2]">
                <div className="text-[12px] font-code tracking-[0.28em] text-white/55">BEFORE</div>
                <div className={cx("mt-2 text-[24px] font-display font-semibold text-white/92", GLOW.WHITE_A)}>
                  OPERATION AS A BLACK BOX
                </div>

                <div className="mt-5 space-y-3">
                  {BEFORE_BULLETS.map((b, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/35" />
                      <div className="text-[14px] font-main leading-snug text-white/72">{b}</div>
                    </div>
                  ))}
                </div>

                <SoftLine className="my-6 opacity-70" />

                <div className="text-[12px] font-main text-white/60">
                  Data existed, but truth was fragmented.
                </div>

                <AffordanceStrip left="HOVER: reveal uncertainty" right="TAB: move focus" />
              </div>

              {/* Uncertainty layer on hover */}
              <div
                className={cx(
                  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200",
                  activeAct === "ACT_I" && !reducedMotion && "opacity-100"
                )}
              >
                <div className="absolute inset-0 uncertainty" />
                <div
                  className="absolute inset-0 opacity-[0.18]"
                  style={{
                    background:
                      "radial-gradient(700px 420px at 40% 22%, rgba(255,255,255,0.12) 0%, transparent 60%)",
                  }}
                />
              </div>
            </GlassSurface>
          </div>

          {/* Act II (core) */}
          <div
            className={cx("col-span-4 transition-all duration-200", focusOn && focusOn !== "ACT_II" ? DIM_OTHER : DIM_SELF)}
            onMouseEnter={() => setAct("ACT_II")}
            onMouseLeave={() => setAct(null)}
          >
            <GlassSurface
              className={cx(
                "h-full p-14 relative",
                "border-white/14",
                narrativePulse && "narrative-pulse",
                (activeAct === "ACT_II" || lockFocus) && "shadow-[0_0_90px_rgba(2,167,202,0.14)]"
              )}
              tone="focus"
              pulse={!reducedMotion}
            >
              <div className="relative z-[3]">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-code tracking-[0.30em] text-white/65">THE QUESTION</div>

                  <button
                    type="button"
                    className={cx(
                      "a11y-focus rounded-xl border px-3 py-2 text-[10px] font-code tracking-[0.26em] transition-all",
                      lockFocus
                        ? "border-cyan/40 bg-cyan/10 text-cyan/85 shadow-[0_0_24px_rgba(2,167,202,0.16)]"
                        : "border-white/10 bg-white/5 text-white/55 hover:text-white/80 hover:border-white/18"
                    )}
                    onClick={toggleLockFocus}
                    aria-label="Toggle focus lock"
                  >
                    {lockFocus ? "FOCUS LOCKED" : "LOCK FOCUS"}
                  </button>
                </div>

                <div className={cx("mt-6 text-[30px] font-display font-semibold leading-tight text-white/92", GLOW.WHITE_B)}>
                  Si me preguntas cómo sé esto…
                </div>

                <div className="mt-6">
                  <div className="text-[12px] font-code tracking-[0.26em] text-white/50">THE WRONG SOURCES</div>

                  <div className="mt-3 space-y-3">
                    {INVALID_SOURCES.map((s, idx) => {
                      const hovering = activeAct === "ACT_II" && !lockFocus;
                      return (
                        <div
                          key={idx}
                          className={cx(
                            "relative rounded-xl border border-white/10 bg-white/3 px-4 py-3 backdrop-blur-md",
                            "transition-all duration-200"
                          )}
                          onMouseEnter={() => setAct("ACT_II")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[13px] font-main text-white/70">{s.k}</div>
                              <div className="mt-1 text-[11px] font-code tracking-[0.16em] text-white/45">{s.note}</div>
                            </div>

                            <div className="shrink-0 text-[10px] font-code tracking-[0.28em] text-rose-200/70">
                              INVALID
                            </div>
                          </div>

                          {/* strike-through on hover */}
                          <div
                            className={cx(
                              "pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-rose-300/30 opacity-0",
                              hovering && "opacity-100 strike-draw"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className={cx(
                      "mt-6 text-[12px] font-main text-white/62",
                      (activeAct === "ACT_II" || lockFocus) && "micro-jitter"
                    )}
                  >
                    None of them are defensible.
                  </div>

                  <AffordanceStrip
                    left="HOVER: focus · CLICK: lock"
                    right="ESC: clear · Ctrl/Cmd+E: evidence overlay"
                  />

                  {act2Long && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/4 px-4 py-3">
                      <div className="text-[10px] font-code tracking-[0.30em] text-white/55">EXECUTIVE REALITY</div>
                      <div className="mt-2 text-[13px] font-main text-white/70">
                        This is where systems fail — not technically, but defensibly.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Focus bloom */}
              <div
                className={cx(
                  "pointer-events-none absolute inset-0 opacity-[0.18]",
                  (activeAct === "ACT_II" || lockFocus) ? "scan-strong" : "scan-ambient"
                )}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.22]"
                style={{
                  background:
                    "radial-gradient(900px 620px at 50% 30%, rgba(2,167,202,0.14) 0%, rgba(2,167,202,0.06) 26%, transparent 60%)",
                }}
              />
            </GlassSurface>
          </div>

          {/* Act III */}
          <div
            className={cx("col-span-4 transition-all duration-200", focusOn && focusOn !== "ACT_III" ? DIM_OTHER : DIM_SELF)}
            onMouseEnter={() => setAct("ACT_III")}
            onMouseLeave={() => setAct(null)}
          >
            <GlassSurface
              className={cx("h-full p-10 relative soft-sweep", activeAct === "ACT_III" && "shadow-[0_0_90px_rgba(2,167,202,0.12)]")}
              tone="cyan"
              pulse={!reducedMotion}
            >
              <div className="relative z-[3]">
                <div className="text-[12px] font-code tracking-[0.30em] text-white/65">THE SHIFT</div>

                <div className={cx("mt-3 text-[24px] font-display font-semibold leading-snug text-white/92", GLOW.CYAN_B)}>
                  — Porque lo vi cuando pasó.
                </div>

                <div className="mt-5 text-[12px] font-main text-white/66">
                  Operational truth, generated at the moment of occurrence.
                </div>

                <SoftLine className="my-6 opacity-70" />

                <div className="flex flex-wrap gap-3">
                  {BADGES.map((b) => {
                    const t = toneClasses(b.tone);
                    const isLocked = lockedBadge === b.id;
                    const isHovering = hoverBadge === b.id;
                    const on = isLocked || isHovering || activeAct === "ACT_III";

                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={cx(
                          "a11y-focus group relative rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                          "bg-black/28 backdrop-blur-md",
                          wowEvidence && "hover:-translate-y-[2px] hover:scale-[1.01]",
                          t.border,
                          t.glow,
                          t.glowHover,
                          on && "badge-breath",
                          wowProofLock && on && "shadow-[0_0_42px_rgba(2,167,202,0.28)]",
                          isLocked && "ring-1 " + t.ring
                        )}
                        data-badge={b.id}
                        onMouseEnter={() => onBadgeEnter(b.id)}
                        onMouseLeave={() => onBadgeLeave(b.id)}
                        onClick={() => onBadgeLockToggle(b.id)}
                        aria-label={`${b.label} badge`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className={cx("text-[11px] font-code tracking-[0.28em]", t.text)}>{b.label}</div>
                            <div className="mt-1 text-[13px] font-display font-semibold text-white/92">{b.sub}</div>
                          </div>
                          <div className={cx("h-8 w-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center")}>
                            <div className={cx("h-2 w-2 rounded-full", t.dot)} />
                          </div>
                        </div>

                        <div
                          className="pointer-events-none absolute inset-0 opacity-[0.20]"
                          style={{
                            background: `radial-gradient(220px 140px at 30% 20%, rgba(255,255,255,0.10) 0%, transparent 62%)`,
                          }}
                        />
                        <div className={cx("pointer-events-none absolute inset-0 opacity-[0.12]", t.glow)} />
                      </button>
                    );
                  })}
                </div>

                <AffordanceStrip
                  left="HOVER: details · ENTER: lock tooltip"
                  right="CLICK badge: lock · ESC: clear"
                />

                {/* Evidence token row */}
                <div className="mt-7 rounded-xl border border-white/10 bg-white/4 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-code tracking-[0.30em] text-white/55">EVIDENCE TOKEN</div>
                      <div className="mt-1 text-[12px] font-code tracking-[0.18em] text-white/70">
                        Click to copy a defensible reference
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="s04-copy-token"
                      className="a11y-focus rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-code tracking-[0.26em] text-white/70 hover:text-white"
                      onClick={onEvidenceTokenClick}
                    >
                      COPY
                    </button>
                  </div>
                </div>

                {act3Long && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/4 px-4 py-3">
                    <div className="text-[10px] font-code tracking-[0.30em] text-white/55">SYSTEM CONSEQUENCE</div>
                    <div className="mt-2 text-[13px] font-main text-white/70">
                      This is where evidence begins — automatically, continuously, defensibly.
                    </div>
                  </div>
                )}
              </div>

              {/* Badge halo on hover */}
              <div
                className={cx(
                  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200",
                  activeAct === "ACT_III" && "opacity-100"
                )}
              >
                <div className={cx("absolute inset-0", !reducedMotion ? "scan-ambient" : "")} />
                <div
                  className="absolute inset-0 opacity-[0.20]"
                  style={{
                    background:
                      "radial-gradient(900px 620px at 62% 34%, rgba(2,167,202,0.12) 0%, rgba(2,167,202,0.05) 28%, transparent 60%)",
                  }}
                />
              </div>
            </GlassSurface>
          </div>

          {/* Evidence overlay (on top of grid) */}
          <EvidenceOverlay show={evidenceOverlay} reducedMotion={reducedMotion} />

          {/* Soft global dim when focus lock on (acts behind feel distant) */}
          {(lockFocus || lockedBadge) && (
            <div
              className="absolute inset-0 z-[50] pointer-events-none"
              style={{
                background:
                  "radial-gradient(1200px 820px at 50% 35%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.48) 55%, rgba(0,0,0,0.68) 100%)",
                opacity: 1,
              }}
            />
          )}
        </div>

        {/* STATEMENT FINAL - ADDED pointer-events-none */}
        <div className="mt-6 relative z-[10] pointer-events-none">
          <div className="mx-auto max-w-[1100px] text-center">
            <div className="text-[16px] font-main leading-relaxed text-white/65">
              Y sé que es así,
              <br />
              porque así es como se accede a la operación real.
            </div>
            <div className="mt-3 text-[10px] font-code tracking-[0.28em] text-white/38">
              Operational truth, in real time · No reports written after the fact
            </div>
          </div>

          {/* Micro controls row - ADDED pointer-events-auto */}
          <div className="mt-4 flex items-center justify-center gap-3 pointer-events-auto">
            <button
              type="button"
              className={cx(
                "a11y-focus rounded-xl border px-3 py-2 text-[10px] font-code tracking-[0.26em] transition-all",
                evidenceOverlay
                  ? "border-cyan/35 bg-cyan/10 text-cyan/85 shadow-[0_0_22px_rgba(2,167,202,0.16)]"
                  : "border-white/10 bg-white/5 text-white/55 hover:text-white/80 hover:border-white/18"
              )}
                    onClick={() => setEvidenceOverlay((v) => !v)}
                  >
              {evidenceOverlay ? "EVIDENCE OVERLAY: ON" : "EVIDENCE OVERLAY: OFF"}
            </button>

            <button
              type="button"
              className={cx(
                "a11y-focus rounded-xl border px-3 py-2 text-[10px] font-code tracking-[0.26em] transition-all",
                lockFocus
                  ? "border-cyan/35 bg-cyan/10 text-cyan/85 shadow-[0_0_22px_rgba(2,167,202,0.16)]"
                  : "border-white/10 bg-white/5 text-white/55 hover:text-white/80 hover:border-white/18"
              )}
              onClick={toggleLockFocus}
            >
              {lockFocus ? "FOCUS MODE: LOCKED" : "FOCUS MODE: AUTO"}
            </button>

            <button
              type="button"
              className="a11y-focus rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-code tracking-[0.26em] text-white/55 hover:text-white/80 hover:border-white/18"
              onClick={() => {
                setActiveAct(null);
                setLockFocus(false);
                setLockedBadge(null);
                setHoverBadge(null);
                push("Cleared focus and locks.", "ok");
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      {wowEvidence && evidenceFlash && (
        <div className="pointer-events-none absolute inset-0 z-[60] wow-evidence-pulse">
          <div className="absolute inset-[18%] rounded-[28px] border border-cyan/35 shadow-[0_0_80px_rgba(2,167,202,0.22)]" />
          <div className="absolute inset-0 opacity-[0.16]" style={{ background: "radial-gradient(900px 500px at 50% 50%, rgba(2,167,202,0.22), transparent 70%)" }} />
        </div>
      )}
      {wowProofLock && proofCommitPulse && (
        <div className="pointer-events-none absolute inset-0 z-[61] proof-commit-pulse">
          <div className="absolute inset-[20%] rounded-[24px] border border-emerald-300/30 shadow-[0_0_70px_rgba(52,211,153,0.22)]" />
          <div className="absolute inset-0 opacity-[0.18]" style={{ background: "radial-gradient(700px 360px at 50% 58%, rgba(52,211,153,0.24), transparent 72%)" }} />
        </div>
      )}
      {/* Badge tooltip (hover or locked) */}
      {badgeTooltipBadge && (
        <BadgeTooltip
          badge={badgeTooltipBadge}
          placement={tipPlacement}
          style={tipStyle}
          locked={!!lockedBadge}
          onClose={() => setLockedBadge(null)}
        />
      )}
      </div>

      {/* Toasts */}
      <ToastStack toasts={toasts} />

      {/* NavArea - WRAPPED in z-100 */}
        <div className="relative z-[100] pointer-events-auto">
          <NavArea prev={prevSlide} next={nextSlide} />
        </div>
      </SlideContainer>
    </div>
  );
};
