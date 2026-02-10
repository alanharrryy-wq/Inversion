export type EvidenceLevel = 'blocker' | 'informational';

export type EvidenceKey =
  | 'evidence:system:armed'
  | 'evidence:slide00:entered'
  | 'evidence:boot:arm:requested'
  | 'evidence:boot:arm:confirmed'
  | 'evidence:boot:operator:override';

export type EvidenceActor = 'operator' | 'system';

export type EvidenceTransitionKind = 'satisfy' | 'unsatisfy' | 'noop';

export type EvidenceEventPayload = {
  slide?: number;
  anchorId?: string;
  reason?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export type EvidenceDefinition = {
  key: EvidenceKey;
  stableId: string;
  title: string;
  description: string;
  level: EvidenceLevel;
  blockers: readonly string[];
};

export type EvidenceRegistry = {
  version: string;
  definitions: Record<EvidenceKey, EvidenceDefinition>;
  orderedKeys: EvidenceKey[];
};

export type EvidenceIngestionEvent = {
  id: string;
  action: string;
  actor: EvidenceActor;
  ts: number;
  anchorId?: string;
  payload?: EvidenceEventPayload;
};

export type EvidenceStateEntry = {
  key: EvidenceKey;
  satisfied: boolean;
  satisfiedAtTs: number | null;
  satisfiedByEventId: string | null;
  satisfiedByAction: string | null;
  lastTransitionAtTs: number | null;
  transitionHistory: {
    eventId: string;
    action: string;
    ts: number;
    kind: EvidenceTransitionKind;
    actor: EvidenceActor;
  }[];
};

export type EvidenceStoreState = {
  registryVersion: string;
  entries: Record<EvidenceKey, EvidenceStateEntry>;
  eventLog: EvidenceIngestionEvent[];
  eventCount: number;
  lastEvent: EvidenceIngestionEvent | null;
  lastInteractedAnchor: string | null;
};

export type EvidenceTransition = {
  key: EvidenceKey;
  kind: EvidenceTransitionKind;
};

export type EvidenceTransitionRule = {
  action: string;
  transitions: EvidenceTransition[];
};

export type EvidenceReducerAction =
  | {
      type: 'EVIDENCE_INGEST_EVENT';
      event: EvidenceIngestionEvent;
      transitions: EvidenceTransition[];
    }
  | {
      type: 'EVIDENCE_RESET';
    }
  | {
      type: 'EVIDENCE_RESTORE';
      snapshot: EvidenceSnapshot;
    };

export type EvidenceSnapshot = {
  schema: 'hitech.evidence.snapshot.v1';
  exportedAtTs: number;
  registryVersion: string;
  entries: Record<EvidenceKey, Omit<EvidenceStateEntry, 'transitionHistory'> & { transitionHistory: EvidenceStateEntry['transitionHistory'] }>;
  eventLog: EvidenceIngestionEvent[];
  eventCount: number;
  lastInteractedAnchor: string | null;
};

export type EvidenceSummary = {
  blockersSatisfied: number;
  blockersMissing: number;
  informationalSatisfied: number;
  informationalMissing: number;
};
