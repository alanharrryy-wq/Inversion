import React, { useEffect, useRef } from "react";

type V = { x: number; y: number; vx: number; vy: number; t: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Background() {
  const rafTickRef = useRef<number | null>(null);
  const rafMoveRef = useRef<number | null>(null);
  const last = useRef<V>({ x: 0.5, y: 0.5, vx: 0, vy: 0, t: performance.now() });
  const moveEventRef = useRef<PointerEvent | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    const setVars = (x: number, y: number, vx: number, vy: number) => {
      const sx = Number.isFinite(x) ? clamp(x, 0, 1) : 0.5;
      const sy = Number.isFinite(y) ? clamp(y, 0, 1) : 0.5;
      const svx = Number.isFinite(vx) ? vx : 0;
      const svy = Number.isFinite(vy) ? vy : 0;
      const velocity = clamp(Math.sqrt(svx * svx + svy * svy), 0, 2.2);

      root.style.setProperty("--mx", String(sx));
      root.style.setProperty("--my", String(sy));
      root.style.setProperty("--mv", String(velocity));
    };

    const flushMove = () => {
      rafMoveRef.current = null;
      const e = moveEventRef.current;
      if (!e) return;

      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      const x = clamp(e.clientX / width, 0, 1);
      const y = clamp(e.clientY / height, 0, 1);

      const now = performance.now();
      const dt = Math.max(16, now - last.current.t);
      const seconds = dt / 1000;

      const vx = (x - last.current.x) / seconds;
      const vy = (y - last.current.y) / seconds;

      last.current = { x, y, vx, vy, t: now };
      setVars(x, y, vx, vy);
    };

    const onMove = (e: PointerEvent) => {
      moveEventRef.current = e;
      if (rafMoveRef.current !== null) return;
      rafMoveRef.current = requestAnimationFrame(flushMove);
    };

    // idle defaults
    setVars(0.5, 0.5, 0, 0);

    window.addEventListener("pointermove", onMove, { passive: true });

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) {
      root.style.setProperty("--bt", "0");
    } else {
      // time var for slow drift
      let t0 = performance.now();
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        root.style.setProperty("--bt", String(t));
        rafTickRef.current = requestAnimationFrame(tick);
      };
      rafTickRef.current = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafTickRef.current !== null) cancelAnimationFrame(rafTickRef.current);
      if (rafMoveRef.current !== null) cancelAnimationFrame(rafMoveRef.current);
      rafTickRef.current = null;
      rafMoveRef.current = null;
      moveEventRef.current = null;
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
