import React from "react";

export function BootNote(props: {
  children: React.ReactNode;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <p
      className="slide00-boot-note"
      data-warning={props.warning ? "true" : "false"}
      data-danger={props.danger ? "true" : "false"}
    >
      {props.children}
    </p>
  );
}
