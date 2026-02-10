import { BootLifecycleState, BootRuntimeApi } from "../../../runtime/boot";
import { listEvidenceDefinitions } from "../../../runtime/evidence";
import { ConfirmSlotState, EvidenceRow, EvidenceStatusCard, GateRow } from "./types";

export function humanReason(reason: string): string {
  return reason.replace(/[-_:]/g, " ").replace(/\s+/g, " ").trim();
}

export function formatTimestamp(ts: number | null): string {
  if (!ts) return "--";
  const date = new Date(ts);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTime(ts: number | null): string {
  if (!ts) return "--";
  const date = new Date(ts);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export function statusLabel(status: BootLifecycleState): string {
  if (status === "IDLE") return "IDLE";
  if (status === "ARMED_PENDING_CONFIRM") return "PENDING";
  if (status === "ARMED_CONFIRMED") return "ARMED_CONFIRMED";
  if (status === "OPERATOR_ASSISTED") return "OPERATOR_ASSISTED";
  return status;
}

export function statusNarrative(status: BootLifecycleState): string {
  if (status === "IDLE") return "System is cold. No progression is allowed.";
  if (status === "ARMED_PENDING_CONFIRM") return "Arm requested. Explicit confirmation required.";
  if (status === "ARMED_CONFIRMED") return "System armed with blocker evidence satisfied.";
  if (status === "OPERATOR_ASSISTED") return "Override path active. Evidence remains unsatisfied.";
  return "Unknown runtime status.";
}

export function buildEvidenceRows(boot: Pick<BootRuntimeApi, "state">): EvidenceRow[] {
  const registry = listEvidenceDefinitions();
  return registry.map((definition) => {
    const entry = boot.state.evidence.entries[definition.key];

    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      satisfied: entry?.satisfied ?? false,
      blocker: definition.level === "blocker",
      satisfiedAtTs: entry?.satisfiedAtTs ?? null,
    };
  });
}

export function buildGateRows(boot: Pick<BootRuntimeApi, "gates">): GateRow[] {
  return [
    {
      key: "tour",
      label: "WOW TOUR",
      ready: boot.gates.tour.ready,
      lock: boot.gates.tour.locked,
      reason: boot.gates.tour.reason,
    },
    {
      key: "tour-autostart",
      label: "WOW TOUR AUTOSTART",
      ready: boot.gates.tourAutostart.ready,
      lock: boot.gates.tourAutostart.locked,
      reason: boot.gates.tourAutostart.reason,
    },
    {
      key: "demo-script",
      label: "WOW DEMO SCRIPT",
      ready: boot.gates.demoScript.ready,
      lock: boot.gates.demoScript.locked,
      reason: boot.gates.demoScript.reason,
    },
    {
      key: "opening-cinema",
      label: "WOW OPENING CINEMA",
      ready: boot.gates.openingCinema.ready,
      lock: boot.gates.openingCinema.locked,
      reason: boot.gates.openingCinema.reason,
    },
    {
      key: "mirror-intro",
      label: "WOW MIRROR INTRO",
      ready: boot.gates.mirrorIntro.ready,
      lock: boot.gates.mirrorIntro.locked,
      reason: boot.gates.mirrorIntro.reason,
    },
  ];
}

export function buildEvidenceStatusCards(args: {
  gateLocked: boolean;
  armed: boolean;
  operatorAssisted: boolean;
  missingBlockers: number;
  satisfiedBlockers: number;
}): EvidenceStatusCard[] {
  const {
    gateLocked,
    armed,
    operatorAssisted,
    missingBlockers,
    satisfiedBlockers,
  } = args;

  return [
    {
      key: "gate",
      value: gateLocked ? "LOCKED" : "OPEN",
      danger: gateLocked,
      good: !gateLocked,
    },
    {
      key: "blockers",
      value: `${satisfiedBlockers}/${satisfiedBlockers + missingBlockers}`,
      warn: missingBlockers > 0,
      good: missingBlockers === 0,
    },
    {
      key: "path",
      value: armed ? "EVIDENCE" : operatorAssisted ? "OPERATOR_ASSISTED" : "STRICT",
      warn: operatorAssisted,
      good: armed,
    },
  ];
}

export function buildConfirmSlotContent(args: {
  status: BootLifecycleState;
  isArmed: boolean;
}): {
  state: ConfirmSlotState;
  text: string;
  strongText?: string;
} {
  const { status, isArmed } = args;

  if (isArmed) {
    return {
      state: "armed",
      text: "confirm slot:",
      strongText: "system armed and blocker evidence satisfied",
    };
  }

  if (status === "ARMED_PENDING_CONFIRM") {
    return {
      state: "pending",
      text: "confirm slot:",
      strongText: "awaiting explicit confirmation",
    };
  }

  return {
    state: "empty",
    text: "confirm slot empty until arming has been explicitly confirmed.",
  };
}

export function collectSystemStorageKeys(storage: Storage): string[] {
  const keys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    if (key.startsWith("hitech.") || key.startsWith("HITECH_")) {
      keys.push(key);
    }
  }

  return keys.sort();
}

export function clearSystemStorageKeys(storage: Storage): number {
  const keys = collectSystemStorageKeys(storage);

  for (const key of keys) {
    storage.removeItem(key);
  }

  return keys.length;
}
