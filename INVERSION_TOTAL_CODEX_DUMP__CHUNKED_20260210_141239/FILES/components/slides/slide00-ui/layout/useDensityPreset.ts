
import { useMemo } from 'react';
import { DensityPreset } from '../tokens/colors';
import { ViewportMetrics } from './useViewportMetrics';

export type DensityPresetReason = {
  preset: DensityPreset;
  reason: string;
};

function choosePreset(metrics: ViewportMetrics): DensityPresetReason {
  if (metrics.viewportWidth <= 1080 || metrics.viewportHeight <= 680) {
    return {
      preset: 'ultra-compact',
      reason: 'viewport-below-1080x680',
    };
  }

  if (metrics.compactViewport) {
    return {
      preset: 'compact',
      reason: 'compact-viewport',
    };
  }

  if (metrics.roomyViewport && metrics.aspect >= 1.75) {
    return {
      preset: 'cinematic',
      reason: 'wide-roomy-viewport',
    };
  }

  if (metrics.roomyViewport) {
    return {
      preset: 'comfortable',
      reason: 'roomy-viewport',
    };
  }

  return {
    preset: 'balanced',
    reason: 'default-balanced',
  };
}

export function useDensityPreset(metrics: ViewportMetrics): DensityPresetReason {
  return useMemo(() => choosePreset(metrics), [
    metrics.viewportWidth,
    metrics.viewportHeight,
    metrics.compactViewport,
    metrics.roomyViewport,
    metrics.aspect,
  ]);
}

