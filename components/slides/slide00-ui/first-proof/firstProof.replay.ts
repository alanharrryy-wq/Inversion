import {
  createInitialFirstProofState,
  deriveFirstProofSnapshot,
  resolveFirstProofThresholds,
  transitionFirstProofState,
} from "./firstProof.helpers";
import {
  FirstProofMachineEvent,
  FirstProofReplayFrame,
  FirstProofReplayResult,
  FirstProofReplayTrace,
  FirstProofRuntimeSignal,
  FirstProofState,
  FirstProofThresholds,
} from "./firstProof.types";

export type FirstProofReplayOptions = {
  thresholds?: Partial<FirstProofThresholds>;
  includeFrames?: boolean;
};

export type FirstProofTraceRecorder = {
  metadata: FirstProofReplayTrace["metadata"];
  events: FirstProofMachineEvent[];
};

function cloneState(state: FirstProofState): FirstProofState {
  return JSON.parse(JSON.stringify(state)) as FirstProofState;
}

function cloneSignals(signals: FirstProofRuntimeSignal[]): FirstProofRuntimeSignal[] {
  return JSON.parse(JSON.stringify(signals)) as FirstProofRuntimeSignal[];
}

function cloneEvent(event: FirstProofMachineEvent): FirstProofMachineEvent {
  return JSON.parse(JSON.stringify(event)) as FirstProofMachineEvent;
}

export function createFirstProofTraceRecorder(
  metadata: FirstProofReplayTrace["metadata"]
): FirstProofTraceRecorder {
  return {
    metadata,
    events: [],
  };
}

export function recordFirstProofTraceEvent(
  recorder: FirstProofTraceRecorder,
  event: FirstProofMachineEvent
): void {
  recorder.events.push(cloneEvent(event));
}

export function finalizeFirstProofTrace(recorder: FirstProofTraceRecorder): FirstProofReplayTrace {
  return {
    metadata: recorder.metadata,
    events: recorder.events.map((event) => cloneEvent(event)),
  };
}

export function replayFirstProofTrace(
  trace: FirstProofReplayTrace,
  options: FirstProofReplayOptions = {}
): FirstProofReplayResult {
  const thresholds = resolveFirstProofThresholds(options.thresholds);

  const initialState = createInitialFirstProofState();
  let runningState = cloneState(initialState);

  const frames: FirstProofReplayFrame[] = [];
  const allSignals: FirstProofRuntimeSignal[] = [];

  for (let index = 0; index < trace.events.length; index += 1) {
    const event = trace.events[index];
    const transition = transitionFirstProofState(runningState, event, thresholds);
    runningState = transition.state;

    if (transition.signals.length > 0) {
      allSignals.push(...cloneSignals(transition.signals));
    }

    if (options.includeFrames !== false) {
      frames.push({
        index,
        event: cloneEvent(event),
        state: cloneState(runningState),
        snapshot: deriveFirstProofSnapshot(runningState, thresholds),
        signals: cloneSignals(transition.signals),
      });
    }
  }

  const finalState = cloneState(runningState);
  const finalSnapshot = deriveFirstProofSnapshot(finalState, thresholds);

  return {
    metadata: trace.metadata,
    thresholds,
    initialState,
    finalState,
    finalSnapshot,
    frames,
    allSignals,
  };
}

export function replayFirstProofTraceCatalog(
  traces: FirstProofReplayTrace[],
  options: FirstProofReplayOptions = {}
): FirstProofReplayResult[] {
  return traces.map((trace) => replayFirstProofTrace(trace, options));
}

export function buildFirstProofReplaySignature(result: FirstProofReplayResult): string {
  const signature = {
    id: result.metadata.id,
    stage: result.finalState.stage,
    sealStatus: result.finalSnapshot.sealStatus,
    completed: result.finalSnapshot.completed,
    dragDistancePx: result.finalSnapshot.dragDistancePx,
    holdElapsedMs: result.finalSnapshot.holdElapsedMs,
    releaseReady: result.finalSnapshot.releaseReady,
    signalCount: result.allSignals.length,
    frameCount: result.frames.length,
  };

  return JSON.stringify(signature);
}

export function summarizeFirstProofReplay(result: FirstProofReplayResult): string {
  const blockedSignals = result.allSignals.filter((signal) => {
    return signal.kind === "anchor" && signal.anchorId === "slide00:firstproof:release-blocked";
  }).length;

  return [
    `trace=${result.metadata.id}`,
    `stage=${result.finalState.stage}`,
    `seal=${result.finalSnapshot.sealStatus}`,
    `completed=${result.finalSnapshot.completed}`,
    `blocked=${blockedSignals}`,
    `signals=${result.allSignals.length}`,
  ].join(" | ");
}
