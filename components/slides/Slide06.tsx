import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SlideContainer, Header, NavArea } from '../SlideRenderer';

/* =====================================================
   Slide06 — v3.3.0 (HOTFIX_NAV + INSTRUCCIONES_ES + BIGGER)
   ✅ Arregla: NEXT/PREV bloqueado por scale global (se elimina)
   ✅ Arregla: tokens basura ("consider", "기억")
   ✅ Regresa: escáner ambiental + escáner fuerte por hover/lock
   ✅ Instrucciones: ESPAÑOL, MAYÚSCULAS, MÁS GRANDES, CON GLOW PRO
   ✅ Interactivo claro: Hover/Click + TAB/ENTER + Lock/Clear
   ✅ Tailwind estable (sin bg-${color}/via-${color})
   ✅ Respeta prefers-reduced-motion
===================================================== */

/* ----------------------------
   Helpers
---------------------------- */
const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ');

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/* ----------------------------
   Motion prefs
---------------------------- */
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(!!mq.matches);
    onChange();

    // compat older browsers
    const add = (mq as any).addEventListener ? 'addEventListener' : 'addListener';
    const remove = (mq as any).removeEventListener ? 'removeEventListener' : 'removeListener';
    (mq as any)[add]('change', onChange);
    return () => (mq as any)[remove]('change', onChange);
  }, []);
  return reduced;
};

/* ----------------------------
   Visual system (quiet authority)
---------------------------- */
const GLOW = {
  CYAN_A: 'drop-shadow-[0_0_14px_rgba(0,240,255,0.34)]',
  CYAN_B: 'drop-shadow-[0_0_10px_rgba(0,240,255,0.24)]',
  CYAN_C: 'drop-shadow-[0_0_6px_rgba(0,240,255,0.14)]',

  GOLD_B: 'drop-shadow-[0_0_10px_rgba(171,123,38,0.22)]',
  GOLD_C: 'drop-shadow-[0_0_6px_rgba(171,123,38,0.14)]',

  GREEN_C: 'drop-shadow-[0_0_6px_rgba(74,222,128,0.14)]', // ✅ ADD

  WHITE_C: 'drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]',
} as const;

const COLORS = {
  CYAN: '#00F0FF',
  GOLD: '#AB7B26',
  WHITE: '#FFFFFF',
  DIM: '#333333',
} as const;

type Hue = 'cyan' | 'gold';

const hueToHex = (h: Hue) => (h === 'gold' ? COLORS.GOLD : COLORS.CYAN);

const stableHueClasses = (h: Hue) => {
  const isGold = h === 'gold';
  return {
    // border
    borderStrong: isGold ? 'border-gold/60' : 'border-cyan/60',
    borderSoft: isGold ? 'border-gold/28' : 'border-cyan/28',
    // text
    text: isGold ? 'text-gold' : 'text-cyan',
    // dot
    dot: isGold ? 'bg-gold' : 'bg-cyan',
    // gradients
    scanGrad: isGold ? 'from-transparent via-gold/12 to-transparent' : 'from-transparent via-cyan/12 to-transparent',
    ribbonGrad: isGold
      ? 'bg-gradient-to-r from-transparent via-gold/45 to-transparent'
      : 'bg-gradient-to-r from-transparent via-cyan/45 to-transparent',
    // glow
    glowOuter: isGold
      ? 'shadow-[0_0_44px_rgba(171,123,38,0.22)]'
      : 'shadow-[0_0_44px_rgba(0,240,255,0.22)]',
    glowInner: isGold
      ? 'shadow-[inset_0_0_0_1px_rgba(171,123,38,0.14),inset_0_0_28px_rgba(171,123,38,0.10)]'
      : 'shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14),inset_0_0_28px_rgba(0,240,255,0.10)]',
  };
};

/* ----------------------------
   Size tuning (NO global scale)
---------------------------- */
const SIZING = {
  LEFT_TITLE: 30, // lead size
  LEFT_BODY: 18,
  LEFT_SUB: 14,
  SPEC_TEXT: 13,

  BLUEPRINT_H: 540, // right panel height
  NODE_H: 220, // module height
  NODE_ICON: 46,
  NODE_TITLE: 18,

  HUD_H: 160,
  HUD_TITLE: 24,
  HUD_DESC: 15,

  INSTR_TEXT: 12, // instruction bar
} as const;

/* ----------------------------
   Data
---------------------------- */
const NODES = {
  CAD: {
    id: 'CAD',
    label: '01. INPUT',
    title: 'CAD / DISEÑO',
    subtitle: 'Modelos · Planos · Librerías',
    desc:
      'Tu hijo construye librerías CAD reutilizables (fixtures/herramentales), con nomenclatura y revisión. Diseño que se puede versionar y repetir.',
    hue: 'cyan' as Hue,
    icon: '📐',
    hint: 'PASA EL MOUSE O TOCA PARA INSPECCIONAR',
  },
  OEM: {
    id: 'OEM',
    label: '02. PROCESS',
    title: 'ESCUELA OEM',
    subtitle: 'Proceso · Calidad · Seguridad',
    desc:
      'HITECH amarra disciplina: SOP, checklist, seguridad, control de cambios y evidencia. Lo que se diseña se vuelve estándar operativo.',
    hue: 'gold' as Hue,
    icon: '⚙️',
    hint: 'AQUÍ VIVE LA DISCIPLINA: ESTÁNDAR Y SEGURIDAD',
  },
  OUT: {
    id: 'OUT',
    label: '03. OUTPUT',
    title: 'ENTREGABLES',
    subtitle: 'Docs · Evidencia · Trazabilidad',
    desc:
      'Paquete final listo para planta: plano + SOP + checklist + evidencia + cierre técnico. Entregable que sobrevive auditoría y rotación.',
    hue: 'cyan' as Hue,
    icon: '📦',
    hint: 'SALIDA AUDITABLE: LISTA PARA PLANTA',
  },
} as const;

