
export { KpiRitual } from "./KpiRitual";
export { KpiRail } from "./KpiRail";
export { KpiSurface } from "./KpiSurface";
export { RightSeal } from "./RightSeal";
export { Slide13DebugOverlay } from "./slide13.debugOverlay";
export {
  SLIDE13_DEFAULT_THRESHOLDS,
  createInitialSlide13State,
  deriveSlide13Snapshot,
  resolveSlide13Thresholds,
  transitionSlide13State,
} from "./slide13.helpers";
export { SLIDE13_COPY, getSlide13ProgressNarrative, getSlide13SealLine, getSlide13StepSignal } from "./slide13.copy";
export { replaySlide13Events, assertSlide13Fixture, runSlide13FixtureCatalog } from "./slide13.replay";
export { SLIDE13_FIXTURE_CATALOG, SLIDE13_REPLAY_FIXTURES } from "./slide13.fixtures";
export type {
  Slide13CanonicalAnchorName,
  Slide13CanonicalEventName,
  Slide13CopyPack,
  Slide13DebugModel,
  Slide13EmittedEvent,
  Slide13FixtureCatalog,
  Slide13GestureHandlers,
  Slide13MachineEvent,
  Slide13ReplayAssertion,
  Slide13ReplayFixture,
  Slide13ReplayFrame,
  Slide13ReplayInputEvent,
  Slide13ReplayResult,
  Slide13SealState,
  Slide13Snapshot,
  Slide13State,
  Slide13StepKey,
  Slide13StepModel,
  Slide13StepStatus,
  Slide13Thresholds,
  Slide13TransitionResult,
} from "./slide13.types";

