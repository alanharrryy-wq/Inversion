
import { createEvidenceEvent } from '../evidence/events';
import { transitionsForEvidenceAction } from '../evidence/registry';
import { createInitialEvidenceState, reduceEvidenceState } from '../evidence/reducer';
import { EvidenceStoreState } from '../evidence/types';
import { createInitialBootState, reduceBootState } from './reducer';
import {
  BootOperatorLogEntry,
  BootRuntimeAction,
  BootRuntimeEvent,
  BootRuntimeState,
} from './types';

function bootEventId(sequence: number): string {
  return `boot-${String(Math.max(0, sequence)).padStart(6, '0')}`;
}

export function createInitialBootRuntimeState(): BootRuntimeState {
  return {
    boot: createInitialBootState(),
    evidence: createInitialEvidenceState(),
    operatorLog: [],
    eventLog: [],
    eventSequence: 0,
    lastSlideEntered: null,
    lastInteractedAnchor: null,
  };
}

function createOperatorLog(args: {
  sequence: number;
  ts: number;
  level: BootOperatorLogEntry['level'];
  title: string;
  detail: string;
  action: string;
  actor: BootOperatorLogEntry['actor'];
}): BootOperatorLogEntry {
  return {
    id: `op-${String(Math.max(0, args.sequence)).padStart(6, '0')}`,
    ts: args.ts,
    level: args.level,
    title: args.title,
    detail: args.detail,
    action: args.action,
    actor: args.actor,
  };
}

function actionToDefaultLog(args: {
  sequence: number;
  action: string;
  actor: BootOperatorLogEntry['actor'];
  ts: number;
  note?: string;
}): BootOperatorLogEntry | null {
  const { sequence, action, actor, ts, note } = args;

  if (action === 'boot:arm:requested') {
    return createOperatorLog({
      sequence,
      ts,
      actor,
      action,
      level: 'info',
      title: 'Arm request received',
      detail: note ?? 'Boot gate moved to pending confirmation.',
    });
  }

  if (action === 'boot:arm:confirmed') {
    return createOperatorLog({
      sequence,
      ts,
      actor,
      action,
      level: 'success',
      title: 'Sistema listo',
      detail: note ?? 'Primary blocker evidence satisfied: evidence:system:armed.',
    });
  }

  if (action === 'boot:override:enabled') {
    return createOperatorLog({
      sequence,
      ts,
      actor,
      action,
      level: 'warning',
      title: 'Operator override enabled',
      detail: note ?? 'Operator-assisted mode active. Blocker evidence is still unsatisfied.',
    });
  }

  if (action === 'boot:override:disabled') {
    return createOperatorLog({
      sequence,
      ts,
      actor,
      action,
      level: 'info',
      title: 'Operator override disabled',
      detail: note ?? 'Runtime returned to strict gate enforcement.',
    });
  }

  if (action === 'boot:local:reset') {
    return createOperatorLog({
      sequence,
      ts,
      actor,
      action,
      level: 'warning',
      title: 'Local state reset',
      detail: note ?? 'Boot state and evidence were reset to IDLE.',
    });
  }

  if (action === 'slide:00:entered') {
    return createOperatorLog({
      sequence,
      ts,
      actor,
      action,
      level: 'info',
      title: 'Slide 00 entered',
      detail: note ?? 'Boot console is active and waiting for operator arming action.',
    });
  }

  return null;
}

function appendOperatorLog(state: BootRuntimeState, entry: BootOperatorLogEntry | null): BootRuntimeState {
  if (!entry) return state;
  return {
    ...state,
    operatorLog: [...state.operatorLog, entry],
  };
}

function ingestEvent(args: {
  state: BootRuntimeState;
  action: string;
  actor: 'operator' | 'system';
  ts: number;
  slide?: number;
  anchorId?: string;
  note?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
}): BootRuntimeState {
  const { state, action, actor, ts, slide, anchorId, note, payload } = args;
  const nextSequence = state.eventSequence + 1;

  const runtimeEvent: BootRuntimeEvent = {
    id: bootEventId(nextSequence),
    action,
    actor,
    ts,
    slide,
    anchorId,
    note,
    payload,
  };

  const evidenceEvent = createEvidenceEvent({
    sequence: nextSequence,
    action,
    actor,
    ts,
    anchorId,
    payload: {
      slide,
      anchorId,
      reason: note,
      ...payload,
    },
  });

  const transitions = transitionsForEvidenceAction(action);
  const nextEvidence: EvidenceStoreState = reduceEvidenceState(state.evidence, {
    type: 'EVIDENCE_INGEST_EVENT',
    event: evidenceEvent,
    transitions,
  });

  const withEvent: BootRuntimeState = {
    ...state,
    evidence: nextEvidence,
    eventSequence: nextSequence,
    eventLog: [...state.eventLog, runtimeEvent],
    lastSlideEntered: typeof slide === 'number' ? slide : state.lastSlideEntered,
    lastInteractedAnchor: anchorId ?? state.lastInteractedAnchor,
  };

  return appendOperatorLog(
    withEvent,
    actionToDefaultLog({
      sequence: nextSequence,
      action,
      actor,
      ts,
      note,
    })
  );
}

