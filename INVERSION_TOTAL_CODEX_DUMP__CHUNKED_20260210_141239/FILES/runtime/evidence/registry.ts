
import {
  EvidenceDefinition,
  EvidenceKey,
  EvidenceRegistry,
  EvidenceTransitionRule,
} from './types';

const DEFINITIONS: Record<EvidenceKey, EvidenceDefinition> = {
  'evidence:system:armed': {
    key: 'evidence:system:armed',
    stableId: 'ev.system.armed',
    title: 'System armed',
    description: 'Primary blocker: the operator explicitly armed the runtime and confirmed intent.',
    level: 'blocker',
    blockers: ['WOW_TOUR_AUTOSTART', 'WOW_DEMO_SCRIPT', 'WOW_OPENING_CINEMA', 'WOW_MIRROR'],
  },
  'evidence:slide00:entered': {
    key: 'evidence:slide00:entered',
    stableId: 'ev.slide00.entered',
    title: 'Slide 00 entered',
    description: 'Observability marker to prove deterministic entry path reached BOOT gate.',
    level: 'informational',
    blockers: [],
  },
  'evidence:boot:arm:requested': {
    key: 'evidence:boot:arm:requested',
    stableId: 'ev.boot.arm.requested',
    title: 'Arm requested',
    description: 'Operator initiated arming flow.',
    level: 'informational',
    blockers: [],
  },
  'evidence:boot:arm:confirmed': {
    key: 'evidence:boot:arm:confirmed',
    stableId: 'ev.boot.arm.confirmed',
    title: 'Arm confirmed',
    description: 'Operator confirmed arming with explicit confirmation action.',
    level: 'informational',
    blockers: [],
  },
  'evidence:boot:operator:override': {
    key: 'evidence:boot:operator:override',
    stableId: 'ev.boot.operator.override',
    title: 'Operator override engaged',
    description: 'Manual override enabled. This is operator-assisted and does not satisfy blockers.',
    level: 'informational',
    blockers: [],
  },
};

export const DEFAULT_EVIDENCE_REGISTRY: EvidenceRegistry = {
  version: 'hitech-evidence-registry-v1',
  definitions: DEFINITIONS,
  orderedKeys: Object.keys(DEFINITIONS) as EvidenceKey[],
};

const TRANSITION_RULES: EvidenceTransitionRule[] = [
  {
    action: 'slide:00:entered',
    transitions: [{ key: 'evidence:slide00:entered', kind: 'satisfy' }],
  },
  {
    action: 'boot:arm:requested',
    transitions: [{ key: 'evidence:boot:arm:requested', kind: 'satisfy' }],
  },
  {
    action: 'boot:arm:confirmed',
    transitions: [
      { key: 'evidence:boot:arm:confirmed', kind: 'satisfy' },
      { key: 'evidence:system:armed', kind: 'satisfy' },
      { key: 'evidence:boot:operator:override', kind: 'unsatisfy' },
    ],
  },
  {
    action: 'boot:override:enabled',
    transitions: [{ key: 'evidence:boot:operator:override', kind: 'satisfy' }],
  },
  {
    action: 'boot:override:disabled',
    transitions: [{ key: 'evidence:boot:operator:override', kind: 'unsatisfy' }],
  },
  {
    action: 'boot:local:reset',
    transitions: [
      { key: 'evidence:system:armed', kind: 'unsatisfy' },
      { key: 'evidence:boot:arm:requested', kind: 'unsatisfy' },
      { key: 'evidence:boot:arm:confirmed', kind: 'unsatisfy' },
      { key: 'evidence:boot:operator:override', kind: 'unsatisfy' },
      { key: 'evidence:slide00:entered', kind: 'unsatisfy' },
    ],
  },
];

export function transitionsForEvidenceAction(action: string) {
  const found = TRANSITION_RULES.find((rule) => rule.action === action);
  return found ? found.transitions : [];
}

export function getEvidenceDefinition(key: EvidenceKey): EvidenceDefinition {
  return DEFAULT_EVIDENCE_REGISTRY.definitions[key];
}

export function listEvidenceDefinitions(): EvidenceDefinition[] {
  return DEFAULT_EVIDENCE_REGISTRY.orderedKeys.map((key) => DEFAULT_EVIDENCE_REGISTRY.definitions[key]);
}

export function isEvidenceKey(value: string): value is EvidenceKey {
  return value in DEFAULT_EVIDENCE_REGISTRY.definitions;
}

