import React from "react";
import { AiCoreIcon } from "./AiCoreIcon";

export function BootTopline(props: {
  brandTitle: string;
  brandSubtitle: string;
  slideLabel: string;
}) {
  return (
    <div className="slide00-boot-topline">
      <div className="slide00-boot-brand" role="presentation">
        <AiCoreIcon className="slide00-boot-brand-mark" />
        <div className="slide00-boot-brand-copy">
          <div className="slide00-boot-brand-title">{props.brandTitle}</div>
          <div className="slide00-boot-brand-subtitle">{props.brandSubtitle}</div>
        </div>
      </div>
      <div className="slide00-boot-slide-label">{props.slideLabel}</div>
    </div>
  );
}
