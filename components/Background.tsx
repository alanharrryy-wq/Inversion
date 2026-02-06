import React, { useEffect, useRef } from "react";

type V = { x: number; y: number; vx: number; vy: number; t: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Background() {
  const raf = useRef<number | null>(null);
  const last = useRef<V>({ x: 0.5, y: 0.5, vx: 0, vy: 0, t: performance.now() });

  useEffect(() => {
    const root = document.documentElement;

    const setVars = (x: number, y: number, vx: number, vy: number) => {
      root.style.setProperty("--mx", String(x));
      root.style.setProperty("--my", String(y));
      root.style.setProperty("--mv", String(clamp(Math.sqrt(vx * vx + vy * vy), 0, 2.2)));
    };

    const onMove = (e: PointerEvent) => {
      if (raf.current) return;

      raf.current = requestAnimationFrame(() => {
        raf.current = null;

        const x = clamp(e.clientX / window.innerWidth, 0, 1);
        const y = clamp(e.clientY / window.innerHeight, 0, 1);

        const now = performance.now();
        const dt = Math.max(16, now - last.current.t);

        const vx = (x - last.current.x) / (dt / 1000);
        const vy = (y - last.current.y) / (dt / 1000);

        last.current = { x, y, vx, vy, t: now };
        setVars(x, y, vx, vy);
      });
    };

    // idle defaults
    setVars(0.5, 0.5, 0, 0);

    window.addEventListener("pointermove", onMove, { passive: true });

    // time var for slow drift
    let t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      root.style.setProperty("--bt", String(t));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, []);

  return (
    <div className="app-bg" aria-hidden="true">
      <div className="app-bg__base" />
      <div className="app-bg__chromatic" />
      <div className="app-bg__beam" />
      <div className="app-bg__grid" />
      <div className="app-bg__noise" />
      <div className="app-bg__vignette" />
    </div>
  );
}
