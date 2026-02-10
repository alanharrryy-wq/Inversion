import React from "react";
import { GlassSurface } from "./GlassSurface";

export function BootPanel(props: {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <GlassSurface as="section" variant="panel" className="slide00-boot-panel" >
      <div className="slide00-boot-panel-stack" data-testid="boot-panel">
        {props.header}
        {props.body}
        {props.footer}
      </div>
    </GlassSurface>
  );
}
