import React from "react";

export function BootToast(props: {
  open: boolean;
  detail: string;
  onDismiss: () => void;
}) {
  if (!props.open) return null;

  return (
    <section className="slide00-boot-toast" data-testid="boot-toast">
      <p className="slide00-boot-toast-title">sistema listo</p>
      <p className="slide00-boot-toast-detail">{props.detail}</p>
      <button type="button" className="slide00-boot-toast-dismiss" onClick={props.onDismiss}>
        dismiss
      </button>
    </section>
  );
}
