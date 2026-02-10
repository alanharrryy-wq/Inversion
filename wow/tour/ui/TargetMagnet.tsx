import React, { useMemo } from 'react';
import { SpotlightRect } from './SpotlightV2';

type Props = {
  active: boolean;
  rect: SpotlightRect | null;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  phaseClass: string;
};

function arrowPosition(rect: SpotlightRect | null, placement?: Props['placement']): React.CSSProperties {
  if (!rect) return { left: '-9999px', top: '-9999px' };
  const p = placement ?? 'right';
  const gap = 26;

  if (p === 'left') {
    return {
      left: rect.left - gap,
      top: rect.top + rect.height / 2,
      transform: 'translate(-100%, -50%) rotate(180deg)',
    };
  }
  if (p === 'top') {
    return {
      left: rect.left + rect.width / 2,
      top: rect.top - gap,
      transform: 'translate(-50%, -100%) rotate(-90deg)',
    };
  }
  if (p === 'bottom') {
    return {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height + gap,
      transform: 'translate(-50%, 0) rotate(90deg)',
    };
  }
  if (p === 'center') {
    return {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
      transform: 'translate(-50%, -50%) rotate(0deg)',
    };
  }

  return {
    left: rect.left + rect.width + gap,
    top: rect.top + rect.height / 2,
    transform: 'translate(0, -50%) rotate(0deg)',
  };
}

export function TargetMagnet(props: Props) {
  const { active, rect, placement, phaseClass } = props;

  const pulseStyle = useMemo<React.CSSProperties>(() => {
    if (!rect) return { left: '-9999px', top: '-9999px' };
    return {
      left: `${Math.round(rect.left + rect.width / 2)}px`,
      top: `${Math.round(rect.top + rect.height / 2)}px`,
      width: `${Math.round(Math.max(rect.width, rect.height) + 34)}px`,
      height: `${Math.round(Math.max(rect.width, rect.height) + 34)}px`,
      transform: 'translate(-50%, -50%)',
    };
  }, [rect]);

  const arrowStyle = useMemo(() => arrowPosition(rect, placement), [placement, rect]);

  if (!active || !rect) return null;

  return (
    <div className={`wow-tour-magnet ${phaseClass}`} aria-hidden="true">
      <div className="wow-tour-magnet__pulse wow-tour-magnet__pulse--a" style={pulseStyle} />
      <div className="wow-tour-magnet__pulse wow-tour-magnet__pulse--b" style={pulseStyle} />
      <div className="wow-tour-magnet__arrow" style={arrowStyle}>
        <svg viewBox="0 0 120 24" className="wow-tour-magnet__svg">
          <path d="M2 12H96" />
          <path d="M84 4L98 12L84 20" />
          <circle cx="6" cy="12" r="3" />
        </svg>
      </div>
      <div className="wow-tour-magnet__hint" style={arrowStyle}>Click here</div>
    </div>
  );
}
