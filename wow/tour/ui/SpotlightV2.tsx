import React, { useEffect, useMemo, useRef, useState } from 'react';

export type SpotlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

type Props = {
  active: boolean;
  rect: SpotlightRect | null;
  phaseClass: string;
  reducedMotion: boolean;
  enableBlur: boolean;
};

type FrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

function defaultRect(): FrameRect {
  return { left: 0, top: 0, width: 0, height: 0, radius: 12 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothFactor(dtMs: number): number {
  const factor = dtMs / 120;
  return Math.max(0.08, Math.min(0.38, factor));
}

export function SpotlightV2(props: Props) {
  const { active, rect, phaseClass, reducedMotion, enableBlur } = props;
  const [frameRect, setFrameRect] = useState<FrameRect>(defaultRect);
  const targetRef = useRef<FrameRect>(defaultRect());
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!rect) return;
    targetRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      radius: rect.radius,
    };
  }, [rect]);

  useEffect(() => {
    if (!active || !rect) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return;
    }

    if (reducedMotion) {
      setFrameRect(targetRef.current);
      return;
    }

    const animate = (now: number) => {
      const prevTs = lastTimeRef.current || now;
      const dt = Math.max(10, now - prevTs);
      lastTimeRef.current = now;
      const f = smoothFactor(dt);

      setFrameRect((prev) => {
        const next: FrameRect = {
          left: lerp(prev.left, targetRef.current.left, f),
          top: lerp(prev.top, targetRef.current.top, f),
          width: lerp(prev.width, targetRef.current.width, f),
          height: lerp(prev.height, targetRef.current.height, f),
          radius: lerp(prev.radius, targetRef.current.radius, f),
        };
        return next;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTimeRef.current = 0;
    };
  }, [active, rect, reducedMotion]);

  const style = useMemo<React.CSSProperties>(() => ({
    left: `${Math.round(frameRect.left)}px`,
    top: `${Math.round(frameRect.top)}px`,
    width: `${Math.round(frameRect.width)}px`,
    height: `${Math.round(frameRect.height)}px`,
    borderRadius: `${Math.round(frameRect.radius)}px`,
  }), [frameRect]);

  return (
    <>
      <div className={`wow-tour-v2__dim ${phaseClass}`} />
      <div className={`wow-tour-v2__mask ${phaseClass} ${enableBlur ? 'wow-tour-v2__mask--blur' : ''}`} />
      <div className={`wow-tour-v2__focus ${phaseClass}`} style={style} />
      <div className={`wow-tour-v2__ring-a ${phaseClass}`} style={style} />
      <div className={`wow-tour-v2__ring-b ${phaseClass}`} style={style} />
      <div className={`wow-tour-v2__zoom ${phaseClass}`} style={style} />
    </>
  );
}
