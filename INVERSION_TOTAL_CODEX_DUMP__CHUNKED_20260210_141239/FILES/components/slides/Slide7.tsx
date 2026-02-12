
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SlideContainer, Header, NavArea } from '../SlideRenderer';

// =====================================================
// FINAL v1.2.2 — Requested changes only (DecisionCard UI)
// - Open Report: NO BOX + bigger + glow
// - Auto-generated: swapped position + glow
// - Thumbnails: controlled glow
// - Background dim when menu open (almost disappear)
// =====================================================

// --- tiny helpers ---
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// --- motion preferences (accessibility) ---
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    // Safari fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const add = (mq as any).addEventListener ? 'addEventListener' : 'addListener';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const remove = (mq as any).removeEventListener ? 'removeEventListener' : 'removeListener';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mq as any)[add]('change', onChange);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => (mq as any)[remove]('change', onChange);
  }, []);
  return reduced;
};

// --- animated number (smooth “confidence update”, not arcade-y) ---
const useAnimatedNumber = (target: number, opts?: { durationMs?: number; disabled?: boolean }) => {
  const durationMs = opts?.durationMs ?? 520;
  const disabled = !!opts?.disabled;
  const [val, setVal] = useState(target);

  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  const t0Ref = useRef<number>(0);

  useEffect(() => {
    if (disabled) {
      setVal(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    t0Ref.current = performance.now();

    const tick = (now: number) => {
      const t = clamp((now - t0Ref.current) / durationMs, 0, 1);
      const e = easeOutCubic(t);
      setVal(lerp(from, to, e));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        fromRef.current = to;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [target, durationMs, disabled]);

  return val;
};

// --- deterministic spark heights (no Math.random jitter) ---
const hash32 = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const prng = (seed: number) => {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    return x / 4294967296;
  };
};

// =====================================================
// Controlled Glow System (Tier A/B/C) — user-approved
// =====================================================
const GLOW = {
  CYAN_A: 'drop-shadow-[0_0_10px_rgba(0,240,255,0.35)]',
  CYAN_B: 'drop-shadow-[0_0_6px_rgba(0,240,255,0.22)]',
  CYAN_C: 'drop-shadow-[0_0_3px_rgba(0,240,255,0.12)]',

  GOLD_B: 'drop-shadow-[0_0_6px_rgba(171,123,38,0.22)]',
  GOLD_C: 'drop-shadow-[0_0_3px_rgba(171,123,38,0.12)]',

  WHITE_C: 'drop-shadow-[0_0_3px_rgba(255,255,255,0.10)]',

  RED_A: 'drop-shadow-[0_0_10px_rgba(239,68,68,0.30)]',
  RED_B: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.20)]',
  AMBER_B: 'drop-shadow-[0_0_6px_rgba(250,204,21,0.18)]',
} as const;

// =====================================================
// “Interactive affordance strip” — one constant, apply everywhere
// =====================================================
const AFFORDANCE_STRIP =
  'relative cursor-pointer select-none ' +
  "before:content-[''] before:absolute before:left-4 before:bottom-3 " +
  'before:w-10 before:h-[2px] before:bg-cyan/40 before:opacity-25 ' +
  'before:rounded-full before:transition-all before:duration-300 ' +
  'hover:before:w-16 hover:before:opacity-80 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/35 focus-visible:ring-offset-0';

const AFFORDANCE_STRIP_SOFT = AFFORDANCE_STRIP + ' active:scale-[0.99] transition-transform duration-150';

// --- ICONS ---
const Icons = {
  Activity: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  Server: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
      />
    </svg>
  ),
  Chevron: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M7 10l5 5 5-5" />
    </svg>
  ),
  File: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6"
      />
    </svg>
  ),
  Table: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M3 3h18v18H3V3zm0 6h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  Wrench: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M14.7 6.3a5 5 0 01-6.4 6.4l-4.6 4.6a2 2 0 102.8 2.8l4.6-4.6a5 5 0 006.4-6.4l-3 3-2.8-2.8 3-3z"
      />
    </svg>
  ),
};

// --- DATA MODEL ---
type InputId = 'DE' | 'DT' | 'DC' | 'DM' | 'DO';
type InputItem = {
  id: InputId;
  label: string;
  sub: string;
  val: string;
  status: 'GOOD' | 'WARN' | 'CRIT';
  color: string;
  bar: string;
};

