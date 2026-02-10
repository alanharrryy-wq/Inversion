import React from "react";

export function TopRibbon(props: {
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!props.visible) return null;
  return <>{props.children}</>;
}
