import React from "react";
import type { KpiMode } from "./kpi.hooks";
import { HITECH_TOKENS } from "./kpi.data";

export const KpiScene: React.FC<{ mode: KpiMode; reducedMotion?: boolean }> = ({
  mode,
  reducedMotion,
}) => {
  const showVignette = mode === "locked";
  const showScan = !reducedMotion && (mode === "active" || mode === "locked");

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Blueprint grid sutil */}
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

      {/* Scanline tenue (placeholder) */}
      {showScan && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0) 40%, rgba(0,240,255,0.03) 60%, rgba(0,0,0,0))",
            opacity: 0.6,
          }}
        />
      )}

      {/* Focus vignette (placeholder) */}
      {showVignette && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      )}

      {/* Authority stamp (placeholder) */}
      <div
        className="absolute top-6 right-10 text-xs font-code tracking-[0.25em] border px-3 py-2 rounded"
        style={{
          borderColor: `${HITECH_TOKENS.gold}66`,
          color: HITECH_TOKENS.gold,
          background: "rgba(0,0,0,0.35)",
          opacity: 0.85,
        }}
      >
        VERIFIED // OEM READY
      </div>
    </div>
  );
};
