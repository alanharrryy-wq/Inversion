
import React, { useMemo } from 'react';
import { DensityPreset } from '../tokens/colors';
import { ViewportMetrics } from './useViewportMetrics';

export function PowerConsoleFrame(props: {
  preset: DensityPreset;
  metrics: ViewportMetrics;
  children: React.ReactNode;
}) {
  const frameStyle = useMemo(
    () =>
      ({
        '--boot-fit-top-area': `${props.metrics.topAreaHeight}px`,
        '--boot-fit-body-area': `${props.metrics.bodyAreaHeight}px`,
        '--boot-fit-nav-area': `${props.metrics.navAreaHeight}px`,
        '--boot-side-scroll-height': `${props.metrics.sideScrollHeight}px`,
      }) as React.CSSProperties,
    [
      props.metrics.topAreaHeight,
      props.metrics.bodyAreaHeight,
      props.metrics.navAreaHeight,
      props.metrics.sideScrollHeight,
    ]
  );

  return (
    <div
      className="slide00-power-console-frame"
      data-density={props.preset}
      data-compact={props.metrics.compactViewport ? 'true' : 'false'}
      data-orientation={props.metrics.orientation}
      style={frameStyle}
    >
      {props.children}
    </div>
  );
}