const INPUT_STREAMS: InputItem[] = [
  { id: 'DE', label: 'ELÉCTRICA', sub: 'STABILITY', val: '92%', status: 'GOOD', color: 'text-green-400', bar: 'bg-green-400' },
  { id: 'DT', label: 'TÉRMICA', sub: 'HEAT DISSIPATION', val: '88%', status: 'GOOD', color: 'text-green-400', bar: 'bg-green-400' },
  { id: 'DC', label: 'CONTROL', sub: 'LOGIC & SENSORS', val: '74%', status: 'WARN', color: 'text-yellow-300', bar: 'bg-yellow-300' },
  { id: 'DM', label: 'MECÁNICA', sub: 'PHYSICAL INTEGRITY', val: '45%', status: 'CRIT', color: 'text-red-500', bar: 'bg-red-500' },
  { id: 'DO', label: 'OPERACIONAL', sub: 'USAGE HISTORY', val: '95%', status: 'GOOD', color: 'text-green-400', bar: 'bg-green-400' },
];

const STATUS_BADGE: Record<InputItem['status'], { label: string; cls: string }> = {
  GOOD: { label: 'GOOD', cls: cx('text-green-300 bg-green-500/10 border-green-400/20', GLOW.WHITE_C) },
  WARN: { label: 'WATCH', cls: cx('text-yellow-200 bg-yellow-500/10 border-yellow-400/20', GLOW.AMBER_B) },
  CRIT: { label: 'CRIT', cls: cx('text-red-200 bg-red-500/10 border-red-400/20', GLOW.RED_B) },
};

