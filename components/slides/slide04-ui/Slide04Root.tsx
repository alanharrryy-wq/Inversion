import React from "react";
import { Scene } from "./ui/Scene";

export type Slide04RootProps = {
  showHud?: boolean;
};

export function Slide04Root(props: Slide04RootProps) {
  return <Scene showHud={props.showHud} />;
}

export default Slide04Root;
