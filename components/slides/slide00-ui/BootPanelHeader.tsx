import React from "react";

export function BootPanelHeader(props: {
  title: string;
  subtitle: React.ReactNode;
  whyLabel: string;
}) {
  return (
    <>
      <h2 className="slide00-boot-panel-title">{props.title}</h2>
      <p className="slide00-boot-panel-subtitle">{props.subtitle}</p>
      <p className="slide00-boot-why-line">
        <span className="slide00-boot-why-dot" aria-hidden="true" />
        {props.whyLabel}
      </p>
    </>
  );
}
