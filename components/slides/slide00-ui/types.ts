import { BootLifecycleState } from "../../../runtime/boot";

export type GateRow = {
  key: string;
  label: string;
  ready: boolean;
  lock: boolean;
  reason: string;
};

export type EvidenceRow = {
  key: string;
  title: string;
  description: string;
  satisfied: boolean;
  blocker: boolean;
  satisfiedAtTs: number | null;
};

export type EvidenceStatusCard = {
  key: string;
  value: string;
  good?: boolean;
  warn?: boolean;
  danger?: boolean;
};

export type ConfirmSlotState = "armed" | "pending" | "empty";

export type BootStatusChip = {
  id: BootLifecycleState;
  label: string;
  variant?: "default" | "warning" | "danger";
};

export type DiagnosticsMetaItem = {
  key: string;
  label: string;
  value: string;
  testId?: string;
};

export type DiagnosticsControlRow = {
  key: string;
  copy: string;
  actions: Array<{
    key: string;
    label: string;
    active?: boolean;
    onClick: () => void;
    testId?: string;
  }>;
};

export type DiagnosticsLogRow = {
  id: string;
  head: string;
  body: string;
};

export type ViewToggleState = {
  showTopHudRow: boolean;
  showTopRibbon: boolean;
  showDiagnostics: boolean;
};
