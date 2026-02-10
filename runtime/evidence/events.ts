import { EvidenceActor, EvidenceEventPayload, EvidenceIngestionEvent } from './types';

export function toDeterministicEvidenceEventId(sequence: number): string {
  const serial = String(Math.max(0, sequence)).padStart(6, '0');
  return `ev-${serial}`;
}

export function createEvidenceEvent(args: {
  sequence: number;
  action: string;
  actor: EvidenceActor;
  ts: number;
  payload?: EvidenceEventPayload;
  anchorId?: string;
}): EvidenceIngestionEvent {
  return {
    id: toDeterministicEvidenceEventId(args.sequence),
    action: args.action,
    actor: args.actor,
    ts: args.ts,
    payload: args.payload,
    anchorId: args.anchorId,
  };
}
