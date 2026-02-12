
import React, { useMemo } from 'react';

export function SideDockScrollRegion(props: {
  maxHeight: number;
  children: React.ReactNode;
}) {
  const style = useMemo(
    () => ({
      '--boot-side-scroll-height': `${Math.max(220, Math.round(props.maxHeight))}px`,
    }) as React.CSSProperties,
    [props.maxHeight]
  );

  return (
    <div className="slide00-side-dock-scroll-region slide00-boot-scrollbar" style={style}>
      {props.children}
    </div>
  );
}

