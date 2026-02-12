import { createInitialSlide03State } from "../fsm/initial";
import { markReplayStatus, reduceSlide03StateWithEnvelope } from "../fsm/reducer";
import {
  ReplayRunMismatch,
  ReplayRunResult,
  ReplayableActionShape,
  Slide03Action,
  Slide03ReplayPayload,
  Slide03State,
} from "../fsm/types";
import { stableInputHash } from "../evidence/model";

const isReplayableType = (type: string): type is ReplayableActionShape["type"] => {
  return (
    type === "POINTER_START" ||
    type === "POINTER_FRAME" ||
    type === "POINTER_END" ||
    type === "POINTER_CANCEL" ||
    type === "CONFIRM_STEP" ||
    type === "COMMIT_SEAL" ||
    type === "RESET_SESSION"
  );
};

const isStepId = (value: unknown): value is "E1" | "E2" | "E3" => {
  return value === "E1" || value === "E2" || value === "E3";
};

const toReplayableActionShape = (action: Slide03Action): ReplayableActionShape | null => {
  if (action.type === "REPLACE_STATE") return null;

  switch (action.type) {
    case "POINTER_START":
      return {
        type: action.type,
        stepId: action.stepId,
        pointerId: action.pointerId,
      };
    case "POINTER_FRAME":
      return {
        type: action.type,
        stepId: action.stepId,
        pointerId: action.pointerId,
        ratio: action.ratio,
      };
    case "POINTER_END":
      return {
        type: action.type,
        stepId: action.stepId,
        pointerId: action.pointerId,
      };
    case "POINTER_CANCEL":
      return {
        type: action.type,
        stepId: action.stepId,
        pointerId: action.pointerId,
        reason: action.reason,
      };
    case "CONFIRM_STEP":
      return {
        type: action.type,
        stepId: action.stepId,
      };
    case "COMMIT_SEAL":
      return {
        type: action.type,
      };
    case "RESET_SESSION":
      return {
        type: action.type,
        reason: action.reason,
      };
    default:
      return null;
  }
};

export const buildReplayPayload = (
  state: Slide03State,
  options?: { onlyAccepted?: boolean }
): Slide03ReplayPayload => {
  const onlyAccepted = options?.onlyAccepted ?? true;

  const actions = state.replayLog
    .filter((record) => (onlyAccepted ? record.envelope.accepted : true))
    .map((record) => toReplayableActionShape(record.action))
    .filter((entry): entry is ReplayableActionShape => !!entry);

  return {
    version: 1,
    createdAtIso: new Date(0).toISOString(),
    routeId: state.modelInput.route.id,
    constraintDigest: state.evaluation.pressure.digest,
    actions,
    expectedFinalStage: state.stage,
    expectedFinalConfidence: state.evaluation.confidence,
    expectedFinalUncertainty: state.evaluation.uncertainty,
    expectedSealLevel: state.evaluation.seal.level,
  };
};

export const replayPayloadToJson = (payload: Slide03ReplayPayload): string => {
  return JSON.stringify(payload, null, 2);
};

const parseObject = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const parseAction = (value: unknown): ReplayableActionShape | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  if (!isReplayableType(String(raw.type))) return null;

  const type = String(raw.type) as ReplayableActionShape["type"];

  if (type === "COMMIT_SEAL") {
    return { type };
  }

  if (type === "RESET_SESSION") {
    return {
      type,
      reason: typeof raw.reason === "string" ? raw.reason : "replay-reset",
    };
  }

  if (!isStepId(raw.stepId)) {
    return null;
  }

  if (type === "CONFIRM_STEP") {
    return {
      type,
      stepId: raw.stepId,
    };
  }

  const pointerId = Number(raw.pointerId);
  if (!Number.isFinite(pointerId)) {
    return null;
  }

  if (type === "POINTER_START" || type === "POINTER_END") {
    return {
      type,
      stepId: raw.stepId,
      pointerId,
    };
  }

  if (type === "POINTER_FRAME") {
    const ratio = Number(raw.ratio);
    if (!Number.isFinite(ratio)) return null;
    return {
      type,
      stepId: raw.stepId,
      pointerId,
      ratio,
    };
  }

  return {
    type: "POINTER_CANCEL",
    stepId: raw.stepId,
    pointerId,
    reason: typeof raw.reason === "string" ? raw.reason : "replay-cancel",
  };
};

export const parseReplayPayload = (raw: string): Slide03ReplayPayload | null => {
  const parsed = parseObject(raw);
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 1) return null;

  const routeId = typeof obj.routeId === "string" ? obj.routeId : null;
  const constraintDigest = typeof obj.constraintDigest === "string" ? obj.constraintDigest : null;
  const expectedFinalStage = typeof obj.expectedFinalStage === "string" ? obj.expectedFinalStage : null;
  const expectedFinalConfidence = Number(obj.expectedFinalConfidence);
  const expectedFinalUncertainty = Number(obj.expectedFinalUncertainty);
  const expectedSealLevel =
    obj.expectedSealLevel === "open" ||
    obj.expectedSealLevel === "forming" ||
    obj.expectedSealLevel === "sealed"
      ? obj.expectedSealLevel
      : null;

  if (!routeId || !constraintDigest || !expectedFinalStage || !expectedSealLevel) {
    return null;
  }

  if (!Array.isArray(obj.actions)) {
    return null;
  }

  const actions: ReplayableActionShape[] = [];
  for (const actionCandidate of obj.actions) {
    const parsedAction = parseAction(actionCandidate);
    if (!parsedAction) {
      return null;
    }
    actions.push(parsedAction);
  }

  return {
    version: 1,
    createdAtIso:
      typeof obj.createdAtIso === "string"
        ? obj.createdAtIso
        : new Date(0).toISOString(),
    routeId,
    constraintDigest,
    actions,
    expectedFinalStage: expectedFinalStage as Slide03ReplayPayload["expectedFinalStage"],
    expectedFinalConfidence: Number.isFinite(expectedFinalConfidence)
      ? Math.round(expectedFinalConfidence)
      : 0,
    expectedFinalUncertainty: Number.isFinite(expectedFinalUncertainty)
      ? Math.round(expectedFinalUncertainty)
      : 0,
    expectedSealLevel,
  };
};

