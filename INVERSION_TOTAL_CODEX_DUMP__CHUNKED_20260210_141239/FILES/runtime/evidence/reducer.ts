
import { DEFAULT_EVIDENCE_REGISTRY } from './registry';
import {
  EvidenceReducerAction,
  EvidenceStateEntry,
  EvidenceStoreState,
  EvidenceSummary,
  EvidenceTransition,
  EvidenceTransitionKind,
} from './types';

function createEntry(key: EvidenceStateEntry['key']): EvidenceStateEntry {
  return {
    key,
    satisfied: false,
    satisfiedAtTs: null,
    satisfiedByEventId: null,
    satisfiedByAction: null,
    lastTransitionAtTs: null,
    transitionHistory: [],
  };
}

function createEntries(): EvidenceStoreState['entries'] {
  const entries = {} as EvidenceStoreState['entries'];
  for (const key of DEFAULT_EVIDENCE_REGISTRY.orderedKeys) {
    entries[key] = createEntry(key);
  }
  return entries;
}

export function createInitialEvidenceState(): EvidenceStoreState {
  return {
    registryVersion: DEFAULT_EVIDENCE_REGISTRY.version,
    entries: createEntries(),
    eventLog: [],
    eventCount: 0,
    lastEvent: null,
    lastInteractedAnchor: null,
  };
}

function applyTransition(args: {
  entry: EvidenceStateEntry;
  transition: EvidenceTransition;
  eventId: string;
  action: string;
  actor: 'operator' | 'system';
  ts: number;
}): EvidenceStateEntry {
  const { entry, transition, eventId, action, actor, ts } = args;
  if (transition.kind === 'noop') return entry;

  const nextSatisfied = transition.kind === 'satisfy';
  const base: EvidenceStateEntry = {
    ...entry,
    satisfied: nextSatisfied,
    satisfiedAtTs: nextSatisfied ? ts : entry.satisfiedAtTs,
    satisfiedByEventId: nextSatisfied ? eventId : entry.satisfiedByEventId,
    satisfiedByAction: nextSatisfied ? action : entry.satisfiedByAction,
    lastTransitionAtTs: ts,
  };

  if (transition.kind === 'unsatisfy') {
    base.satisfiedAtTs = null;
    base.satisfiedByEventId = null;
    base.satisfiedByAction = null;
  }

  const historyKind: EvidenceTransitionKind = transition.kind;
  base.transitionHistory = [
    ...entry.transitionHistory,
    {
      eventId,
      action,
      actor,
      ts,
      kind: historyKind,
    },
  ];

  return base;
}

export function reduceEvidenceState(state: EvidenceStoreState, action: EvidenceReducerAction): EvidenceStoreState {
  if (action.type === 'EVIDENCE_RESET') {
    return createInitialEvidenceState();
  }

  if (action.type === 'EVIDENCE_RESTORE') {
    return {
      registryVersion: action.snapshot.registryVersion,
      entries: action.snapshot.entries,
      eventLog: action.snapshot.eventLog,
      eventCount: action.snapshot.eventCount,
      lastEvent: action.snapshot.eventLog[action.snapshot.eventLog.length - 1] ?? null,
      lastInteractedAnchor: action.snapshot.lastInteractedAnchor,
    };
  }

  if (action.type !== 'EVIDENCE_INGEST_EVENT') {
    return state;
  }

  const { event, transitions } = action;
  const nextEntries = { ...state.entries };

  for (const transition of transitions) {
    const prevEntry = nextEntries[transition.key];
    nextEntries[transition.key] = applyTransition({
      entry: prevEntry,
      transition,
      eventId: event.id,
      action: event.action,
      actor: event.actor,
      ts: event.ts,
    });
  }

  const nextEventLog = [...state.eventLog, event];

  return {
    ...state,
    entries: nextEntries,
    eventLog: nextEventLog,
    eventCount: state.eventCount + 1,
    lastEvent: event,
    lastInteractedAnchor: event.anchorId ?? state.lastInteractedAnchor,
  };
}

export function summarizeEvidence(state: EvidenceStoreState): EvidenceSummary {
  let blockersSatisfied = 0;
  let blockersMissing = 0;
  let informationalSatisfied = 0;
  let informationalMissing = 0;

  for (const key of DEFAULT_EVIDENCE_REGISTRY.orderedKeys) {
    const entry = state.entries[key];
    const definition = DEFAULT_EVIDENCE_REGISTRY.definitions[key];

    if (definition.level === 'blocker') {
      if (entry.satisfied) blockersSatisfied += 1;
      else blockersMissing += 1;
      continue;
    }

    if (entry.satisfied) informationalSatisfied += 1;
    else informationalMissing += 1;
  }

  return {
    blockersSatisfied,
    blockersMissing,
    informationalSatisfied,
    informationalMissing,
  };
}

