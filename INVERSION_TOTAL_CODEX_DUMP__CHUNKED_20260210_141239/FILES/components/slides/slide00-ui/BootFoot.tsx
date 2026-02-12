
import React from "react";

export function BootFoot(props: {
  left: string;
  right: string;
}) {
  return (
    <div className="slide00-boot-foot">
      <p className="slide00-boot-foot-left">{props.left}</p>
      <p className="slide00-boot-foot-right">{props.right}</p>
    </div>
  );
}

