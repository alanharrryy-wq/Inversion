import { useEffect, useMemo, useState } from 'react';

export type OrientationMode = 'landscape' | 'portrait';

export type ViewportMetrics = {
  viewportWidth: number;
  viewportHeight: number;
  baseWidth: number;
  baseHeight: number;
  scaleX: number;
  scaleY: number;
  scale: number;
  inverseScale: number;
  aspect: number;
  orientation: OrientationMode;
  compactWidth: boolean;
  compactHeight: boolean;
  compactViewport: boolean;
  roomyViewport: boolean;
  topAreaHeight: number;
  bodyAreaHeight: number;
  navAreaHeight: number;
  sideScrollHeight: number;
};

export type ViewportConfig = {
  baseWidth?: number;
  baseHeight?: number;
  topAreaRatio?: number;
  navAreaRatio?: number;
};

type WindowSize = {
  width: number;
  height: number;
};

function fallbackWindowSize(baseWidth: number, baseHeight: number): WindowSize {
  if (typeof window === 'undefined') {
    return { width: baseWidth, height: baseHeight };
  }

  return {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
  };
}

function toWindowSize(baseWidth: number, baseHeight: number): WindowSize {
  if (typeof window === 'undefined') {
    return { width: baseWidth, height: baseHeight };
  }

  const width = Number.isFinite(window.innerWidth) ? window.innerWidth : baseWidth;
  const height = Number.isFinite(window.innerHeight) ? window.innerHeight : baseHeight;
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function computeMetrics(size: WindowSize, config: Required<ViewportConfig>): ViewportMetrics {
  const { width, height } = size;
  const baseWidth = config.baseWidth;
  const baseHeight = config.baseHeight;

  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;
  const scale = Math.min(scaleX, scaleY);
  const inverseScale = scale > 0 ? 1 / scale : 1;
  const aspect = width / height;
  const orientation: OrientationMode = aspect >= 1 ? 'landscape' : 'portrait';

  const compactWidth = width < 1280;
  const compactHeight = height < 820;
  const compactViewport = compactWidth || compactHeight;
  const roomyViewport = width >= 1600 && height >= 900;

  const topAreaHeight = Math.round(baseHeight * config.topAreaRatio * inverseScale);
  const navAreaHeight = Math.round(baseHeight * config.navAreaRatio * inverseScale);
  const bodyAreaHeight = Math.max(
    260,
    Math.round(baseHeight * inverseScale) - topAreaHeight - navAreaHeight
  );

  const sideScrollHeight = Math.max(
    220,
    Math.round(bodyAreaHeight - (compactViewport ? 26 : 34))
  );

  return {
    viewportWidth: width,
    viewportHeight: height,
    baseWidth,
    baseHeight,
    scaleX,
    scaleY,
    scale,
    inverseScale,
    aspect,
    orientation,
    compactWidth,
    compactHeight,
    compactViewport,
    roomyViewport,
    topAreaHeight,
    bodyAreaHeight,
    navAreaHeight,
    sideScrollHeight,
  };
}

const DEFAULT_CONFIG: Required<ViewportConfig> = {
  baseWidth: 1600,
  baseHeight: 900,
  topAreaRatio: 0.24,
  navAreaRatio: 0.13,
};

export function useViewportMetrics(config: ViewportConfig = {}): ViewportMetrics {
  const merged = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const [size, setSize] = useState<WindowSize>(() =>
    fallbackWindowSize(merged.baseWidth, merged.baseHeight)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frame = 0;

    const handleResize = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setSize(toWindowSize(merged.baseWidth, merged.baseHeight));
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    handleResize();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [merged.baseWidth, merged.baseHeight]);

  return useMemo(() => computeMetrics(size, merged), [
    size,
    merged.baseWidth,
    merged.baseHeight,
    merged.topAreaRatio,
    merged.navAreaRatio,
  ]);
}