const toReducerAction = (shape: ReplayableActionShape): Slide03Action => {
  switch (shape.type) {
    case "POINTER_START":
      return {
        type: "POINTER_START",
        stepId: shape.stepId ?? "E1",
        pointerId: shape.pointerId ?? 1,
        source: "replay",
        capture: false,
      };
    case "POINTER_FRAME":
      return {
        type: "POINTER_FRAME",
        stepId: shape.stepId ?? "E1",
        pointerId: shape.pointerId ?? 1,
        ratio: shape.ratio ?? 0,
        source: "replay",
        capture: false,
      };
    case "POINTER_END":
      return {
        type: "POINTER_END",
        stepId: shape.stepId ?? "E1",
        pointerId: shape.pointerId ?? 1,
        source: "replay",
        capture: false,
      };
    case "POINTER_CANCEL":
      return {
        type: "POINTER_CANCEL",
        stepId: shape.stepId ?? "E1",
        pointerId: shape.pointerId ?? 1,
        reason: shape.reason ?? "replay-cancel",
        source: "replay",
        capture: false,
      };
    case "CONFIRM_STEP":
      return {
        type: "CONFIRM_STEP",
        stepId: shape.stepId ?? "E1",
        source: "replay",
        capture: false,
      };
    case "COMMIT_SEAL":
      return {
        type: "COMMIT_SEAL",
        source: "replay",
        capture: false,
      };
    case "RESET_SESSION":
      return {
        type: "RESET_SESSION",
        reason: shape.reason ?? "replay-reset",
        source: "replay",
        capture: false,
      };
    default:
      return {
        type: "RESET_SESSION",
        reason: "replay-fallback",
        source: "replay",
        capture: false,
      };
  }
};

const replayMismatch = (index: number, reason: string): ReplayRunMismatch => ({
  index,
  reason,
});

const assertReplayExpectations = (
  state: Slide03State,
  payload: Slide03ReplayPayload,
  mismatches: ReplayRunMismatch[]
) => {
  if (state.stage !== payload.expectedFinalStage) {
    mismatches.push(
      replayMismatch(
        payload.actions.length,
        `stage mismatch expected ${payload.expectedFinalStage} got ${state.stage}`
      )
    );
  }

  if (state.evaluation.confidence !== payload.expectedFinalConfidence) {
    mismatches.push(
      replayMismatch(
        payload.actions.length,
        `confidence mismatch expected ${payload.expectedFinalConfidence} got ${state.evaluation.confidence}`
      )
    );
  }

  if (state.evaluation.uncertainty !== payload.expectedFinalUncertainty) {
    mismatches.push(
      replayMismatch(
        payload.actions.length,
        `uncertainty mismatch expected ${payload.expectedFinalUncertainty} got ${state.evaluation.uncertainty}`
      )
    );
  }

  if (state.evaluation.seal.level !== payload.expectedSealLevel) {
    mismatches.push(
      replayMismatch(
        payload.actions.length,
        `seal mismatch expected ${payload.expectedSealLevel} got ${state.evaluation.seal.level}`
      )
    );
  }
};

export const playReplayPayload = (
  baseState: Slide03State,
  payload: Slide03ReplayPayload
): ReplayRunResult => {
  let cursor = createInitialSlide03State(baseState.modelInput);
  cursor = markReplayStatus(cursor, "ready", "Replay payload loaded.");

  const mismatches: ReplayRunMismatch[] = [];

  payload.actions.forEach((shape, index) => {
    const action = toReducerAction(shape);
    const result = reduceSlide03StateWithEnvelope(cursor, action);
    cursor = result.state;

    if (!result.envelope.accepted) {
      mismatches.push(
        replayMismatch(index, `action ${shape.type} rejected: ${result.envelope.reason}`)
      );
    }
  });

  assertReplayExpectations(cursor, payload, mismatches);

  const success = mismatches.length === 0;
  const message = success
    ? "Replay executed with deterministic final state."
    : `Replay executed with ${mismatches.length} mismatch(es).`;

  cursor = markReplayStatus(cursor, success ? "played" : "failed", message);

  return {
    success,
    mismatches,
    finalState: cursor,
    message,
  };
};

export const runReplayFromJson = (
  baseState: Slide03State,
  rawJson: string
): ReplayRunResult => {
  const payload = parseReplayPayload(rawJson);
  if (!payload) {
    return {
      success: false,
      mismatches: [replayMismatch(0, "invalid replay JSON payload")],
      finalState: markReplayStatus(baseState, "failed", "Invalid replay JSON payload."),
      message: "Invalid replay JSON payload.",
    };
  }

  return playReplayPayload(baseState, payload);
};

export const replayDigest = (payload: Slide03ReplayPayload): string => {
  const actionDigest = payload.actions
    .map((action, index) => `${index}:${action.type}:${action.stepId ?? "-"}`)
    .join("|");
  return `${payload.routeId}|${payload.constraintDigest}|${actionDigest}`;
};

export const replayIdentity = (state: Slide03State, payload: Slide03ReplayPayload): string => {
  return `${stableInputHash(state.modelInput)}::${replayDigest(payload)}`;
};
