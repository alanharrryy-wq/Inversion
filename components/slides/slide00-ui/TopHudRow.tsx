import React from "react";

export function TopHudRow(props: {
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!props.visible) return null;
  return <>{props.children}</>;
}
