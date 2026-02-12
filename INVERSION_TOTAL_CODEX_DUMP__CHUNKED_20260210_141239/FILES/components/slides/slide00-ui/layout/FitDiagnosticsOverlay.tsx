
import React from 'react';
import { DensityPreset } from '../tokens/colors';
import { ViewportMetrics } from './useViewportMetrics';

export function FitDiagnosticsOverlay(props: {
  enabled: boolean;
  preset: DensityPreset;
  presetReason: string;
  metrics: ViewportMetrics;
}) {
  if (!props.enabled) return null;

  const rows = [
    ['density', props.preset],
    ['reason', props.presetReason],
    ['viewport', `${props.metrics.viewportWidth}x${props.metrics.viewportHeight}`],
    ['base', `${props.metrics.baseWidth}x${props.metrics.baseHeight}`],
    ['scale', props.metrics.scale.toFixed(4)],
    ['scale-x', props.metrics.scaleX.toFixed(4)],
    ['scale-y', props.metrics.scaleY.toFixed(4)],
    ['aspect', props.metrics.aspect.toFixed(4)],
    ['orientation', props.metrics.orientation],
    ['compact', String(props.metrics.compactViewport)],
    ['top-area', `${props.metrics.topAreaHeight}px`],
    ['body-area', `${props.metrics.bodyAreaHeight}px`],
    ['nav-area', `${props.metrics.navAreaHeight}px`],
    ['side-scroll', `${props.metrics.sideScrollHeight}px`],
  ];

  return (
    <div className="slide00-fit-diagnostics" aria-hidden="true">
      <h4 className="slide00-fit-diagnostics-title">FIT DIAGNOSTICS</h4>
      <ul className="slide00-fit-diagnostics-list">
        {rows.map(([key, value]) => (
          <li key={key} className="slide00-fit-diagnostics-row">
            <span className="slide00-fit-diagnostics-key">{key}</span>
            <span className="slide00-fit-diagnostics-value">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