type NodeType = keyof typeof NODES;

/* ----------------------------
   Persistence (micro tutorial)
---------------------------- */
const LS_KEY_TUTORIAL = 'HITECH_Slide06_TutorialSeen_v1';
const safeLSGet = (k: string) => {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeLSSet = (k: string, v: string) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(k, v);
  } catch {
    // ignore
  }
};

/* ----------------------------
   Reticle / Cursor tracking
---------------------------- */
type Reticle = { x: number; y: number; visible: boolean };
const useReticle = (enabled: boolean) => {
  const [reticle, setReticle] = useState<Reticle>({ x: 0, y: 0, visible: false });
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ x: number; y: number; t: number }>({ x: 0, y: 0, t: 0 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enabled) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);

    lastRef.current = { x, y, t: nowMs() };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setReticle((r) => ({
        x: lerp(r.x, lastRef.current.x, 0.6),
        y: lerp(r.y, lastRef.current.y, 0.6),
        visible: true,
      }));
    });
  };

  const onEnter = () => enabled && setReticle((r) => ({ ...r, visible: true }));
  const onLeave = () => enabled && setReticle((r) => ({ ...r, visible: false }));

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { reticle, onMove, onEnter, onLeave };
};

/* ----------------------------
   Scan system
---------------------------- */
type ScanMode = 'off' | 'ambient' | 'active';

const useScan = (reducedMotion: boolean) => {
  const [mode, setMode] = useState<ScanMode>('ambient');

  useEffect(() => {
    if (reducedMotion) setMode('ambient');
  }, [reducedMotion]);

  return { mode, setMode };
};

/* =====================================================
   Small UI pieces
===================================================== */
const MiniBadge = ({
  text,
  hue = 'cyan',
  glow = true,
}: {
  text: string;
  hue?: Hue;
  glow?: boolean;
}) => {
  const c = stableHueClasses(hue);

  const textGlow =
    hue === 'gold'
      ? 'drop-shadow-[0_0_10px_rgba(171,123,38,0.24)]'
      : 'drop-shadow-[0_0_10px_rgba(0,240,255,0.24)]';

  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 px-3 py-[7px] rounded-full border',
        'bg-black/30 backdrop-blur-md',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        c.borderSoft
      )}
    >
      <span className={cx('w-2 h-2 rounded-full', c.dot)} />
      <span
        className={cx(
          'font-code tracking-[0.26em] uppercase',
          c.text,
          glow && textGlow
        )}
        style={{ fontSize: `${SIZING.INSTR_TEXT}px` }}
      >
        {text}
      </span>
    </span>
  );
};

