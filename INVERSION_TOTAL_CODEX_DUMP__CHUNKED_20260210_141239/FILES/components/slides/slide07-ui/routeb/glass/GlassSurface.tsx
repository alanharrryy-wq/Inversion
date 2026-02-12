
import React from "react";
import { resolveSlide07GlassTokens, toSlide07GlassStyle } from "./glass.tokens";

export function GlassSurface(props: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tokenOverrides?: Partial<ReturnType<typeof resolveSlide07GlassTokens>>;
  "data-testid"?: string;
}) {
  const tokens = resolveSlide07GlassTokens(props.tokenOverrides);
  const glassStyle = toSlide07GlassStyle(tokens);

  return (
    <section
      className={props.className}
      style={{
        ...glassStyle,
        ...props.style,
      }}
      data-testid={props["data-testid"]}
    >
      {props.children}
    </section>
  );
}

