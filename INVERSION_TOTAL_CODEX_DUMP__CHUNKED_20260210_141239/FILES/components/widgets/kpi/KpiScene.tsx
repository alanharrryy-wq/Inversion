
import React, { useEffect, useMemo, useState } from "react";
import type { KpiMode } from "./kpi.hooks";
import { HITECH_TOKENS } from "./kpi.data";

type Props = { mode: KpiMode; reducedMotion?: boolean };

function useOneShot(delayMs: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);
  return on;
}

export const KpiScene: React.FC<Props> = ({ mode, reducedMotion }) => {
  const isLocked = mode === "locked";
  const isActive = mode === "active" || mode === "locked";

  // ✅ Stamp 1-shot
  const stampOn = useOneShot(reducedMotion ? 0 : 280);

  // ✅ Edge glow: suave en tracking, más fuerte en locked
  const edgeOpacity = useMemo(() => {
    if (isLocked) return 0.95;
    if (isActive) return 0.35;
    return 0.15;
  }, [isLocked, isActive]);

  // ✅ BIGGER FRAME: antes era inset-8 (muy chico y se encimaba)
  // ahora lo hacemos MÁS GRANDE y con radio consistente
  const FRAME_INSET = 12; // px (equivale aprox a "inset-3")
  const FRAME_RADIUS = 22; // px

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Blueprint grid estable */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 0.12,
          mixBlendMode: "screen",
        }}
      />

      {/* Vignette SOLO en LOCKED */}
      {isLocked && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      )}

      {/* ======================================================
          ✅ Edge Glow + Sweep (BIGGER RECT)
         ====================================================== */}
      <div
        className="absolute inset-0"
        style={{
          opacity: edgeOpacity,
          transition: "opacity 220ms ease",
        }}
      >
        {/* Marco base tenue (mismo rect que sweep) */}
        <div
          className="absolute"
          style={{
            top: FRAME_INSET,
            right: FRAME_INSET,
            bottom: FRAME_INSET,
            left: FRAME_INSET,
            borderRadius: FRAME_RADIUS,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        />

        {/* Sweep layer (mismo rect que base) */}
        <div
          className={[
            "absolute",
            !reducedMotion && isLocked ? "kpi-edge-sweep" : "",
          ].join(" ")}
          style={{
            top: FRAME_INSET,
            right: FRAME_INSET,
            bottom: FRAME_INSET,
            left: FRAME_INSET,
            borderRadius: FRAME_RADIUS,

            // fallback sutil si no locked (para que se vea “vivo” pero sin animar)
            boxShadow: !isLocked
              ? "inset 0 0 0 1px rgba(0,240,255,0.14)"
              : "inset 0 0 0 1px rgba(0,240,255,0.08)",
          }}
        />
      </div>

      {/* ======================================================
          ✅ Authority Stamp (fade + glow 1-shot)
         ====================================================== */}
      <div
        className="absolute top-6 right-10"
        style={{
          transform: stampOn ? "translateY(0px)" : "translateY(-6px)",
          opacity: stampOn ? 0.92 : 0,
          transition: reducedMotion
            ? "opacity 120ms ease"
            : "opacity 520ms ease, transform 520ms ease",
        }}
      >
        <div
          className="text-xs font-code tracking-[0.25em] border px-3 py-2 rounded"
          style={{
            borderColor: `${HITECH_TOKENS.gold}66`,
            color: HITECH_TOKENS.gold,
            background: "rgba(0,0,0,0.35)",
            boxShadow: stampOn ? `0 0 22px ${HITECH_TOKENS.gold}30` : "none",
          }}
        >
          VERIFIED // OEM READY
        </div>
      </div>

      {/* Inline CSS (AI Studio friendly, no global) */}
      <style>{`
        @keyframes kpiEdgeSweep {
          0%   { box-shadow:
            inset 0 2px 0 rgba(0,240,255,0.00),
            inset -2px 0 0 rgba(0,240,255,0.00),
            inset 0 -2px 0 rgba(0,240,255,0.00),
            inset 2px 0 0 rgba(0,240,255,0.00);
          }
          25%  { box-shadow:
            inset 0 2px 0 rgba(0,240,255,0.45),
            inset -2px 0 0 rgba(0,240,255,0.00),
            inset 0 -2px 0 rgba(0,240,255,0.00),
            inset 2px 0 0 rgba(0,240,255,0.00);
          }
          50%  { box-shadow:
            inset 0 2px 0 rgba(0,240,255,0.18),
            inset -2px 0 0 rgba(0,240,255,0.45),
            inset 0 -2px 0 rgba(0,240,255,0.00),
            inset 2px 0 0 rgba(0,240,255,0.00);
          }
          75%  { box-shadow:
            inset 0 2px 0 rgba(0,240,255,0.10),
            inset -2px 0 0 rgba(0,240,255,0.18),
            inset 0 -2px 0 rgba(0,240,255,0.45),
            inset 2px 0 0 rgba(0,240,255,0.00);
          }
          100% { box-shadow:
            inset 0 2px 0 rgba(0,240,255,0.00),
            inset -2px 0 0 rgba(0,240,255,0.10),
            inset 0 -2px 0 rgba(0,240,255,0.18),
            inset 2px 0 0 rgba(0,240,255,0.45);
          }
        }

        .kpi-edge-sweep {
          animation: kpiEdgeSweep 1.8s ease-in-out infinite;
          filter: drop-shadow(0 0 14px rgba(0,240,255,0.10));
        }
      `}</style>
    </div>
  );
};