const HintPill = ({
  text,
  hue = 'cyan',
  pulse = false,
}: {
  text: string;
  hue?: Hue;
  pulse?: boolean;
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const c = stableHueClasses(hue);

  const textGlow =
    hue === 'gold'
      ? 'drop-shadow-[0_0_10px_rgba(171,123,38,0.22)]'
      : 'drop-shadow-[0_0_10px_rgba(0,240,255,0.22)]';

  return (
    <div
      className={cx(
        'inline-flex items-center gap-2 px-3 py-2 rounded-md border',
        'bg-black/32 backdrop-blur-md',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        c.borderSoft
      )}
    >
      <span className={cx('w-2 h-2 rounded-full', c.dot, pulse && !reducedMotion && 'animate-pulse')} />
      <span
        className={cx('font-code tracking-[0.26em] uppercase', c.text, textGlow)}
        style={{ fontSize: `${SIZING.INSTR_TEXT}px` }}
      >
        {text}
      </span>
    </div>
  );
};

/* =====================================================
   Process Node (Interactive module)
===================================================== */
const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:ring-offset-0';

const SR_ONLY = 'sr-only';

const ProcessNode = ({
  nodeKey,
  activeNode,
  hoveredNode,
  onHover,
  onLeave,
  onSelect,
  tutorialFlash,
}: {
  nodeKey: NodeType;
  activeNode: NodeType | null;
  hoveredNode: NodeType | null;
  onHover: (k: NodeType) => void;
  onLeave: () => void;
  onSelect: (k: NodeType) => void;
  tutorialFlash: NodeType | null;
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const data = NODES[nodeKey];
  const hue = data.hue;
  const c = stableHueClasses(hue);

  const isActive = activeNode === nodeKey;
  const isHovered = hoveredNode === nodeKey;
  const isDimmed = activeNode !== null && !isActive;
  const isTutorial = tutorialFlash === nodeKey;

  const titleGlow = hue === 'gold' ? GLOW.GOLD_C : GLOW.CYAN_C;

  const nodeScanOn = !reducedMotion && (isActive || isHovered || isTutorial);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(nodeKey);
    }
  };

  return (
    <button
      type="button"
      className={cx(
        'relative h-full w-full text-left transition-all duration-500 group',
        'cursor-pointer',
        isDimmed ? 'opacity-30 grayscale-[55%]' : 'opacity-100',
        FOCUS_RING
      )}
      aria-label={`Módulo ${data.title}. ${data.hint}`}
      onMouseEnter={() => onHover(nodeKey)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(nodeKey)}
      onBlur={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(nodeKey);
      }}
      onKeyDown={onKeyDown}
    >
      <span className={SR_ONLY}>{data.hint}</span>

      <div
        className={cx(
          'absolute inset-0 border transition-all duration-300 backdrop-blur-sm rounded-lg',
          'bg-black/25',
          'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
          hue === 'gold'
            ? 'shadow-[inset_0_0_0_1px_rgba(171,123,38,0.07)]'
            : 'shadow-[inset_0_0_0_1px_rgba(0,240,255,0.07)]',
          isActive
            ? cx(c.borderStrong, c.glowOuter, 'bg-black/80 scale-[1.03]')
            : cx('border-white/10 hover:border-white/30'),
          isTutorial && cx(c.borderStrong, c.glowOuter)
        )}
      >
        {/* Corner Brackets */}
        <div className={cx('absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors', isActive || isTutorial ? c.borderStrong : 'border-white/20')} />
        <div className={cx('absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors', isActive || isTutorial ? c.borderStrong : 'border-white/20')} />
        <div className={cx('absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors', isActive || isTutorial ? c.borderStrong : 'border-white/20')} />
        <div className={cx('absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors', isActive || isTutorial ? c.borderStrong : 'border-white/20')} />

        <div
          className={cx(
            'pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-300',
            isActive || isTutorial || isHovered ? 'opacity-100' : 'opacity-45',
            c.glowInner
          )}
        />

        <div className="h-full flex flex-col p-6 relative overflow-hidden">
          {/* Strong scanline on node */}
          {nodeScanOn && (
            <div
              className={cx(
                'absolute inset-0 bg-gradient-to-b h-[55%] w-full pointer-events-none',
                c.scanGrad,
                'opacity-70'
              )}
              style={{ animation: 'scanStrong 1.25s linear infinite' }}
            />
          )}

          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <span
              className={cx(
                'font-code tracking-[0.22em] uppercase',
                isActive || isTutorial || isHovered
                  ? cx(c.text, hue === 'gold' ? GLOW.GOLD_C : GLOW.CYAN_C)
                  : 'text-gray-500'
              )}
              style={{ fontSize: '11px' }}
            >
              {data.label}
            </span>

            <div className="flex items-center gap-2">
              <div
                className={cx(
                  'w-2 h-2 rounded-full',
                  isActive || isTutorial || isHovered
                    ? cx(c.dot, !reducedMotion && 'animate-pulse')
                    : 'bg-gray-700'
                )}
                title="Interacción disponible"
              />
              <div className={cx('w-1 h-1 rounded-full opacity-60', isActive || isTutorial || isHovered ? c.dot : 'bg-gray-700')} />
            </div>
          </div>

          {/* Icon + Title */}
          <div className="flex-1 flex flex-col justify-center items-center text-center gap-2">
            <div
              className={cx(
                'transition-transform duration-300',
                isActive || isTutorial ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100',
                !isActive && !isTutorial ? 'grayscale' : ''
              )}
              style={{ fontSize: `${SIZING.NODE_ICON}px` }}
            >
              {data.icon}
            </div>

            <h3
              className={cx(
                'font-display font-bold leading-tight mt-2',
                isActive || isTutorial || isHovered ? cx('text-white', titleGlow) : 'text-gray-400'
              )}
              style={{
                fontSize: `${SIZING.NODE_TITLE}px`,
                textShadow:
                  isActive || isTutorial || isHovered
                    ? hue === 'gold'
                      ? '0 0 18px rgba(171,123,38,0.16)'
                      : '0 0 18px rgba(0,240,255,0.16)'
                    : undefined,
              }}
            >
              {data.title}
            </h3>

            <div
              className={cx(
                'mt-1 font-code tracking-[0.26em] uppercase transition-opacity duration-300',
                isActive || isTutorial || isHovered ? 'opacity-85' : 'opacity-0',
                c.text
              )}
              style={{ fontSize: '10px' }}
            >
              INSPECTAR
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-white/10 flex justify-between font-code text-gray-500" style={{ fontSize: '10px' }}>
            <span>SYS.VER.2.1</span>
            <span className={cx(isActive || isTutorial || isHovered ? c.text : '', isActive || isTutorial || isHovered ? (hue === 'gold' ? GLOW.GOLD_C : GLOW.CYAN_C) : '')}>
              {isActive ? 'STATUS: ONLINE' : isHovered ? 'READY' : 'IDLE'}
            </span>
          </div>

          {/* Bottom affordance strip */}
          <div
            className={cx(
              'pointer-events-none absolute left-5 right-5 bottom-3 h-px transition-opacity duration-300',
              c.ribbonGrad,
              isActive || isHovered || isTutorial ? 'opacity-90' : 'opacity-40'
            )}
          />
        </div>
      </div>

      <style>{`
        @keyframes scanStrong {
          0%   { transform: translateY(-120%); opacity: 0.0; }
          10%  { opacity: 0.85; }
          100% { transform: translateY(240%); opacity: 0.0; }
        }
      `}</style>
    </button>
  );
};

/* =====================================================
   Flow Connector (between nodes)
===================================================== */
const FlowConnector = ({
  active,
  hue,
  emphasis = 1,
}: {
  active: boolean;
  hue: Hue;
  emphasis?: number;
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const stroke = active ? hueToHex(hue) : COLORS.DIM;
  const glow = active
    ? hue === 'gold'
      ? 'drop-shadow(0 0 10px rgba(171,123,38,0.18))'
      : 'drop-shadow(0 0 10px rgba(0,240,255,0.18))'
    : undefined;

  const dashSpeed = active && !reducedMotion ? clamp(0.75 / emphasis, 0.35, 1.0) : 999;

  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden opacity-90">
      <svg className="w-full h-[12px]" viewBox="0 0 240 12" preserveAspectRatio="none">
        <line
          x1="0"
          y1="6"
          x2="230"
          y2="6"
          stroke={stroke}
          strokeWidth="2"
          strokeDasharray="7 7"
          style={{
            animation: active && !reducedMotion ? `dash ${dashSpeed}s linear infinite` : undefined,
            filter: glow,
          }}
        />
        <path d="M230 6 L215 0 L215 12 Z" fill={stroke} opacity={active ? 0.95 : 0.55} />
      </svg>

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -28; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
    </div>
  );
};

