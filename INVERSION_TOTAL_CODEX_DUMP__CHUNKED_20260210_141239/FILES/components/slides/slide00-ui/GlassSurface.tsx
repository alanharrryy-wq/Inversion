
import React from "react";

type GlassSurfaceProps = {
  as?: "div" | "section" | "article" | "aside";
  children: React.ReactNode;
  className?: string;
  variant?: "panel" | "badge" | "dock" | "soft";
};

export function GlassSurface(props: GlassSurfaceProps) {
  const { as = "div", children, className = "", variant = "soft" } = props;
  const Tag = as;

  return (
    <Tag className={`slide00-glass-surface slide00-glass-surface--${variant} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

