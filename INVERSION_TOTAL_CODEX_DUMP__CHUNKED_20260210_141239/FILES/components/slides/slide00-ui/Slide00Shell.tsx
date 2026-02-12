
import React from "react";

export function Slide00Shell(props: {
  children: React.ReactNode;
  toast?: React.ReactNode;
  diagnostics?: React.ReactNode;
  nav: React.ReactNode;
}) {
  return (
    <div className="slide00-boot-root" data-testid="slide00-boot-console">
      <div className="slide00-boot-grid" />
      <div className="slide00-boot-vignette" />

      <div className="slide00-boot-shell">{props.children}</div>

      {props.toast}
      {props.diagnostics}

      <div className="slide00-boot-nav-slot">{props.nav}</div>
    </div>
  );
}

