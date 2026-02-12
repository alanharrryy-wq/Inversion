import { Slide01Action, Slide01PointerTraceEvent, PointerSource } from "./types";

export function pointerTraceEventToActions(
  event: Slide01PointerTraceEvent,
  source: PointerSource
): Slide01Action[] {
  if (event.kind === "pointerup") {
    return [
      {
        type: "POINTER_EVENT",
        source,
        event,
      },
      {
        type: "RESOLVE_COMMITTED",
        source,
        reason: source === "replay" ? "replay" : "pointer-release",
      },
    ];
  }

  return [
    {
      type: "POINTER_EVENT",
      source,
      event,
    },
  ];
}
