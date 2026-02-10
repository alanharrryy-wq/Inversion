import React from "react";

export function BootCenterLayout(props: {
  main: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <main className="slide00-boot-center">
      {props.main}
      {props.side}
    </main>
  );
}
