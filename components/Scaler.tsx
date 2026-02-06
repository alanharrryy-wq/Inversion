// components/Scaler.tsx

// [B1] Imports
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSlideMeta } from "./SlideRuntime";

// [B2] Types + utils
type Props = {
  slideIndex: number;
  baseW?: number;
  baseH?: number;
  children: React.ReactNode;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// [B3] Component
export default function Scaler({ slideIndex, baseW = 1600, baseH = 900, children }: Props) {
  const meta = useMemo(() => getSlideMeta(slideIndex), [slideIndex]);

  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const lastKeyRef = useRef<string>("");
  const lockedScaleRef = useRef<number | null>(null);

  const [scale, setScale] = useState(1);

  // [B4] Compute
  const compute = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const key = `${vw}x${vh}`;

    // Override manda sobre todo
    if (typeof meta.scalerOverride === "number") {
      const s = clamp(meta.scalerOverride, meta.scalerMin ?? 0.5, meta.scalerMax ?? 1.0);
      if (meta.scalerLock) lockedScaleRef.current = s;
      setScale(s);
      lastKeyRef.current = key;
      return;
    }

    // Lock: si ya hay valor, no recalcula
    if (meta.scalerLock && lockedScaleRef.current !== null) {
      setScale(lockedScaleRef.current);
      lastKeyRef.current = key;
      return;
    }

    // Cache por viewport
    if (lastKeyRef.current === key) return;

    const raw = Math.min(vw / baseW, vh / baseH);
    const s = clamp(raw, meta.scalerMin ?? 0.5, meta.scalerMax ?? 1.0);

    if (meta.scalerLock) lockedScaleRef.current = s;

    setScale(s);
    lastKeyRef.current = key;
  };

  // [B5] Scheduler
  const schedule = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(compute);
  };

  // [B6] Effects + Render
  useEffect(() => {
    // Reset por slide
    lockedScaleRef.current = null;
    lastKeyRef.current = "";
    schedule();

    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(() => schedule());
    roRef.current.observe(document.documentElement);

    window.addEventListener("orientationchange", schedule);
    window.addEventListener("resize", schedule);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      roRef.current?.disconnect();
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex, baseW, baseH, meta.scalerLock, meta.scalerOverride, meta.scalerMin, meta.scalerMax]);

  return (
    <div
      style={{
        width: baseW,
        height: baseH,
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
}
