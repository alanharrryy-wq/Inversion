import React, { useMemo } from 'react';
import type { DensityPreset } from './colors';
import { buildSlide00TokenVars, varsToCssProperties } from './index';

export function TokenBridge(props: {
  preset: DensityPreset;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  compactViewport: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const tokenVars = useMemo(
    () =>
      buildSlide00TokenVars({
        preset: props.preset,
        width: props.width,
        height: props.height,
        scaleX: props.scaleX,
        scaleY: props.scaleY,
        compactViewport: props.compactViewport,
      }),
    [props.preset, props.width, props.height, props.scaleX, props.scaleY, props.compactViewport]
  );

  return (
    <div
      className={props.className}
      style={varsToCssProperties(tokenVars)}
      data-density={props.preset}
      data-fit={props.compactViewport ? 'compact' : 'full'}
    >
      {props.children}
    </div>
  );
}
