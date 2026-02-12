import {
  CONSTRAINT_ORDER,
  DEFAULT_EVIDENCE_SELECTION,
  LOCK_HOLD_THRESHOLD_MS,
  createDefaultConstraintState,
  createReplayScenario,
  createReplaySeed,
  dedupeEvidenceIds,
  getConstraintDefinition,
  getEvidenceDefinition,
  getRouteById,
  hasBlockedConstraint,
  upsertEvidenceId,
} from "./constants";
import { createSummaryModel } from "./summary";
import {
  ConstraintDigestItem,
  EvidenceDigestItem,
  GuardEvaluation,
  LockAction,
  LockGuardFailureCode,
  LockMachineState,
  LockReducerDependencies,
  LockSelectors,
  SummaryOutput,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createBaseGuardFailure(code: LockGuardFailureCode) {
  if (code === "route-missing") {
    return {
      code,
      message: "Select a route before attempting seal.",
    };
  }
  if (code === "insufficient-evidence") {
    return {
      code,
      message: "Select at least two evidence items.",
    };
  }
  if (code === "blocked-constraints") {
    return {
      code,
      message: "Resolve blocked constraints before sealing.",
    };
  }
  if (code === "hold-incomplete") {
    return {
      code,
      message: "Hold action was released before threshold.",
    };
  }
  return {
    code,
    message: "Action ignored for current phase.",
  };
}

function evaluatePreLockGuards(state: LockMachineState): GuardEvaluation {
  if (!state.selectedRouteId) {
    return {
      ok: false,
      failure: createBaseGuardFailure("route-missing"),
    };
  }

  if (state.selectedEvidenceIds.length < 2) {
    return {
      ok: false,
      failure: createBaseGuardFailure("insufficient-evidence"),
    };
  }

  if (hasBlockedConstraint(state.constraints)) {
    return {
      ok: false,
      failure: createBaseGuardFailure("blocked-constraints"),
    };
  }

  return {
    ok: true,
    failure: null,
  };
}

function evaluateFinalLockGuards(state: LockMachineState, progress: number): GuardEvaluation {
  const pre = evaluatePreLockGuards(state);
  if (!pre.ok) {
    return pre;
  }

  if (progress < 1) {
    return {
      ok: false,
      failure: createBaseGuardFailure("hold-incomplete"),
    };
  }

  return {
    ok: true,
    failure: null,
  };
}

function createDefaultDependencies(): LockReducerDependencies {
  return {
    getRouteById,
    getConstraintDefinition,
    getEvidenceDefinition,
    createSummary: createSummaryModel,
  };
}

export const DEFAULT_LOCK_REDUCER_DEPENDENCIES = createDefaultDependencies();

function createHoldReset(thresholdMs: number) {
  return {
    startedAtMs: null,
    elapsedMs: 0,
    progress: 0,
    thresholdMs,
    pointerActive: false,
  };
}

function withRevision(state: LockMachineState): LockMachineState {
  return {
    ...state,
    revision: state.revision + 1,
  };
}

function createConstraintDigest(state: LockMachineState, deps: LockReducerDependencies): ConstraintDigestItem[] {
  return CONSTRAINT_ORDER.map((constraintId) => {
    const definition = deps.getConstraintDefinition(constraintId);
    return {
      id: constraintId,
      label: definition.label,
      weight: definition.weight,
      rationale: definition.rationale,
      state: state.constraints[constraintId],
    };
  });
}

function createEvidenceDigest(state: LockMachineState, deps: LockReducerDependencies): EvidenceDigestItem[] {
  return dedupeEvidenceIds(state.selectedEvidenceIds).map((evidenceId) => {
    const definition = deps.getEvidenceDefinition(evidenceId);
    return {
      id: evidenceId,
      label: definition.label,
      source: definition.source,
      confidence: definition.confidence,
      note: definition.note,
    };
  });
}

function createSummaryFromState(
  state: LockMachineState,
  sealedAtMs: number,
  deps: LockReducerDependencies
): SummaryOutput | null {
  if (!state.selectedRouteId) {
    return null;
  }

  const route = deps.getRouteById(state.selectedRouteId);

  return deps.createSummary({
    route,
    constraints: createConstraintDigest(state, deps),
    evidence: createEvidenceDigest(state, deps),
    holdMs: state.hold.elapsedMs,
    sealedAtMs,
  });
}

function setPhaseFromRoute(state: LockMachineState): LockMachineState {
  if (!state.selectedRouteId) {
    return {
      ...state,
      phase: "idle",
    };
  }

  return {
    ...state,
    phase: "arming",
  };
}

function resetHold(state: LockMachineState): LockMachineState {
  return {
    ...state,
    hold: createHoldReset(state.hold.thresholdMs),
  };
}

function createInvalidPhaseState(state: LockMachineState): LockMachineState {
  return withRevision({
    ...state,
    lastGuardFailure: createBaseGuardFailure("invalid-phase"),
  });
}

export function createInitialLockState(): LockMachineState {
  return {
    phase: "idle",
    selectedRouteId: null,
    constraints: createDefaultConstraintState(),
    selectedEvidenceIds: dedupeEvidenceIds(DEFAULT_EVIDENCE_SELECTION),
    hold: createHoldReset(LOCK_HOLD_THRESHOLD_MS),
    sealAttemptCount: 0,
    successfulSealCount: 0,
    lastGuardFailure: null,
    sealedSummary: null,
    replayStatus: "idle",
    replayLastHash: null,
    replayLastError: null,
    revision: 0,
  };
}

export function reduceLockMachine(
  prevState: LockMachineState,
  action: LockAction,
  deps: LockReducerDependencies = DEFAULT_LOCK_REDUCER_DEPENDENCIES
): LockMachineState {
  if (action.type === "route.select") {
    const nextState: LockMachineState = {
      ...prevState,
      selectedRouteId: action.routeId,
      lastGuardFailure: null,
      sealedSummary: prevState.phase === "sealed" ? null : prevState.sealedSummary,
      replayLastError: null,
      replayStatus: prevState.replayStatus === "error" ? "idle" : prevState.replayStatus,
      hold: createHoldReset(prevState.hold.thresholdMs),
    };

    return withRevision(setPhaseFromRoute(nextState));
  }

  if (action.type === "route.clear") {
    const nextState: LockMachineState = {
      ...prevState,
      selectedRouteId: null,
      lastGuardFailure: null,
      sealedSummary: null,
      replayLastError: null,
      replayStatus: prevState.replayStatus === "error" ? "idle" : prevState.replayStatus,
      hold: createHoldReset(prevState.hold.thresholdMs),
    };

    return withRevision(setPhaseFromRoute(nextState));
  }

  if (action.type === "constraint.set") {
    if (prevState.phase === "sealed") {
      return createInvalidPhaseState(prevState);
    }

    const current = prevState.constraints[action.constraintId];
    if (current === action.state) {
      return prevState;
    }

    const nextState: LockMachineState = {
      ...prevState,
      constraints: {
        ...prevState.constraints,
        [action.constraintId]: action.state,
      },
      lastGuardFailure: null,
      replayLastError: null,
      replayStatus: prevState.replayStatus === "error" ? "idle" : prevState.replayStatus,
      hold: createHoldReset(prevState.hold.thresholdMs),
    };

    return withRevision(setPhaseFromRoute(nextState));
  }

  if (action.type === "evidence.toggle") {
    if (prevState.phase === "sealed") {
      return createInvalidPhaseState(prevState);
    }

    const nextSelected = upsertEvidenceId(prevState.selectedEvidenceIds, action.evidenceId);

    const nextState: LockMachineState = {
      ...prevState,
      selectedEvidenceIds: nextSelected,
      lastGuardFailure: null,
      replayLastError: null,
      replayStatus: prevState.replayStatus === "error" ? "idle" : prevState.replayStatus,
      hold: createHoldReset(prevState.hold.thresholdMs),
    };

    return withRevision(setPhaseFromRoute(nextState));
  }

  if (action.type === "seal.pointer.down") {
    if (prevState.phase !== "arming") {
      return createInvalidPhaseState(prevState);
    }

    const guard = evaluatePreLockGuards(prevState);
    if (!guard.ok) {
      return withRevision({
        ...prevState,
        lastGuardFailure: guard.failure,
      });
    }

    return withRevision({
      ...prevState,
      phase: "locking",
      hold: {
        ...prevState.hold,
        startedAtMs: action.atMs,
        elapsedMs: 0,
        progress: 0,
        pointerActive: true,
      },
      lastGuardFailure: null,
    });
  }

  if (action.type === "seal.pointer.tick") {
    if (prevState.phase !== "locking") {
      return prevState;
    }

    if (!prevState.hold.pointerActive || prevState.hold.startedAtMs == null) {
      return prevState;
    }

    const elapsedMs = Math.max(0, action.atMs - prevState.hold.startedAtMs);
    const progress = clamp(elapsedMs / prevState.hold.thresholdMs, 0, 1);

    if (elapsedMs === prevState.hold.elapsedMs && progress === prevState.hold.progress) {
      return prevState;
    }

    return withRevision({
      ...prevState,
      hold: {
        ...prevState.hold,
        elapsedMs,
        progress,
      },
    });
  }

  if (action.type === "seal.pointer.up") {
    if (prevState.phase !== "locking") {
      return createInvalidPhaseState(prevState);
    }

    const startedAtMs = prevState.hold.startedAtMs ?? action.atMs;
    const elapsedMs = Math.max(0, action.atMs - startedAtMs);
    const progress = clamp(elapsedMs / prevState.hold.thresholdMs, 0, 1);

    const evaluatedState: LockMachineState = {
      ...prevState,
      hold: {
        ...prevState.hold,
        elapsedMs,
        progress,
        pointerActive: false,
      },
    };

    const guard = evaluateFinalLockGuards(evaluatedState, progress);

    if (!guard.ok) {
      return withRevision(
        setPhaseFromRoute(
          resetHold({
            ...evaluatedState,
            sealAttemptCount: prevState.sealAttemptCount + 1,
            lastGuardFailure: guard.failure,
          })
        )
      );
    }

    const summary = createSummaryFromState(evaluatedState, action.atMs, deps);
    if (!summary) {
      return withRevision(
        setPhaseFromRoute(
          resetHold({
            ...evaluatedState,
            sealAttemptCount: prevState.sealAttemptCount + 1,
            lastGuardFailure: createBaseGuardFailure("route-missing"),
          })
        )
      );
    }

    return withRevision(
      resetHold({
        ...evaluatedState,
        phase: "sealed",
        sealAttemptCount: prevState.sealAttemptCount + 1,
        successfulSealCount: prevState.successfulSealCount + 1,
        sealedSummary: summary,
        replayLastHash: summary.seal.hash,
        replayLastError: null,
        replayStatus: prevState.replayStatus === "error" ? "idle" : prevState.replayStatus,
        lastGuardFailure: null,
      })
    );
  }

  if (action.type === "seal.pointer.cancel") {
    if (prevState.phase !== "locking") {
      return prevState;
    }

    return withRevision(
      setPhaseFromRoute(
        resetHold({
          ...prevState,
          sealAttemptCount: prevState.sealAttemptCount + 1,
          lastGuardFailure: {
            code: "hold-incomplete",
            message: `Seal canceled (${action.reason}).`,
          },
        })
      )
    );
  }

  if (action.type === "seal.unseal") {
    if (prevState.phase !== "sealed") {
      return prevState;
    }

    return withRevision({
      ...prevState,
      phase: "arming",
      sealedSummary: null,
      lastGuardFailure: null,
      hold: createHoldReset(prevState.hold.thresholdMs),
    });
  }

  if (action.type === "seal.reset") {
    const routeId = prevState.selectedRouteId;
    const base = createInitialLockState();

    if (!routeId) {
      return withRevision({
        ...base,
        replayLastHash: prevState.replayLastHash,
      });
    }

    return withRevision({
      ...base,
      selectedRouteId: routeId,
      phase: "arming",
      replayLastHash: prevState.replayLastHash,
      selectedEvidenceIds: [...prevState.selectedEvidenceIds],
      constraints: { ...prevState.constraints },
    });
  }

  if (action.type === "replay.applied") {
    return withRevision({
      ...prevState,
      replayStatus: "applied",
      replayLastHash: action.hash,
      replayLastError: null,
    });
  }

  if (action.type === "replay.failed") {
    return withRevision({
      ...prevState,
      replayStatus: "error",
      replayLastError: action.error,
    });
  }

  return prevState;
}

export function selectCanArm(state: LockMachineState): boolean {
  return !!state.selectedRouteId;
}

export function selectCanAttemptLock(state: LockMachineState): boolean {
  const pre = evaluatePreLockGuards(state);
  return state.phase === "arming" && pre.ok;
}

export function selectHoldPercent(state: LockMachineState): number {
  return Math.round(state.hold.progress * 100);
}

export function selectHoldPercentLabel(state: LockMachineState): string {
  return `${selectHoldPercent(state)}%`;
}

export function selectSummaryHash(state: LockMachineState): string | null {
  return state.sealedSummary?.seal.hash ?? null;
}

export function selectSummarySignature(state: LockMachineState): string | null {
  return state.sealedSummary?.seal.signature ?? null;
}

export function createLockSelectors(state: LockMachineState): LockSelectors {
  const selectedRouteLabel = state.selectedRouteId
    ? getRouteById(state.selectedRouteId).label
    : "none";

  return {
    canArm: selectCanArm(state),
    canAttemptLock: selectCanAttemptLock(state),
    selectedRouteLabel,
    holdPercentLabel: selectHoldPercentLabel(state),
    summarySnapshot: {
      phase: state.phase,
      hash: selectSummaryHash(state),
      signature: selectSummarySignature(state),
    },
  };
}

export function createReplayMetadataFromState(state: LockMachineState) {
  return {
    seed: createReplaySeed(state.selectedRouteId),
    scenario: createReplayScenario(state.selectedRouteId),
  };
}

export function assertMachineInvariants(state: LockMachineState): string[] {
  const errors: string[] = [];

  if (state.phase === "idle" && state.selectedRouteId !== null) {
    errors.push("idle phase requires selectedRouteId to be null");
  }

  if (state.phase === "locking" && state.hold.startedAtMs == null) {
    errors.push("locking phase requires hold.startedAtMs");
  }

  if (state.phase === "sealed" && state.sealedSummary == null) {
    errors.push("sealed phase requires sealedSummary");
  }

  if (state.hold.progress < 0 || state.hold.progress > 1) {
    errors.push("hold.progress out of range");
  }

  const deduped = dedupeEvidenceIds(state.selectedEvidenceIds);
  if (deduped.join("|") !== state.selectedEvidenceIds.join("|")) {
    errors.push("selectedEvidenceIds must be sorted and deduped");
  }

  return errors;
}