function syncBootWithEvidence(state: BootRuntimeState): BootRuntimeState {
  const syncedBoot = reduceBootState(state.boot, {
    type: 'BOOT_SYNC_WITH_EVIDENCE',
    evidence: state.evidence,
  });

  if (syncedBoot === state.boot) return state;
  return {
    ...state,
    boot: syncedBoot,
  };
}

export function reduceBootRuntimeState(state: BootRuntimeState, action: BootRuntimeAction): BootRuntimeState {
  if (action.type === 'BOOT_RUNTIME_RESTORE') {
    const restored: BootRuntimeState = {
      boot: action.snapshot.boot,
      evidence: action.snapshot.evidence,
      operatorLog: action.snapshot.operatorLog,
      eventLog: action.snapshot.eventLog,
      eventSequence: action.snapshot.eventSequence,
      lastSlideEntered: action.snapshot.lastSlideEntered,
      lastInteractedAnchor: action.snapshot.lastInteractedAnchor,
    };
    return syncBootWithEvidence(restored);
  }

  if (action.type === 'BOOT_RUNTIME_ADD_LOG') {
    const ts = action.ts ?? Date.now();
    const nextSequence = state.eventSequence + 1;
    const entry = createOperatorLog({
      sequence: nextSequence,
      ts,
      level: action.level,
      title: action.title,
      detail: action.detail,
      action: action.action,
      actor: 'operator',
    });

    return {
      ...state,
      eventSequence: nextSequence,
      operatorLog: [...state.operatorLog, entry],
    };
  }

  if (action.type === 'BOOT_RUNTIME_RESET_LOCAL') {
    const ts = action.ts ?? Date.now();
    const resetBoot = reduceBootState(state.boot, { type: 'BOOT_RESET', ts });
    let next = createInitialBootRuntimeState();
    next.boot = resetBoot;
    next = ingestEvent({
      state: next,
      action: 'boot:local:reset',
      actor: 'operator',
      ts,
      note: 'Reset requested from operator diagnostics dock.',
    });
    return syncBootWithEvidence(next);
  }

  if (action.type === 'BOOT_RUNTIME_RECORD_SLIDE_ENTRY') {
    const ts = action.ts ?? Date.now();
    let next = ingestEvent({
      state,
      action: 'slide:entered',
      actor: 'system',
      ts,
      slide: action.slide,
      payload: { slide: action.slide },
      note: `slide:${String(action.slide).padStart(2, '0')}:entered`,
    });

    if (action.slide === 0) {
      next = ingestEvent({
        state: next,
        action: 'slide:00:entered',
        actor: 'system',
        ts,
        slide: action.slide,
        payload: { slide: action.slide },
      });
    }

    return syncBootWithEvidence(next);
  }

  if (action.type === 'BOOT_RUNTIME_RECORD_ANCHOR_INTERACTION') {
    const ts = action.ts ?? Date.now();
    const next = ingestEvent({
      state,
      action: 'operator:anchor:interacted',
      actor: 'operator',
      ts,
      anchorId: action.anchorId,
      note: action.note,
      payload: {
        anchorId: action.anchorId,
      },
    });

    return syncBootWithEvidence(next);
  }

  if (action.type === 'BOOT_RUNTIME_SET_OVERRIDE') {
    const ts = action.ts ?? Date.now();
    const bootAction = action.enabled
      ? ({ type: 'BOOT_OVERRIDE_ENABLE', ts } as const)
      : ({ type: 'BOOT_OVERRIDE_DISABLE', ts } as const);

    let next: BootRuntimeState = {
      ...state,
      boot: reduceBootState(state.boot, bootAction),
    };

    next = ingestEvent({
      state: next,
      action: action.enabled ? 'boot:override:enabled' : 'boot:override:disabled',
      actor: 'operator',
      ts,
      note: action.enabled
        ? 'Operator enabled non-evidence override path.'
        : 'Operator disabled non-evidence override path.',
    });

    return syncBootWithEvidence(next);
  }

  if (action.type === 'BOOT_RUNTIME_REQUEST_ARM') {
    const ts = action.ts ?? Date.now();
    let next: BootRuntimeState = {
      ...state,
      boot: reduceBootState(state.boot, { type: 'BOOT_ARM_REQUEST', ts }),
    };

    next = ingestEvent({
      state: next,
      action: 'boot:arm:requested',
      actor: 'operator',
      ts,
      note: 'Operator initiated arm flow on Slide 00 boot panel.',
    });

    return syncBootWithEvidence(next);
  }

  if (action.type === 'BOOT_RUNTIME_CONFIRM_ARM') {
    const ts = action.ts ?? Date.now();
    const nextBoot = reduceBootState(state.boot, { type: 'BOOT_ARM_CONFIRM', ts });
    let next: BootRuntimeState = {
      ...state,
      boot: nextBoot,
    };

    const confirmed = nextBoot.status === 'ARMED_CONFIRMED';

    next = ingestEvent({
      state: next,
      action: confirmed ? 'boot:arm:confirmed' : 'boot:arm:confirm:ignored',
      actor: 'operator',
      ts,
      note: confirmed
        ? 'Operator confirmation accepted. Runtime now armed.'
        : 'Arm confirm ignored because state was not pending.',
    });

    return syncBootWithEvidence(next);
  }

  return state;
}