// =====================================================
// TelemetryRow
// =====================================================
const TelemetryRow = ({
  item,
  active,
  onSelect,
  onClear,
  sparkHeights,
}: {
  item: InputItem;
  active: InputId | null;
  onSelect: (id: InputId) => void;
  onClear: () => void;
  sparkHeights: number[];
}) => {
  const isDimmed = !!active && active !== item.id;
  const isSelected = active === item.id;
  const badge = STATUS_BADGE[item.status];

  return (
    <button
      type="button"
      className={cx(
        'group relative w-full text-left flex items-center justify-between px-5 py-4',
        'border-b border-white/5 transition-all duration-300',
        'bg-transparent hover:bg-white/4',
        isDimmed && 'opacity-35',
        isSelected && 'bg-cyan/7 border-l-[3px] border-l-cyan/80',
        !isSelected && 'border-l-[3px] border-l-transparent',
        AFFORDANCE_STRIP_SOFT
      )}
      onMouseEnter={() => onSelect(item.id)}
      onMouseLeave={onClear}
      onFocus={() => onSelect(item.id)}
      onBlur={onClear}
      aria-label={`Input ${item.id}: ${item.label}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 flex items-center justify-center">
          <div className={cx('font-code text-sm font-black tracking-widest', item.color, isSelected && GLOW.WHITE_C)}>{item.id}</div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className={cx('font-display font-bold text-[1.05rem] tracking-wide text-white transition-all', isSelected && cx('text-cyan', GLOW.CYAN_B))}>
              {item.label}
            </div>

            <span className={cx('inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-code tracking-[0.20em]', badge.cls)}>
              <span className="opacity-80">●</span> {badge.label}
            </span>
          </div>

          <div className="font-code text-[11px] text-gray-500 tracking-[0.22em] uppercase mt-1 truncate">
            {item.sub}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex gap-[3px] items-end h-6 w-20 opacity-45 group-hover:opacity-95 transition-opacity">
          {sparkHeights.map((h, i) => (
            <div
              key={i}
              className={cx(
                'w-2 rounded-t-sm origin-bottom transform-gpu spark-bar',
                item.bar,
                isSelected && 'shadow-[0_0_6px_rgba(255,255,255,0.10)]'
              )}
              style={{
                height: `${h}%`,
                // micro-delay por fila (se siente telemetría real)
                animationDelay: `${(item.id === 'DE' ? 0 : item.id === 'DT' ? 35 : item.id === 'DC' ? 70 : item.id === 'DM' ? 105 : 140) + i * 70}ms`,
              }}
            />
          ))}
        </div>


        <div className={cx('font-code font-black text-2xl tabular-nums', item.color, isSelected && GLOW.WHITE_C)}>{item.val}</div>
      </div>
    </button>
  );
};

// =====================================================
// CoreGauge (unchanged from your fusion)
// =====================================================
const CoreGauge = ({ activeInput }: { activeInput: InputId | null }) => {
  const reducedMotion = usePrefersReducedMotion();

  const baseScore = 72;
  const isCritical = activeInput === 'DM';
  const isWarn = activeInput === 'DC';
  const isFocused = !!activeInput;

  const targetScore = isCritical ? 45 : isWarn ? 68 : baseScore;
  const score = useAnimatedNumber(targetScore, { durationMs: 520, disabled: reducedMotion });

  const ringStroke = isCritical ? '#ef4444' : isWarn ? '#facc15' : '#00F0FF';
  const ringFilter = isCritical ? 'url(#glowRed)' : isWarn ? 'url(#glowAmber)' : 'url(#glowCyan)';
  const scoreColor = isCritical ? 'text-red-500' : isWarn ? 'text-yellow-300' : 'text-cyan';

  const r = 45;
  const C = 2 * Math.PI * r;

  const pct = clamp(score / 100, 0.05, 0.95);
  const dashArray = C.toFixed(2);
  const dashOffset = (C - C * pct).toFixed(2);

  const bandWidth = isCritical ? 10 : isWarn ? 8 : 6;
  const lo = clamp((score - bandWidth) / 100, 0.04, 0.96);
  const hi = clamp((score + bandWidth) / 100, 0.04, 0.96);
  const bandA = Math.min(lo, hi);
  const bandB = Math.max(lo, hi);
  const bandDashOffsetA = (C - C * bandA).toFixed(2);
  const bandDashOffsetB = (C - C * bandB).toFixed(2);

  const cx0 = 50, cy0 = 50;
  const theta = (pct * 2 * Math.PI) - (Math.PI / 2);
  const dotX = cx0 + r * Math.cos(theta);
  const dotY = cy0 + r * Math.sin(theta);

  const tickCount = 12;
  const tickIndex = Math.round(((theta + Math.PI / 2) / (2 * Math.PI)) * tickCount) % tickCount;

  const scanDuration = isCritical ? '3.6s' : isWarn ? '5.2s' : '6s';
  const scanOpacity = reducedMotion ? 0 : (isFocused ? 0.20 : 0.42);

  const [strokeBump, setStrokeBump] = useState(0);
  const prevStateRef = useRef<'N' | 'W' | 'C'>('N');
  const stateNow: 'N' | 'W' | 'C' = isCritical ? 'C' : isWarn ? 'W' : 'N';
  useEffect(() => {
    if (prevStateRef.current !== stateNow) {
      prevStateRef.current = stateNow;
      setStrokeBump(1.2);
      const t = setTimeout(() => setStrokeBump(0), 220);
      return () => clearTimeout(t);
    }
  }, [stateNow]);

  return (
    <div className="relative w-full h-full flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <style>{`
        @keyframes gaugeScan { 0% { transform: rotate(0deg); opacity: 0.10; } 15% { opacity: 0.55; } 100% { transform: rotate(360deg); opacity: 0.10; } }
        .gauge-scan { transform-origin: 50px 50px; animation: gaugeScan ${scanDuration} linear infinite; }

        @keyframes gaugeBreath { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.07); } }
        .gauge-breath { animation: gaugeBreath 4.8s ease-in-out infinite; }

        @keyframes sampleStep { 0% { transform: rotate(0deg); opacity: 0.16; } 40% { opacity: 0.22; } 100% { transform: rotate(360deg); opacity: 0.16; } }
        .sample-step { transform-origin: 50px 50px; animation: sampleStep 1s steps(20, end) infinite; }
        
        @keyframes sparkWobble {
        0% { transform: translateY(0px) scaleY(0.92); opacity: 0.55; }
        50% { transform: translateY(-1px) scaleY(1.06); opacity: 0.95; }
        100% { transform: translateY(0px) scaleY(0.98); opacity: 0.75; }
       }
       .spark-bar {
       transform-origin: bottom;
       animation: sparkWobble 900ms ease-in-out infinite;
       animation-play-state: paused;
       will-change: transform, opacity;
       }
       .group:hover .spark-bar,
       .group:focus-within .spark-bar {
       animation-play-state: running;
       }

        @keyframes criticalPulse { 0%, 100% { opacity: 0.20; } 50% { opacity: 0.42; } }
        .critical-pulse { animation: criticalPulse 1.35s ease-in-out infinite; }

        .svg-safe { isolation: isolate; }

        @media (prefers-reduced-motion: reduce) {
          .gauge-scan, .gauge-breath, .sample-step, .animate-spin-slow { animation: none !important; }
        }
      `}</style>

      <div
        className="absolute w-[390px] h-[390px] rounded-full border-2 border-white/14
                   [mask-image:repeating-linear-gradient(90deg,#000_0_8px,transparent_8px_14px)]
                   animate-spin-slow opacity-45"
        style={{ animationDuration: reducedMotion ? undefined : '60s' }}
      />
      <div
        className="absolute w-[348px] h-[348px] rounded-full border-[3px] border-white/12 animate-spin-slow opacity-60"
        style={{ animationDirection: 'reverse', animationDuration: reducedMotion ? undefined : '40s' }}
      />

      <div className="relative w-[292px] h-[292px] gauge-breath">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 svg-safe">
          <defs>
            <filter id="glowCyan" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0 0 0 0 0
                  0 0 0 0 0.94
                  0 0 0 0 1
                  0 0 0 0.35 0"
                result="cyanGlow"
              />
              <feMerge>
                <feMergeNode in="cyanGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowAmber" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0 0 0 0 0.98
                  0 0 0 0 0.80
                  0 0 0 0 0.10
                  0 0 0 0.30 0"
                result="amberGlow"
              />
              <feMerge>
                <feMergeNode in="amberGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowRed" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0 0 0 0 0.94
                  0 0 0 0 0.20
                  0 0 0 0 0.20
                  0 0 0 0.28 0"
                result="redGlow"
              />
              <feMerge>
                <feMergeNode in="redGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <filter id="dotBloom" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="50" cy="50" r="45" fill="none" stroke="#05080C" strokeWidth="6" opacity="0.95" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="6" opacity="0.45" />

          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={ringStroke}
            strokeWidth="10"
            strokeDasharray={dashArray}
            strokeDashoffset={bandDashOffsetA}
            strokeLinecap="round"
            opacity={isCritical ? 0.08 : isWarn ? 0.07 : 0.06}
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#000"
            strokeWidth="10"
            strokeDasharray={dashArray}
            strokeDashoffset={bandDashOffsetB}
            strokeLinecap="round"
            opacity={0.85}
          />

          {Array.from({ length: tickCount }).map((_, i) => {
            const ang = (i / tickCount) * 2 * Math.PI;
            const x1 = cx0 + 49 * Math.cos(ang);
            const y1 = cy0 + 49 * Math.sin(ang);
            const x2 = cx0 + 46.2 * Math.cos(ang);
            const y2 = cy0 + 46.2 * Math.sin(ang);

            const major = i % 3 === 0;
            const active = i === tickIndex;

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={active ? ringStroke : 'rgba(255,255,255,0.12)'}
                  strokeWidth={active ? 2.2 : major ? 1.2 : 0.9}
                  opacity={active ? 0.95 : major ? 0.85 : 0.55}
                  filter={active ? ringFilter : undefined}
                  style={{ transition: 'all 280ms ease-out' }}
                />
                {active && (
                  <circle cx={x1} cy={y1} r={1.8} fill={ringStroke} opacity={0.85} filter="url(#dotBloom)" />
                )}
              </g>
            );
          })}

          <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

          {!reducedMotion && (
            <g className="sample-step" style={{ opacity: isFocused ? 0.12 : 0.18 }}>
              <circle
                cx="50" cy="50" r="31"
                fill="none"
                stroke="rgba(0,240,255,0.35)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
              <circle cx="81" cy="50" r="1.6" fill="rgba(255,255,255,0.45)" opacity="0.7" />
            </g>
          )}

          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={ringStroke}
            strokeWidth={6 + strokeBump}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            filter={ringFilter}
            style={{
              transition:
                'stroke-dashoffset 520ms cubic-bezier(0.2, 0.8, 0.2, 1), ' +
                'stroke 520ms cubic-bezier(0.2, 0.8, 0.2, 1), ' +
                'stroke-width 220ms ease-out'
            }}
          />

          <circle cx={dotX} cy={dotY} r={2.6} fill={ringStroke} filter="url(#dotBloom)" opacity={0.95} />
          <circle cx={dotX} cy={dotY} r={5.8} fill="none" stroke={ringStroke} strokeWidth={1} opacity={0.14} />

          {!reducedMotion && (
            <g className="gauge-scan" style={{ opacity: scanOpacity }}>
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="url(#scanGrad)"
                strokeWidth="7"
                strokeDasharray="40 243"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </g>
          )}

          {isCritical && !reducedMotion && (
            <g className="critical-pulse">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.25" />
            </g>
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="text-gray-400 font-code text-[11px] tracking-[4px] mb-2 font-bold opacity-80">
            HEALTH SCORE
          </div>

          <div className={cx('text-[92px] font-black font-display tracking-tighter leading-none', scoreColor)}>
            {Math.round(score)}
          </div>

          <div className="text-white/60 font-code text-[11px] tracking-[3px] mt-2 font-medium">
            RISK INDEX: {isCritical ? 'CRITICAL' : isWarn ? 'ELEVATED' : 'ALERT'}
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-0 w-12 h-[1px] bg-gradient-to-r from-transparent to-cyan/40 opacity-45" />
      <div className="absolute top-1/2 right-0 w-12 h-[1px] bg-gradient-to-l from-transparent to-cyan/40 opacity-45" />
    </div>
  );
};

// =====================================================
// DecisionCard — UPDATED per your request
// =====================================================
type ReportAction = 'open' | 'pdf' | 'csv' | 'workOrder';

const DecisionCard = ({ activeInput }: { activeInput: InputId | null }) => {
  const isCritical = activeInput === 'DM';
  const reducedMotion = usePrefersReducedMotion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDir, setMenuDir] = useState<'up' | 'down'>('up');
  const [preview, setPreview] = useState<Exclude<ReportAction, 'open'>>('pdf');
  const DIM_UI =
    menuOpen
      ? 'opacity-[0.06] blur-[0.7px] saturate-0'
      : 'opacity-100';

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest?.('[data-report-menu]')) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || e.key === 'F4') return;
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const runAction = (a: ReportAction) => {
    setMenuOpen(false);
    void a;
  };

  const menuItems: Array<{
    id: Exclude<ReportAction, 'open'>;
    label: string;
    sub: string;
    icon: React.ReactNode;
  }> = [
      { id: 'pdf', label: 'EXPORT PDF', sub: 'Audit-ready', icon: <Icons.File /> },
      { id: 'csv', label: 'EXPORT CSV', sub: 'Data pack', icon: <Icons.Table /> },
      { id: 'workOrder', label: 'CREATE WORK ORDER', sub: 'L2 dispatch', icon: <Icons.Wrench /> },
    ];

  const toggleMenu = () => {
    setMenuOpen((v) => {
      const next = !v;
      if (next && typeof window !== 'undefined') {
        const approxMenuH = 290;
        const btn = document.querySelector('[data-report-menu]') as HTMLElement | null;
        const r = btn?.getBoundingClientRect?.();
        if (r) {
          const spaceBelow = window.innerHeight - r.bottom;
          setMenuDir(spaceBelow < approxMenuH ? 'up' : 'down');
        } else {
          setMenuDir('up');
        }
      }
      return next;
    });
  };

  // --- Thumbnails (controlled glow) ---
  const Thumb = ({ id, label }: { id: Exclude<ReportAction, 'open'>; label: string }) => {
    const isActive = preview === id;
    const tint =
      id === 'pdf'
        ? 'from-cyan/30 via-white/5 to-transparent'
        : id === 'csv'
          ? 'from-white/12 via-cyan/10 to-transparent'
          : 'from-amber-400/25 via-white/5 to-transparent';

    return (
      <button
        type="button"
        onMouseEnter={() => setPreview(id)}
        onFocus={() => setPreview(id)}
        onClick={() => runAction(id)}
        className={cx(
          'group relative w-[86px] rounded-lg border px-2 py-2 text-left',
          'bg-black/30 backdrop-blur-md transition-all duration-200',
          // glow base (más presente)
          'shadow-[0_0_28px_rgba(0,240,255,0.14)] hover:shadow-[0_0_40px_rgba(0,240,255,0.20)]',
          // glass highlight
          'before:content-[""] before:absolute before:inset-0 before:rounded-lg before:pointer-events-none',
          'before:bg-[radial-gradient(120px_90px_at_30%_20%,rgba(0,240,255,0.18),transparent_62%)]',
          isActive
            ? 'border-cyan/65 shadow-[0_0_54px_rgba(0,240,255,0.26)]'
            : 'border-white/10 hover:border-cyan/30'
        )}

        aria-label={`Quick ${label}`}
      >
        <div
          className={cx('h-10 rounded-md border border-white/10 bg-gradient-to-br', tint)}
          style={{
            boxShadow: isActive
              ? '0 0 28px rgba(0,240,255,0.22), inset 0 0 16px rgba(0,240,255,0.10)'
              : '0 0 10px rgba(0,240,255,0.08), inset 0 0 10px rgba(255,255,255,0.04)',
          }}
        >
          <div className="p-2 space-y-1">
            <div
              className={cx(
                'h-[3px] w-8 bg-white/26 rounded',
                isActive && 'shadow-[0_0_16px_rgba(0,240,255,0.18)]'
              )}
            />
            <div className="h-[3px] w-12 bg-white/12 rounded" />
            <div className="h-[3px] w-10 bg-white/10 rounded" />
          </div>
        </div>
        <div
          className={cx(
            'mt-2 text-[11px] font-code tracking-[0.20em] text-gray-300 group-hover:text-white transition-colors',
            isActive && 'text-cyan/95',
            isActive && 'drop-shadow-[0_0_10px_rgba(0,240,255,0.30)]'
          )}
        >
          {label}
        </div>
      </button>
    );
  };

  const PreviewPanel = () => {
    const m = menuItems.find((x) => x.id === preview);
    const title = m?.label ?? 'EXPORT';
    const tint =
      preview === 'pdf'
        ? 'shadow-[0_0_18px_rgba(0,240,255,0.12)] border-cyan/20'
        : preview === 'csv'
          ? 'shadow-[0_0_18px_rgba(255,255,255,0.08)] border-white/12'
          : 'shadow-[0_0_18px_rgba(171,123,38,0.10)] border-amber-400/20';

    const DIM_UI =
      menuOpen
        ? 'opacity-[0.06] blur-[0.7px] saturate-0'
        : 'opacity-100';

    return (
      <div className={cx('rounded-lg border bg-black/35 p-3', tint)}>
        <div className="text-[10px] font-code tracking-[0.22em] text-gray-500 mb-2">PREVIEW</div>
        <div className="h-14 rounded-md border border-white/10 bg-gradient-to-br from-white/8 via-transparent to-transparent">
          <div className="p-2 space-y-1">
            <div className="h-[3px] w-14 bg-white/18 rounded" />
            <div className="h-[3px] w-10 bg-white/10 rounded" />
            <div className="h-[3px] w-16 bg-white/12 rounded" />
            <div className="h-[3px] w-9 bg-white/10 rounded" />
          </div>
        </div>
        <div className="mt-2 text-[12px] font-display font-semibold text-white/95 drop-shadow-[0_0_10px_rgba(255,255,255,0.10)]">
          {title}
        </div>
        <div className="text-[10px] text-gray-500 font-code tracking-[0.18em] mt-1">Click thumbnail to run</div>
      </div>
    );
  };

  return (
    <div
      className={cx(
        'relative w-full bg-[#05080C]/85 border border-white/10 rounded-2xl',
        'overflow-visible backdrop-blur-md transition-all duration-500',
        'hover:border-cyan/28 shadow-[0_0_22px_rgba(0,0,0,0.48)]',
        menuOpen ? 'z-[80]' : 'z-10'
      )}
    >

      {/* Ambient inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,240,255,0.10),inset_0_0_26px_rgba(0,240,255,0.06)]" />

      {/* HARD DIM when menu is open (almost disappears) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] transition-opacity duration-200"
          style={{
            opacity: 1,
            // MENOS "black paint", más "cinematic dim"
            background:
              'radial-gradient(1200px 820px at 50% 35%, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.82) 100%)',
            backdropFilter: 'blur(3px) saturate(0.92)',
            WebkitBackdropFilter: 'blur(3px) saturate(0.92)',
          }}
          onMouseDown={() => setMenuOpen(false)}
        >
          {/* ultra subtle noise to avoid “flat patch” */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)',
              mixBlendMode: 'overlay',
            }}
          />
          {/* vignette edge softener (evita el “cuadro”) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(900px 620px at 50% 42%, transparent 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.55) 100%)',
              opacity: 0.9,
            }}
          />
        </div>
      )}

      <div
        className={cx(
          'p-5 border-b border-white/8 flex items-center justify-between relative z-[81] transition-all duration-200',
          DIM_UI
        )}
        style={menuOpen ? { filter: 'brightness(0.12) contrast(1.08)' } : undefined}
      >

        <div>
          <div className={cx('text-[12px] font-code tracking-[0.26em] text-cyan/80', GLOW.CYAN_C)}>DECISION ENGINE</div>
          <div className="text-[10px] text-gray-500 font-code tracking-[0.18em] mt-1">Confidence-driven recommendation</div>
        </div>

        <div
          className={cx(
            'px-3 py-1 rounded-md text-[11px] font-code tracking-[0.22em] border',
            isCritical
              ? 'bg-red-500/12 text-red-300 border-red-400/25 shadow-[0_0_14px_rgba(239,68,68,0.10)]'
              : 'bg-amber-400/12 text-amber-200 border-amber-300/20 shadow-[0_0_14px_rgba(171,123,38,0.10)]'
          )}
        >
          ACTION REQUIRED
        </div>
      </div>

      <div className="p-7 space-y-7 relative z-[81]">
        {/* DIM SOLO AL CONTENIDO (no al menu layer) */}
        <div
          className={cx('space-y-7 transition-all duration-200', DIM_UI)}
          style={menuOpen ? { filter: 'brightness(0.11) contrast(1.10)' } : undefined}
        >
          {/* --- TODO lo que está arriba del footer se queda aquí --- */}

          <div>
            <div className="text-gray-500 text-[11px] font-code tracking-[0.22em]">RECOMMENDED ACTION:</div>
            <div className={cx('mt-2 font-display font-bold text-[26px] leading-[1.12] text-white', GLOW.WHITE_C)}>
              SCHEDULE MAINTENANCE (L2) — 48H
            </div>
          </div>

          <div className={cx('p-5 rounded-xl border transition-all duration-300', isCritical ? 'bg-red-950/22 border-red-500/25' : 'bg-black/35 border-white/10')}>
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-400 text-[12px] tracking-[0.08em] font-main">
                FINANCIAL IMPACT (IF IGNORED)
              </span>
              <span className={cx('font-black font-code text-[28px] text-red-500', GLOW.RED_A)}>$15,400</span>
            </div>

            <div className="w-full bg-gray-800/90 h-2.5 mt-3 rounded-full overflow-hidden">
              <div className="h-full w-[70%] rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.22)]" />
            </div>

            <div className="text-right text-[11px] text-gray-500 mt-2 font-code tracking-[0.18em]">PROBABILITY: 85%</div>
          </div>
        </div>
        {/* END dimmed content */}

        {/* Footer: Auto-generated LEFT (glowy) + Open Report RIGHT (no box) */}
        <div className="flex items-center justify-between gap-4">
          {/* LEFT: Auto-generated (new position + glow) */}
          <div className={cx('text-[11px] text-gray-600 font-code tracking-[0.18em]', GLOW.CYAN_C)}>
            AUTO-GENERATED • v1.2.2
          </div>

          {/* RIGHT: Split action */}
          <div data-report-menu className="relative flex items-center">
            {/* Main: OPEN REPORT — NO BOX, bigger + glow */}
            <button
              type="button"
              className={cx(
                'group relative px-5 py-3 bg-transparent rounded-l-lg',
                'font-display font-semibold uppercase text-[13px] tracking-[0.30em]',
                'text-cyan/90 hover:text-cyan transition-all',
                GLOW.CYAN_B,
                AFFORDANCE_STRIP_SOFT
              )}
              onClick={() => runAction('open')}
              aria-label="Open report"
            >
              <span className="relative z-10 flex items-center gap-2">
                OPEN REPORT
                <span className="opacity-60 group-hover:opacity-100 transition-opacity">→</span>
              </span>
              {/* subtle sheen (not a box) */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-cyan/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* baseline neon */}
              <span className="pointer-events-none absolute left-4 right-4 bottom-[6px] h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent opacity-55" />
            </button>

            {/* Chevron plate */}
            <button
              type="button"
              className={cx(
                'relative rounded-r-lg px-3 py-3',
                'bg-black/20 text-cyan/90 transition-all',
                'hover:bg-cyan/15 hover:text-cyan',
                menuOpen && 'bg-cyan/20 text-cyan',
                GLOW.CYAN_C,
                AFFORDANCE_STRIP_SOFT
              )}
              onClick={toggleMenu}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Report export menu"
            >
              <span className={cx('block transition-transform duration-200', menuOpen && 'rotate-180')}>
                <Icons.Chevron />
              </span>
            </button>

            {/* Menu */}
            {menuOpen && (
              <div
                role="menu"
                className={cx(
                  'absolute right-0 z-[9999] w-[360px] rounded-xl border border-white/12 opacity-100',
                  'bg-[#05080C]/96 backdrop-blur-md',
                  'shadow-[0_0_34px_rgba(0,0,0,0.62),0_0_64px_rgba(0,240,255,0.10)]',
                  'overflow-hidden'
                )}
                style={{
                  ...(menuDir === 'up' ? { bottom: 'calc(100% + 10px)' } : { top: 'calc(100% + 10px)' }),
                  transition: reducedMotion ? undefined : 'transform 180ms ease, opacity 180ms ease',
                }}
              >
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <div className="text-[11px] font-code tracking-[0.26em] text-gray-400">SMARTSERVICE™ OUTPUT</div>
                  <div className="text-[10px] font-code tracking-[0.22em] text-gray-600">ESC to close</div>
                </div>

                <div className="px-4 pb-3 flex gap-2">
                  <Thumb id="pdf" label="PDF" />
                  <Thumb id="csv" label="CSV" />
                  <Thumb id="workOrder" label="WORK" />
                </div>

                <div className="grid grid-cols-[1fr_150px] border-t border-white/8">
                  <div className="py-2">
                    {menuItems.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="menuitem"
                        onMouseEnter={() => setPreview(m.id)}
                        onFocus={() => setPreview(m.id)}
                        onClick={() => runAction(m.id)}
                        className={cx(
                          'w-full px-4 py-3 text-left flex items-center gap-3',
                          'transition-all duration-200',
                          'hover:bg-white/5 focus:bg-white/6',
                          preview === m.id && 'bg-white/5'
                        )}
                      >
                        <span className={cx('w-9 h-9 rounded-lg border flex items-center justify-center', 'bg-black/30 border-white/10', preview === m.id && 'shadow-[0_0_18px_rgba(0,240,255,0.12)]')}>
                          {m.icon}
                        </span>

                        <span className="min-w-0">
                          <div className="text-[12px] font-code tracking-[0.22em] text-white">{m.label}</div>
                          <div className="text-[11px] text-gray-500 font-main">{m.sub}</div>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 border-l border-white/8">
                    <PreviewPanel />
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-white/8 bg-black/25">
                  <div className="text-[10px] text-gray-500 font-code tracking-[0.18em]">
                    Tip: thumbnails = fast export • list = detailed export
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MAIN SLIDE 7
// =====================================================
interface Slide7Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

export const Slide7: React.FC<Slide7Props> = ({ nextSlide, prevSlide }) => {
  const [activeInput, setActiveInput] = useState<InputId | null>(null);

  const ambientLineClass = useMemo(
    () =>
      'border-t [mask-image:repeating-linear-gradient(90deg,#000_0_8px,transparent_8px_14px)] border-cyan/25 bg-cyan/12 opacity-45',
    []
  );

  const sparksById = useMemo(() => {
    const out: Record<InputId, number[]> = {} as Record<InputId, number[]>;
    for (const it of INPUT_STREAMS) {
      const rnd = prng(hash32(it.id + it.label));
      out[it.id] = Array.from({ length: 7 }, (_, i) => {
        const base = 24 + i * 6;
        const jitter = Math.round(rnd() * 22);
        return clamp(base + jitter, 18, 88);
      });
    }
    return out;
  }, []);

  return (
    <SlideContainer>
      <Header title="SMARTSERVICE™" breadcrumb="SISTEMA" slideNum={8} />

      <div className="h-full w-full grid grid-cols-[30%_40%_30%] gap-8 items-center px-4 pt-4 relative">
        <div className="pointer-events-none absolute inset-0 opacity-[0.22] bg-[radial-gradient(circle_at_30%_10%,rgba(0,240,255,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] bg-[radial-gradient(circle_at_70%_70%,rgba(171,123,38,0.10),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0,rgba(255,255,255,0.02)_1px,transparent_2px)] bg-[length:100%_18px] opacity-[0.14]" />

        <div className={cx('absolute top-1/2 left-[28%] w-[12%] h-[2px]', ambientLineClass)} />
        <div className={cx('absolute top-1/2 right-[28%] w-[12%] h-[2px]', ambientLineClass)} />

        <div className="h-[86%] flex flex-col animate-fade-up">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className={cx('text-cyan font-code tracking-[0.25em] text-[15px] font-black', GLOW.CYAN_B)}>
              01. INPUT // DATA
            </h3>
            <div className={cx('text-cyan/80', GLOW.CYAN_C)}>
              <Icons.Activity />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center border-y border-white/5 bg-[#05080C]/35 backdrop-blur-sm rounded-xl overflow-hidden shadow-[inset_0_0_18px_rgba(0,0,0,0.45)]">
            {INPUT_STREAMS.map(item => (
              <TelemetryRow
                key={item.id}
                item={item}
                active={activeInput}
                onSelect={setActiveInput}
                onClear={() => setActiveInput(null)}
                sparkHeights={sparksById[item.id]}
              />
            ))}
          </div>

          <div className="mt-6 text-xs text-gray-500 font-code leading-relaxed tracking-wide">
            Continuous monitoring of 5 dimensions. <br />
            <span className={cx('text-white', GLOW.WHITE_C)}>Sample Rate: 50ms</span>
          </div>
        </div>

        <div className="h-full flex flex-col items-center justify-center relative z-10">
          <div className={cx('absolute top-[7.5%] font-code text-gold tracking-[0.42em] text-xs font-black opacity-90', GLOW.GOLD_C)}>
            ALGORITHM CORE
          </div>

          <CoreGauge activeInput={activeInput} />

          <div className="absolute bottom-[11%] text-center">
            <div className="text-gray-400 text-xs font-main tracking-[0.22em] mb-2">LOGIC MODEL</div>
            <div className={cx('text-white font-black font-display text-[1.65rem] tracking-wide', GLOW.WHITE_C)}>
              PROBABILITY × IMPACT
            </div>
          </div>
        </div>

        <div className="h-[86%] flex flex-col animate-fade-up" style={{ animationDelay: '0.12s' }}>
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className={cx('text-gold font-code tracking-[0.25em] text-[15px] font-black', GLOW.GOLD_C)}>
              03. OUTPUT // ACTION
            </h3>
            <div className={cx('text-gold/80', GLOW.GOLD_C)}>
              <Icons.Alert />
            </div>
          </div>

          <DecisionCard activeInput={activeInput} />

          <div className="mt-6 p-4 bg-cyan/4 border border-cyan/18 rounded-lg shadow-[0_0_10px_rgba(0,240,255,0.06)]">
            <div className="flex gap-3 items-start">
              <div className={cx('mt-1 text-cyan', GLOW.CYAN_C)}><Icons.Server /></div>
              <div className="text-[11px] text-gray-300 leading-relaxed font-code">
                SYSTEM STATUS:{' '}
                <span className={cx('text-cyan font-bold', GLOW.CYAN_B)}>PREDICTIVE MODE</span><br />
                The system doesn't just report data.<br />
                It dictates <strong className={cx('text-white', GLOW.WHITE_C)}>operational reality.</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