/* =====================================================
   Holographic Blueprint (right side)
===================================================== */
const HolographicBlueprint = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState<NodeType | null>(null);
  const [selected, setSelected] = useState<NodeType | null>(null);

  const activeNode: NodeType | null = selected ?? hovered;

  const { mode, setMode } = useScan(reducedMotion);

  const [tutorialFlash, setTutorialFlash] = useState<NodeType | null>(null);

  const reticleEnabled = !reducedMotion;
  const { reticle, onMove, onEnter, onLeave } = useReticle(reticleEnabled);

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const seen = safeLSGet(LS_KEY_TUTORIAL);
    if (seen === '1') return;

    let alive = true;
    const seq: NodeType[] = ['CAD', 'OEM', 'OUT'];
    let i = 0;

    const step = () => {
      if (!alive) return;
      setTutorialFlash(seq[i]);
      setMode('active');
      i++;
      if (i >= seq.length) {
        setTimeout(() => {
          if (!alive) return;
          setTutorialFlash(null);
          setMode('ambient');
          safeLSSet(LS_KEY_TUTORIAL, '1');
        }, 450);
        return;
      }
      setTimeout(step, 650);
    };

    setTimeout(step, 400);

    return () => {
      alive = false;
    };
  }, [setMode]);

  useEffect(() => {
    if (reducedMotion) {
      setMode('ambient');
      return;
    }
    if (tutorialFlash) {
      setMode('active');
      return;
    }
    if (activeNode) setMode('active');
    else setMode('ambient');
  }, [activeNode, tutorialFlash, reducedMotion, setMode]);

  const activeData = activeNode ? NODES[activeNode] : null;

  const onHover = (k: NodeType) => {
    setHovered(k);
    setHasInteracted(true);
  };

  const onLeaveNode = () => setHovered(null);

  const onSelect = (k: NodeType) => {
    setSelected((cur) => (cur === k ? null : k));
    setHasInteracted(true);
  };

  const clearSelection = () => setSelected(null);

  const aCAD = activeNode === 'CAD' || activeNode === 'OEM';
  const aOEM = activeNode === 'OEM' || activeNode === 'OUT';

  const ambientOpacity = reducedMotion ? 0.08 : 0.16;

  return (
    <div
      className={cx(
        'w-full relative bg-[#05080C]',
        'border border-white/10 rounded-xl overflow-hidden flex flex-col',
        'shadow-[inset_0_0_120px_rgba(0,0,0,0.92)]',
        'animate-fade-up group'
      )}
      style={{ height: `${SIZING.BLUEPRINT_H}px` }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={() => {
        onLeave();
        setHovered(null);
      }}
      onClick={() => {
        // click vacío = limpiar lock
        clearSelection();
      }}
    >
      {/* Blueprint background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.22] bg-[linear-gradient(rgba(0,240,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.10)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.16] bg-[radial-gradient(circle_at_30%_10%,rgba(0,240,255,0.12),transparent_55%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.14] bg-[radial-gradient(circle_at_80%_80%,rgba(171,123,38,0.10),transparent_55%)]" />

      {/* Ambient scanline */}
      {!reducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: ambientOpacity,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,240,255,0.12) 50%, transparent 100%)',
            height: '45%',
            animation: mode === 'off' ? 'none' : 'scanAmbient 4.8s linear infinite',
          }}
        />
      )}

      {/* Reticle */}
      {!reducedMotion && (
        <div
          className={cx(
            'absolute pointer-events-none z-30 transition-opacity duration-200',
            reticle.visible ? 'opacity-70' : 'opacity-0'
          )}
          style={{
            left: `${reticle.x}px`,
            top: `${reticle.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full border border-cyan/40 shadow-[0_0_18px_rgba(0,240,255,0.12)]" />
            <div className="absolute left-1/2 top-[-10px] w-px h-6 bg-cyan/35" />
            <div className="absolute left-1/2 bottom-[-10px] w-px h-6 bg-cyan/35" />
            <div className="absolute top-1/2 left-[-10px] h-px w-6 bg-cyan/35" />
            <div className="absolute top-1/2 right-[-10px] h-px w-6 bg-cyan/35" />
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="w-full h-11 border-b border-white/10 bg-black/45 flex items-center justify-between px-4 z-10">
        <div className="flex gap-2 items-center">
          <div className={cx('w-2 h-2 bg-cyan/50 rounded-full', !reducedMotion && 'animate-pulse')} />
          <span className={cx('font-code text-[11px] text-cyan/70 tracking-widest', GLOW.CYAN_C)}>
            BLUEPRINT_VIEW // ARCH_V2
          </span>
          <span className="ml-2 text-[10px] font-code text-white/25 tracking-[0.22em] uppercase">
            {selected ? 'FIJADO' : hovered ? 'RASTREANDO' : 'IDLE'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!hasInteracted && (
            <HintPill text="HOVER / CLIC PARA INSPECCIONAR" hue="cyan" pulse />
          )}
          <span className="font-code text-[11px] text-gray-600 tracking-widest">MODE: INTERACTIVE</span>
        </div>
      </div>

      {/* Main Diagram */}
      <div
        className="flex-1 relative px-10 py-10 flex items-center justify-center"
        style={{ cursor: 'crosshair' }}
      >
        <div
          className="w-full flex items-center justify-between relative z-10 max-w-5xl"
          style={{ height: `${SIZING.NODE_H}px` }}
        >
          <div className="w-[30%]" style={{ height: `${SIZING.NODE_H}px` }}>
            <ProcessNode
              nodeKey="CAD"
              activeNode={activeNode}
              hoveredNode={hovered}
              onHover={onHover}
              onLeave={onLeaveNode}
              onSelect={onSelect}
              tutorialFlash={tutorialFlash}
            />
          </div>

          <div className="flex-1 px-2" style={{ height: `${SIZING.NODE_H}px` }}>
            <div className="h-full flex flex-col justify-center">
              <FlowConnector active={aCAD} hue="cyan" emphasis={aCAD ? 1.35 : 1} />
            </div>
          </div>

          <div className="w-[30%]" style={{ height: `${SIZING.NODE_H}px` }}>
            <ProcessNode
              nodeKey="OEM"
              activeNode={activeNode}
              hoveredNode={hovered}
              onHover={onHover}
              onLeave={onLeaveNode}
              onSelect={onSelect}
              tutorialFlash={tutorialFlash}
            />
          </div>

          <div className="flex-1 px-2" style={{ height: `${SIZING.NODE_H}px` }}>
            <div className="h-full flex flex-col justify-center">
              <FlowConnector active={aOEM} hue="gold" emphasis={aOEM ? 1.5 : 1} />
            </div>
          </div>

          <div className="w-[26%]" style={{ height: `${SIZING.NODE_H}px` }}>
            <ProcessNode
              nodeKey="OUT"
              activeNode={activeNode}
              hoveredNode={hovered}
              onHover={onHover}
              onLeave={onLeaveNode}
              onSelect={onSelect}
              tutorialFlash={tutorialFlash}
            />
          </div>
        </div>
      </div>

      {/* Instruction Bar (FIXED inside blueprint, no cut, no overflow) */}
      <div
        className={cx(
          'w-full border-t border-white/10 bg-black/35 backdrop-blur-md',
          'px-6 py-3 flex items-center justify-between gap-4'
        )}
      >
        <div className="flex items-center gap-3">
          <MiniBadge text="TAB: NAVEGAR" hue="cyan" />
          <MiniBadge text="ENTER: FIJAR" hue="gold" />
          <MiniBadge text="CLIC FUERA: LIMPIAR" hue="cyan" />
        </div>

        <div className="hidden md:flex items-center gap-3">
          {selected ? (
            <HintPill text="MODO FIJADO" hue="gold" pulse={!reducedMotion} />
          ) : (
            <HintPill text="PASAR MOUSE / CLIC PARA VER DETALLE" hue="cyan" pulse={!reducedMotion} />
          )}
        </div>
      </div>

      {/* HUD */}
      <div
        className={cx(
          'border-t border-white/10 bg-[#020305]/92 backdrop-blur-md relative z-20',
          'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
        )}
        style={{ height: `${SIZING.HUD_H}px` }}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan/30 to-transparent opacity-60" />

        {!reducedMotion && (activeNode || tutorialFlash) && (
          <div
            className="absolute left-0 right-0 top-0 h-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(0,240,255,0.55), transparent)',
              animation: 'hudScan 1.1s linear infinite',
              opacity: 0.85,
            }}
          />
        )}

        <div className="h-full px-7 py-6">
          {activeData ? (
            <div className="animate-fade-up">
              <div className="flex items-center gap-3 mb-2">
                <h4
                  className={cx(
                    'font-display font-bold',
                    activeData.hue === 'gold' ? cx('text-gold', GLOW.GOLD_C) : cx('text-cyan', GLOW.CYAN_C)
                  )}
                  style={{ fontSize: `${SIZING.HUD_TITLE}px` }}
                >
                  {activeData.title}
                </h4>

                <span className="h-5 w-[1px] bg-white/20" />

                <span className="font-code text-gray-400 tracking-wider uppercase" style={{ fontSize: '12px' }}>
                  {activeData.subtitle}
                </span>

                {selected && (
                  <span className="ml-auto font-code tracking-[0.26em] uppercase text-white/40" style={{ fontSize: '11px' }}>
                    FIJADO
                  </span>
                )}
              </div>

              <p
                className="text-gray-200 font-main leading-relaxed max-w-5xl"
                style={{ fontSize: `${SIZING.HUD_DESC}px` }}
              >
                {activeData.desc}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <HintPill text={activeData.hint} hue={activeData.hue} />
                <span className="font-code tracking-[0.28em] uppercase text-white/25" style={{ fontSize: '11px' }}>
                  {selected ? 'CLIC FUERA PARA LIMPIAR' : 'CLIC PARA FIJAR'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={cx('text-gray-400 font-code tracking-[0.34em] uppercase', !reducedMotion && 'animate-pulse')}
                  style={{ fontSize: '12px' }}
                >
                  HOVER / CLIC EN UN MÓDULO PARA INSPECCIONAR
                </div>
                <div
                  className={cx(
                    'font-code tracking-[0.36em] uppercase',
                    'text-cyan/80',
                    'drop-shadow-[0_0_16px_rgba(0,240,255,0.22)]'
                  )}
                  style={{ fontSize: '12px' }}
                >
                  TIP: TAB PARA NAVEGAR • ENTER PARA FIJAR
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes scanAmbient {
            0% { transform: translateY(-140%); }
            100% { transform: translateY(260%); }
          }
          @keyframes hudScan {
            0% { transform: translateX(-40%); opacity: 0.0; }
            10% { opacity: 0.85; }
            100% { transform: translateX(40%); opacity: 0.0; }
          }
        `}</style>
      </div>
    </div>
  );
};

/* =====================================================
   Left Column (narrative)
===================================================== */
const LeftNarrative = () => {
  /**
   * GLASS SYSTEM
   * - Dark glass base
   * - Double border (visionOS style)
   * - Micro grain noise
   * - Controlled glow
   * - Micro parallax (very subtle) on glass layers
   */

  const reducedMotion = usePrefersReducedMotion();

  // --- micro-parallax state (super leve, no mareo) ---
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [px, setPx] = useState(0); // -1..1
  const [py, setPy] = useState(0); // -1..1

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const el = wrapRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;  // 0..1
    const y = (e.clientY - r.top) / r.height;  // 0..1

    // center -> -1..1
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;

    // clamp + suavizado leve
    const cxv = Math.max(-1, Math.min(1, nx));
    const cyv = Math.max(-1, Math.min(1, ny));

    setPx(cxv);
    setPy(cyv);
  };

  const onLeave = () => {
    // regresa al centro suave
    setPx(0);
    setPy(0);
  };

  // Intensidad del parallax (muy leve)
  const sheenShift = 10; // px max
  const noiseShift = 6;  // px max
  const lineShift  = 8;  // px max

  const sheenTransform = reducedMotion
    ? 'translate3d(0,0,0)'
    : `translate3d(${(-px * sheenShift).toFixed(2)}px, ${(-py * sheenShift).toFixed(2)}px, 0)`;

  const noiseTransform = reducedMotion
    ? 'translate3d(0,0,0)'
    : `translate3d(${(px * noiseShift).toFixed(2)}px, ${(py * noiseShift).toFixed(2)}px, 0)`;

  const lineTransform = reducedMotion
    ? 'translate3d(0,0,0)'
    : `translate3d(${(-px * lineShift).toFixed(2)}px, ${(py * lineShift).toFixed(2)}px, 0)`;

  // --- glass building blocks ---
  const glassBase =
    'relative overflow-hidden rounded-2xl ' +
    'bg-black/40 backdrop-blur-xl ' +
    'shadow-[0_18px_48px_rgba(0,0,0,0.65)] ' +
    'transition-all duration-300';

  const glassOuterBorder =
    'border border-white/14 hover:border-white/24';

  const glassInnerBorder =
    'pointer-events-none absolute inset-[1px] rounded-[14px] ' +
    'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]';

  const glassSheen =
    'pointer-events-none absolute inset-0 ' +
    'bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.10),transparent_55%),' +
    'radial-gradient(circle_at_82%_65%,rgba(0,240,255,0.08),transparent_55%)] ' +
    'opacity-90';

  const glassNoise =
    'pointer-events-none absolute inset-0 opacity-[0.035] ' +
    'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\' viewBox=\'0 0 140 140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'140\' height=\'140\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")]';

  const rowBase =
    glassBase +
    ' ' +
    glassOuterBorder +
    ' p-6';

  // Nota: el parallax solo se siente en los layers (sheen/noise/lines),
  // el texto NO se mueve para que se mantenga legible y “pro”.

  return (
    <div
      ref={wrapRef}
      className="flex flex-col justify-start h-full"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* TOP CONTENT */}
      <div className="animate-fade-up space-y-10" style={{ animationDelay: '0.1s' }}>
        <div className={cx('text-[12px] font-code tracking-[0.42em] text-gold font-black opacity-90', GLOW.GOLD_C)}>
          OEM PEDIGREE
        </div>

        {/* HEADLINE */}
        <div className="relative pl-6 border-l-2 border-gold/55">
          <p
            className="text-offwhite font-medium leading-[1.12]"
            style={{ fontSize: '36px' }}
          >
            La mancuerna natural:
            <br />
            <span className={cx('text-gold font-bold', GLOW.GOLD_C)}>
              Diseño CAD
            </span>{' '}
            +{' '}
            <span className={cx('text-cyan font-bold', GLOW.CYAN_C)}>
              Disciplina OEM
            </span>.
          </p>
        </div>

        {/* BODY */}
        <p
          className="text-gray-300 leading-relaxed max-w-xl"
          style={{ fontSize: '21px' }}
        >
          Tu hijo aporta{' '}
          <strong className={cx('text-white', GLOW.WHITE_C)}>
            modelos y librerías
          </strong>.{' '}
          Yo aporto{' '}
          <strong className={cx('text-white', GLOW.WHITE_C)}>
            estándares y seguridad
          </strong>.
          <br />
          <span
            className="text-gray-400 block mt-2"
            style={{ fontSize: '15px' }}
          >
            Esto convierte “dibujos” en{' '}
            <strong className={cx('text-white', GLOW.WHITE_C)}>
              Ingeniería Auditable
            </strong>.
          </span>
        </p>

        {/* SPEC CARDS */}
        <div className="space-y-6 font-code" style={{ fontSize: '14px' }}>
          {/* 01 */}
          <div className={cx(rowBase, 'group hover:border-cyan/35')}>
            <div className={glassInnerBorder} />

            {/* PARALLAX LAYERS */}
            <div
              className={glassSheen}
              style={{ transform: sheenTransform, transition: 'transform 180ms ease-out' }}
            />
            <div
              className={glassNoise}
              style={{ transform: noiseTransform, transition: 'transform 220ms ease-out' }}
            />

            <div className="relative z-10 flex items-start gap-6">
              <span
                className={cx(
                  'text-cyan',
                  GLOW.CYAN_C,
                  'transition-all duration-200',
                  'drop-shadow-[0_0_10px_rgba(0,240,255,0.35)]',
                  'group-hover:drop-shadow-[0_0_18px_rgba(0,240,255,0.55)]'
                )}
                style={{
                  fontSize: '20px',
                  textShadow: '0 0 14px rgba(0,240,255,0.45), 0 0 30px rgba(0,240,255,0.24)',
                }}
              >
                01
              </span>
              <div className="flex-1">
                <strong
                  className={cx(
                    'text-white block tracking-widest text-[12px] mb-2 uppercase',
                    'transition-all duration-200',
                    'drop-shadow-[0_0_10px_rgba(0,240,255,0.30)]',
                    'group-hover:drop-shadow-[0_0_18px_rgba(0,240,255,0.48)]'
                  )}
                  style={{
                    textShadow: '0 0 14px rgba(0,240,255,0.35), 0 0 28px rgba(0,240,255,0.18)',
                  }}
                >
                  INPUT: CAD
                </strong>
                <span className="text-gray-300/90">
                  Fixtures + Herramentales + Planos controlados.
                </span>
              </div>
            </div>

            <div
              className="pointer-events-none absolute left-6 right-6 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan/45 to-transparent opacity-45"
              style={{ transform: lineTransform, transition: 'transform 200ms ease-out' }}
            />
          </div>

          {/* 02 */}
          <div className={cx(rowBase, 'group hover:border-gold/35')}>
            <div className={glassInnerBorder} />

            {/* PARALLAX LAYERS */}
            <div
              className={glassSheen}
              style={{ transform: sheenTransform, transition: 'transform 180ms ease-out' }}
            />
            <div
              className={glassNoise}
              style={{ transform: noiseTransform, transition: 'transform 220ms ease-out' }}
            />

            <div className="relative z-10 flex items-start gap-6">
              <span
                className={cx(
                  'text-gold',
                  GLOW.GOLD_C,
                  'transition-all duration-200',
                  'drop-shadow-[0_0_10px_rgba(171,123,38,0.38)]',
                  'group-hover:drop-shadow-[0_0_18px_rgba(171,123,38,0.58)]'
                )}
                style={{
                  fontSize: '20px',
                  textShadow: '0 0 14px rgba(171,123,38,0.46), 0 0 30px rgba(171,123,38,0.26)',
                }}
              >
                02
              </span>

              <div className="flex-1">
                <strong
                  className={cx(
                    'text-white block tracking-widest text-[12px] mb-2 uppercase',
                    'transition-all duration-200',
                    'drop-shadow-[0_0_10px_rgba(171,123,38,0.32)]',
                    'group-hover:drop-shadow-[0_0_18px_rgba(171,123,38,0.50)]'
                  )}
                  style={{
                    textShadow: '0 0 14px rgba(171,123,38,0.38), 0 0 28px rgba(171,123,38,0.20)',
                  }}
                >
                  PROCESS: OEM
                </strong>

                <span className="text-gray-300/90">
                  SOP + Checklist + Evidencia Técnica.
                </span>
              </div>
            </div>

            <div
              className="pointer-events-none absolute left-6 right-6 bottom-4 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent opacity-45"
              style={{ transform: lineTransform, transition: 'transform 200ms ease-out' }}
            />
          </div>

          {/* 03 */}
          <div className={cx(rowBase, 'group hover:border-green-400/30')}>
            <div className={glassInnerBorder} />

            {/* PARALLAX LAYERS */}
            <div
              className={glassSheen}
              style={{ transform: sheenTransform, transition: 'transform 180ms ease-out' }}
            />
            <div
              className={glassNoise}
              style={{ transform: noiseTransform, transition: 'transform 220ms ease-out' }}
            />

            <div className="relative z-10 flex items-start gap-6">
              <span
                className={cx(
                  'text-green-400',
                  GLOW.GREEN_C,
                  'transition-all duration-200',
                  'drop-shadow-[0_0_10px_rgba(74,222,128,0.32)]',
                  'group-hover:drop-shadow-[0_0_18px_rgba(74,222,128,0.52)]'
                )}
                style={{
                  fontSize: '20px',
                  textShadow: '0 0 14px rgba(74,222,128,0.38), 0 0 30px rgba(74,222,128,0.20)',
                }}
              >
                03
              </span>

              <div className="flex-1">
                <strong
                  className={cx(
                    'text-white block tracking-widest text-[12px] mb-2 uppercase',
                    'transition-all duration-200',
                    'drop-shadow-[0_0_10px_rgba(74,222,128,0.26)]',
                    'group-hover:drop-shadow-[0_0_18px_rgba(74,222,128,0.42)]'
                  )}
                  style={{
                    textShadow: '0 0 14px rgba(74,222,128,0.30), 0 0 28px rgba(74,222,128,0.16)',
                  }}
                >
                  EFFECT: ROI
                </strong>

                <span className="text-gray-300/90">
                  Menos retrabajo. Menos riesgo. Velocidad.
                </span>
              </div>
            </div>

            <div
              className="pointer-events-none absolute left-6 right-6 bottom-4 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent opacity-40"
              style={{ transform: lineTransform, transition: 'transform 200ms ease-out' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   MAIN SLIDE
===================================================== */
interface Slide06Props {
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (idx: number) => void;
  openModal: (images: string[], title: string) => void;
}

export const Slide06: React.FC<Slide06Props> = ({ nextSlide, prevSlide }) => {
  const ambientLine = useMemo(
    () =>
      'border-t [mask-image:repeating-linear-gradient(90deg,#000_0_8px,transparent_8px_14px)] border-cyan/25 bg-cyan/12 opacity-45',
    []
  );

  return (
    <div data-stable-id="slide06-root" className="w-full h-full">
      <SlideContainer>
      <Header title="CAD + INGENIERÍA" breadcrumb="FUTURO" slideNum={7} />

      {/* Ambient layers — pointer-events-none to never block NavArea */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_25%_15%,rgba(0,240,255,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_70%_70%,rgba(171,123,38,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0,rgba(255,255,255,0.02)_1px,transparent_2px)] bg-[length:100%_18px] opacity-[0.12]" />

      {/* Subtle midline hints */}
      <div className={cx('pointer-events-none absolute top-1/2 left-[38%] w-[10%] h-[2px]', ambientLine)} />
      <div className={cx('pointer-events-none absolute top-1/2 right-[6%] w-[10%] h-[2px]', ambientLine)} />

      {/* Main content (NO scale — avoids blocking Next/Prev) */}
      <div className="grid grid-cols-[35%_65%] gap-12 items-start h-full pt-8 px-5 pb-24">
        <LeftNarrative />

        <div className="h-full flex items-start justify-center">
          <HolographicBlueprint />
        </div>
           </div>

      {/* INVITACIÓN (FOOTER) — debajo de instrucciones, arriba del NAV */}
      <div className="pointer-events-none absolute right-[6%] bottom-[100px] flex justify-end">
        <div
          className={cx(
            'pointer-events-auto',
            'group relative overflow-hidden rounded-2xl',
            'w-[820px] max-w-[92%]',
            'bg-black/45 backdrop-blur-xl',
            'border border-white/14 hover:border-cyan/35',
            'shadow-[0_16px_48px_rgba(0,0,0,0.70)]',
            'hover:shadow-[0_0_34px_rgba(0,240,255,0.18),0_16px_58px_rgba(0,0,0,0.75)]',
            'transition-all duration-300',
            'px-6 py-4'
          )}
        >
          {/* OUTER GLOW HALO */}
          <div
            className="pointer-events-none absolute -inset-1 rounded-[18px] opacity-15 group-hover:opacity-55 transition-opacity duration-300
                       bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.26),transparent_55%),
                           radial-gradient(circle_at_80%_70%,rgba(0,240,255,0.18),transparent_60%)]"
          />

          {/* Double border */}
          <div className="pointer-events-none absolute inset-[1px] rounded-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

          {/* Sheen */}
          <div
            className="pointer-events-none absolute inset-0 opacity-90
              bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.10),transparent_55%),
                  radial-gradient(circle_at_82%_65%,rgba(0,240,255,0.08),transparent_55%)]"
          />

          {/* Top/Bottom highlight */}
          <div className="pointer-events-none absolute left-6 right-6 top-3 h-px bg-gradient-to-r from-transparent via-cyan/45 to-transparent opacity-45" />
          <div className="pointer-events-none absolute left-6 right-6 bottom-3 h-px bg-gradient-to-r from-transparent via-cyan/45 to-transparent opacity-45" />

          <div className="relative z-10 flex items-start justify-between gap-6">
            <div>
              <div
                className={cx(
                  'text-cyan font-code tracking-[4px] font-bold uppercase',
                  'drop-shadow-[0_0_14px_rgba(0,240,255,0.26)]',
                  'glow-breath-cyan' //
                )}
                style={{
                  fontSize: '13px',
                  textShadow: '0 0 14px rgba(0,240,255,0.28), 0 0 32px rgba(0,240,255,0.16)',
                }}
              >
                INVITACIÓN HITECH
              </div>

              <p
                className="mt-2 text-gray-200 leading-relaxed"
                style={{
                  fontSize: '14px',
                  textShadow: '0 0 12px rgba(255,255,255,0.08)',
                }}
              >
                Tu hijo entra a aprender el sistema:{' '}
                <strong
                  className={cx('text-white', GLOW.WHITE_C)}
                  style={{
                    textShadow: '0 0 12px rgba(255,255,255,0.14), 0 0 22px rgba(0,240,255,0.10)',
                  }}
                >
                  diseño con estándares
                </strong>
                , no solo “dibujos bonitos”.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-cyan/25 bg-black/35 backdrop-blur-md hover:border-cyan/40 hover:shadow-[0_0_22px_rgba(0,240,255,0.16)] transition-all">
                <span className="w-2 h-2 rounded-full bg-cyan/70 shadow-[0_0_12px_rgba(0,240,255,0.18)]" />
                <span
                  className="font-code text-[11px] tracking-[0.28em] uppercase text-cyan/85"
                  style={{
                    textShadow: '0 0 14px rgba(0,240,255,0.22), 0 0 28px rgba(0,240,255,0.12)',
                  }}
                >
                  LISTO PARA OEM
                </span>
              </span>

              <span
                className="text-cyan/70 text-sm"
                style={{ textShadow: '0 0 14px rgba(0,240,255,0.18)' }}
              >
                →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav (kept clean) */}
      <NavArea prev={prevSlide} next={nextSlide} />


      {/* Local-only CSS */}
      <style>{`
  button { -webkit-tap-highlight-color: transparent; }

  /* ===== Fade Up ===== */
  .animate-fade-up {
    animation: fadeUp 520ms ease-out both;
  }
  @keyframes fadeUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0px); }
  }

  /* ===== Glow Breath (INVITACIÓN HITECH) ===== */
  @keyframes glowBreathCyan {
    0%, 100% {
      opacity: 0.88;
      text-shadow:
        0 0 12px rgba(0,240,255,0.22),
        0 0 22px rgba(0,240,255,0.14);
      filter: drop-shadow(0 0 10px rgba(0,240,255,0.16));
    }
    50% {
      opacity: 1;
      text-shadow:
        0 0 18px rgba(0,240,255,0.36),
        0 0 34px rgba(0,240,255,0.20);
      filter: drop-shadow(0 0 16px rgba(0,240,255,0.24));
    }
  }

  .glow-breath-cyan {
    animation: glowBreathCyan 2.4s ease-in-out infinite;
    will-change: filter, text-shadow, opacity;
  }

  /* ===== Reduced Motion Safety ===== */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-up { animation: none !important; }
    .glow-breath-cyan { animation: none !important; }
  }
`}</style>

      </SlideContainer>
    </div>
  );
};


export default Slide06;
