import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header, NavArea, SlideContainer } from "../SlideRenderer";
import {
  OPERATOR_DIAGNOSTICS,
  WOW_DEMO_SCRIPT,
  WOW_MIRROR,
  WOW_OPENING_CINEMA,
  WOW_TOUR,
  WOW_TOUR_AUTOSTART,
} from "../../config/wow";
import { useBootRuntime } from "../../runtime/boot/BootRuntimeContext";
import {
  BootFoot,
  BootNote,
  BootPanel,
  BootPanelBody,
  BootPanelFooter,
  BootPanelHeader,
  BootSideColumn,
  BootStatusBadge,
  BootToast,
  BootTopline,
  DiagnosticsDock,
  DiagnosticsDockToggle,
  EvidenceList,
  FirstProofCanonicalProfile,
  FirstProofRitual,
  FirstProofSnapshot,
  GateMatrix,
  OpeningFlagsBadge,
  PersistenceIndicator,
  RightSeal,
  ResetControls,
  Slide00HiddenState,
  Slide00Shell,
  ViewControlsTogglePanel,
  buildEvidenceRows,
  buildEvidenceStatusCards,
  buildGateRows,
  clearSystemStorageKeys,
  collectSystemStorageKeys,
  createInitialFirstProofState,
  deriveFirstProofSnapshot,
  formatDateTime,
  formatTimestamp,
  humanReason,
  resolveFirstProofProfileSetting,
  useSlide00ViewVisibility,
} from "./slide00-ui";
import { CopyBoundary, useCopy } from "./slide00-ui/copy";
import {
  FitDiagnosticsOverlay,
  PowerConsoleFrame,
  PowerConsoleGrid,
  PowerConsoleSection,
  SideDockScrollRegion,
  useDensityPreset,
  useViewportMetrics,
} from "./slide00-ui/layout";
import { FirstActionModel, FirstActionsRail, StatusStrip, StatusStripItem } from "./slide00-ui/interactions";
import { TokenBridge } from "./slide00-ui/tokens/TokenBridge";
import { BootStatusChip, ConfirmSlotState } from "./slide00-ui/types";
import "./Slide00.boot.css";

const SHOW_FIT_DIAGNOSTICS = false;

type Slide00Props = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export const Slide00: React.FC<Slide00Props> = (props) => {
  return (
    <CopyBoundary>
      <Slide00Content {...props} />
    </CopyBoundary>
  );
};

type PersistenceState = {
  hasSnapshot: boolean;
  keys: string[];
};

function readPersistenceState(): PersistenceState {
  if (typeof window === "undefined") {
    return { hasSnapshot: false, keys: [] };
  }

  const keys = collectSystemStorageKeys(window.localStorage);
  return {
    hasSnapshot: keys.includes("hitech.boot.snapshot.v1"),
    keys,
  };
}

const Slide00Content: React.FC<Slide00Props> = ({ nextSlide, prevSlide }) => {
  const boot = useBootRuntime();
  const viewVisibility = useSlide00ViewVisibility();
  const { t } = useCopy();
  const firstProofProfile = useMemo<FirstProofCanonicalProfile>(
    () => resolveFirstProofProfileSetting(),
    []
  );
  const [showToast, setShowToast] = useState(false);
  const [toastDetail, setToastDetail] = useState(() => t("slide00.toast.title"));
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsCompact, setDiagnosticsCompact] = useState(false);
  const [demoScriptActive, setDemoScriptActive] = useState(false);
  const [mirrorActive, setMirrorActive] = useState(false);
  const [persistence, setPersistence] = useState<PersistenceState>(() => readPersistenceState());
  const [firstProofSnapshot, setFirstProofSnapshot] = useState<FirstProofSnapshot>(() =>
    deriveFirstProofSnapshot(createInitialFirstProofState())
  );
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const lastToastLogIdRef = useRef<string | null>(null);
  const viewportMetrics = useViewportMetrics();
  const densityPreset = useDensityPreset(viewportMetrics);

  const refreshPersistence = useCallback(() => {
    setPersistence(readPersistenceState());
  }, []);

  const onFirstProofSnapshotChange = useCallback((snapshot: FirstProofSnapshot) => {
    setFirstProofSnapshot(snapshot);
  }, []);

  const evidenceRows = useMemo(() => buildEvidenceRows(boot), [boot.state.evidence]);
  const blockerRows = useMemo(
    () => evidenceRows.filter((row) => row.blocker),
    [evidenceRows]
  );
  const gateRows = useMemo(() => buildGateRows(boot), [boot.gates]);

  const kpiCards = useMemo(
    () =>
      buildEvidenceStatusCards({
        gateLocked: boot.gateLocked,
        armed: boot.isArmed,
        operatorAssisted: boot.isOperatorAssisted,
        missingBlockers: boot.diagnostics.evidenceSummary.blockersMissing,
        satisfiedBlockers: boot.diagnostics.evidenceSummary.blockersSatisfied,
        labels: {
          gateKey: t("slide00.kpi.gate"),
          blockersKey: t("slide00.kpi.blockers"),
          pathKey: t("slide00.kpi.path"),
          gateLockedValue: t("slide00.kpi.gate.locked"),
          gateOpenValue: t("slide00.kpi.gate.open"),
          pathEvidenceValue: t("slide00.kpi.path.evidence"),
          pathAssistedValue: t("slide00.kpi.path.assisted"),
          pathStrictValue: t("slide00.kpi.path.strict"),
        },
      }),
    [boot.gateLocked, boot.isArmed, boot.isOperatorAssisted, boot.diagnostics.evidenceSummary, t]
  );

  const confirmSlot = useMemo(
    () => {
      if (boot.isArmed) {
        return {
          state: "armed" as ConfirmSlotState,
          text: t("slide00.confirm.prefix"),
          strongText: t("slide00.confirm.armed"),
        };
      }

      if (boot.state.boot.status === "ARMED_PENDING_CONFIRM") {
        return {
          state: "pending" as ConfirmSlotState,
          text: t("slide00.confirm.prefix"),
          strongText: t("slide00.confirm.pending"),
        };
      }

      return {
        state: "empty" as ConfirmSlotState,
        text: t("slide00.confirm.empty"),
      };
    },
    [boot.state.boot.status, boot.isArmed, t]
  );

  const showConfirmButton =
    boot.state.boot.status === "ARMED_PENDING_CONFIRM" ||
    (boot.state.boot.status === "OPERATOR_ASSISTED" && !boot.isArmed);

  const confirmLabel =
    boot.state.boot.status === "OPERATOR_ASSISTED" && !boot.isArmed
      ? t("slide00.panel.confirmOverrideButton")
      : t("slide00.panel.confirmButton");

  const canConfirm =
    boot.state.boot.status === "ARMED_PENDING_CONFIRM" ? boot.canConfirm : true;

  useEffect(() => {
    const lastLog = boot.state.operatorLog[boot.state.operatorLog.length - 1];
    if (!lastLog) return;
    if (lastLog.action !== "boot:arm:confirmed") return;
    if (lastToastLogIdRef.current === lastLog.id) return;

    lastToastLogIdRef.current = lastLog.id;
    setToastDetail(lastLog.title);
    setShowToast(true);
  }, [boot.state.operatorLog]);

  useEffect(() => {
    refreshPersistence();
  }, [boot.state, refreshPersistence]);

  useEffect(() => {
    if (viewVisibility.showDiagnostics) return;
    setDiagnosticsOpen(false);
  }, [viewVisibility.showDiagnostics]);

  const armNow = useCallback(() => {
    boot.recordAnchorInteraction("slide00:arm-system", "Primary arm button clicked");
    if (!boot.canArm) return;
    boot.requestArm();
  }, [boot]);

  const confirmArm = useCallback(() => {
    boot.recordAnchorInteraction("slide00:confirm-arm", "Arm confirmation clicked");
    if (boot.state.boot.status === "ARMED_PENDING_CONFIRM" && !boot.canConfirm) return;
    boot.confirmArm();
  }, [boot]);

  const toggleOverride = useCallback(() => {
    boot.recordAnchorInteraction("slide00:override-toggle", "Operator override toggled");
    boot.setOverride(!boot.state.boot.overrideEnabled);
  }, [boot]);

  const softReset = useCallback(() => {
    boot.recordAnchorInteraction("slide00:soft-reset", "Operator soft reset requested");
    boot.resetLocal();
    setShowToast(false);
    refreshPersistence();
  }, [boot, refreshPersistence]);

  const hardReset = useCallback(() => {
    boot.recordAnchorInteraction("slide00:hard-reset", "Operator hard reset requested");
    boot.resetLocal();

    if (typeof window !== "undefined") {
      const cleared = clearSystemStorageKeys(window.localStorage);
      boot.appendOperatorLog({
        level: "warning",
        title: "Hard reset completed",
        detail: `Cleared ${cleared} local storage key(s).`,
        action: "boot:reset:hard",
      });
    }

    setShowToast(false);
    refreshPersistence();
  }, [boot, refreshPersistence]);

  const copySnapshot = useCallback(async () => {
    boot.recordAnchorInteraction("slide00:snapshot-copy", "Operator requested snapshot copy");
    const copied = await boot.copySnapshotToClipboard();

    boot.appendOperatorLog({
      level: copied ? "success" : "warning",
      title: copied ? "Snapshot copied" : "Snapshot copy unavailable",
      detail: copied
        ? "Snapshot JSON copied to clipboard."
        : "Clipboard API unavailable. Use download snapshot.",
      action: copied ? "boot:snapshot:copied" : "boot:snapshot:copy:failed",
    });

    return copied;
  }, [boot]);

  const downloadSnapshot = useCallback(() => {
    boot.recordAnchorInteraction(
      "slide00:snapshot-download",
      "Operator requested snapshot download"
    );
    const downloaded = boot.downloadSnapshot("boot-snapshot.json");

    boot.appendOperatorLog({
      level: downloaded ? "success" : "warning",
      title: downloaded ? "Snapshot downloaded" : "Snapshot download unavailable",
      detail: downloaded
        ? "Snapshot file was generated locally."
        : "Download API unavailable in this environment.",
      action: downloaded ? "boot:snapshot:downloaded" : "boot:snapshot:download:failed",
    });

    return downloaded;
  }, [boot]);

  const toggleDemoScript = useCallback(() => {
    const next = !demoScriptActive;
    setDemoScriptActive(next);
    boot.recordAnchorInteraction(
      "slide00:toggle-demo-script",
      `Demo script toggled ${next ? "on" : "off"}`
    );
    window.dispatchEvent(
      new CustomEvent("wow:demo-script-toggle", { detail: { enabled: next } })
    );
  }, [boot, demoScriptActive]);

  const toggleMirror = useCallback(() => {
    const next = !mirrorActive;
    setMirrorActive(next);
    boot.recordAnchorInteraction(
      "slide00:toggle-mirror",
      `Mirror intro toggled ${next ? "on" : "off"}`
    );
    window.dispatchEvent(new CustomEvent("wow:mirror-toggle", { detail: { enabled: next } }));
  }, [boot, mirrorActive]);

  const diagnosticsMeta = useMemo(
    () => [
      {
        key: "state",
        label: t("slide00.diagnostics.meta.state"),
        value: boot.state.boot.status,
        testId: "boot-state-value",
      },
      {
        key: "gate",
        label: t("slide00.diagnostics.meta.gate"),
        value: boot.gateLocked ? t("slide00.kpi.gate.locked") : t("slide00.kpi.gate.open"),
      },
      {
        key: "event",
        label: t("slide00.diagnostics.meta.event"),
        value: boot.diagnostics.lastEvent
          ? `${boot.diagnostics.lastEvent.id} · ${boot.diagnostics.lastEvent.action}`
          : t("slide00.diagnostics.meta.none"),
      },
      {
        key: "anchor",
        label: t("slide00.diagnostics.meta.anchor"),
        value: boot.diagnostics.lastInteractedAnchor ?? t("slide00.diagnostics.meta.none"),
      },
    ],
    [boot.state.boot.status, boot.gateLocked, boot.diagnostics.lastEvent, boot.diagnostics.lastInteractedAnchor, t]
  );

  const diagnosticsControls = useMemo(
    () => [
      {
        key: "override",
        copy: t("slide00.diagnostics.controls.override.copy"),
        actions: [
          {
            key: "toggle",
            label: boot.state.boot.overrideEnabled
              ? t("slide00.diagnostics.controls.override.on")
              : t("slide00.diagnostics.controls.override.off"),
            active: boot.state.boot.overrideEnabled,
            onClick: toggleOverride,
            testId: "operator-override-toggle",
          },
        ],
      },
      {
        key: "reset",
        copy: t("slide00.diagnostics.controls.reset.copy"),
        actions: [
          {
            key: "soft-reset",
            label: t("slide00.diagnostics.controls.reset.button"),
            onClick: softReset,
            testId: "operator-reset-local",
          },
        ],
      },
      {
        key: "snapshot",
        copy: t("slide00.diagnostics.controls.snapshot.copy"),
        actions: [
          {
            key: "copy",
            label: t("slide00.diagnostics.controls.snapshot.copyButton"),
            onClick: copySnapshot,
            testId: "operator-copy-snapshot",
          },
          {
            key: "download",
            label: t("slide00.diagnostics.controls.snapshot.downloadButton"),
            onClick: downloadSnapshot,
            testId: "operator-download-snapshot",
          },
        ],
      },
      {
        key: "demo-script",
        copy: t("slide00.diagnostics.controls.demo.copy"),
        actions: [
          {
            key: "demo",
            label: demoScriptActive
              ? t("slide00.diagnostics.controls.demo.on")
              : t("slide00.diagnostics.controls.demo.off"),
            active: demoScriptActive,
            onClick: toggleDemoScript,
          },
        ],
      },
      {
        key: "mirror",
        copy: t("slide00.diagnostics.controls.mirror.copy"),
        actions: [
          {
            key: "mirror",
            label: mirrorActive
              ? t("slide00.diagnostics.controls.mirror.on")
              : t("slide00.diagnostics.controls.mirror.off"),
            active: mirrorActive,
            onClick: toggleMirror,
          },
        ],
      },
    ],
    [
      boot.state.boot.overrideEnabled,
      copySnapshot,
      demoScriptActive,
      downloadSnapshot,
      mirrorActive,
      softReset,
      toggleDemoScript,
      toggleMirror,
      toggleOverride,
      t,
    ]
  );

  const diagnosticsLogRows = useMemo(
    () =>
      boot.state.operatorLog
        .slice(-8)
        .reverse()
        .map((entry) => ({
          id: entry.id,
          head: `${entry.action} · ${formatTimestamp(entry.ts)}`,
          body: `${entry.title} - ${entry.detail}`,
        })),
    [boot.state.operatorLog]
  );

  const lastEventLabel = boot.diagnostics.lastEvent
    ? `${boot.diagnostics.lastEvent.id} · ${boot.diagnostics.lastEvent.action}`
    : t("slide00.diagnostics.meta.none");

  const cinematicFlagSummary = [
    WOW_TOUR ? "tour" : null,
    WOW_TOUR_AUTOSTART ? "tour_autostart" : null,
    WOW_DEMO_SCRIPT ? "demo_script" : null,
    WOW_OPENING_CINEMA ? "opening_cinema" : null,
    WOW_MIRROR ? "mirror" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const status = useMemo(() => {
    if (boot.state.boot.status === "IDLE") return t("slide00.statusLabel.IDLE");
    if (boot.state.boot.status === "ARMED_PENDING_CONFIRM") return t("slide00.statusLabel.ARMED_PENDING_CONFIRM");
    if (boot.state.boot.status === "ARMED_CONFIRMED") return t("slide00.statusLabel.ARMED_CONFIRMED");
    if (boot.state.boot.status === "OPERATOR_ASSISTED") return t("slide00.statusLabel.OPERATOR_ASSISTED");
    return boot.state.boot.status;
  }, [boot.state.boot.status, t]);

  const statusNarrativeLabel = useMemo(() => {
    if (boot.state.boot.status === "IDLE") return t("slide00.statusNarrative.IDLE");
    if (boot.state.boot.status === "ARMED_PENDING_CONFIRM") return t("slide00.statusNarrative.ARMED_PENDING_CONFIRM");
    if (boot.state.boot.status === "ARMED_CONFIRMED") return t("slide00.statusNarrative.ARMED_CONFIRMED");
    if (boot.state.boot.status === "OPERATOR_ASSISTED") return t("slide00.statusNarrative.OPERATOR_ASSISTED");
    return t("slide00.statusNarrative.UNKNOWN");
  }, [boot.state.boot.status, t]);

  const diagnosticsSurfaceVisible = viewVisibility.showDiagnostics && OPERATOR_DIAGNOSTICS;
  const stateChips = useMemo<BootStatusChip[]>(
    () => [
      { id: "IDLE", label: t("slide00.stateChip.idle"), variant: "danger" },
      { id: "ARMED_PENDING_CONFIRM", label: t("slide00.stateChip.pending"), variant: "warning" },
      { id: "ARMED_CONFIRMED", label: t("slide00.stateChip.armed"), variant: "default" },
      { id: "OPERATOR_ASSISTED", label: t("slide00.stateChip.assisted"), variant: "warning" },
    ],
    [t]
  );

  const addActionFeedback = useCallback((actionId: string, message: string) => {
    setActionFeedback((prev) => ({
      ...prev,
      [actionId]: `${message} · ${formatTimestamp(Date.now())}`,
    }));
  }, []);

  const runFirstAction = useCallback(
    async (
      actionId: string,
      label: string,
      enabled: boolean,
      action: () => void | Promise<boolean>
    ) => {
      if (!enabled) {
        addActionFeedback(actionId, t("slide00.actionFeedback.blocked", { label }));
        return;
      }

      const result = await action();
      if (result === false) {
        addActionFeedback(actionId, t("slide00.actionFeedback.unavailable", { label }));
        return;
      }

      addActionFeedback(actionId, t("slide00.actionFeedback.executed", { label }));
    },
    [addActionFeedback, t]
  );

  const statusTone =
    boot.state.boot.status === "ARMED_CONFIRMED"
      ? "good"
      : boot.state.boot.status === "ARMED_PENDING_CONFIRM"
        ? "warn"
        : boot.state.boot.status === "OPERATOR_ASSISTED"
          ? "warn"
          : "danger";

  const statusItems = useMemo<StatusStripItem[]>(
    () => [
      {
        key: "state",
        label: t("slide00.statusStrip.state"),
        value: status,
        tone: statusTone,
      },
      {
        key: "gate",
        label: t("slide00.statusStrip.gate"),
        value: boot.gateLocked ? t("slide00.kpi.gate.locked") : t("slide00.kpi.gate.open"),
        tone: boot.gateLocked ? "danger" : "good",
      },
      {
        key: "path",
        label: t("slide00.statusStrip.path"),
        value: boot.isArmed
          ? t("slide00.kpi.path.evidence")
          : boot.isOperatorAssisted
            ? t("slide00.kpi.path.assisted")
            : t("slide00.kpi.path.strict"),
        tone: boot.isArmed ? "good" : boot.isOperatorAssisted ? "warn" : "neutral",
      },
      {
        key: "blockers",
        label: t("slide00.statusStrip.blockers"),
        value: `${boot.diagnostics.evidenceSummary.blockersSatisfied}/${
          boot.diagnostics.evidenceSummary.blockersSatisfied +
          boot.diagnostics.evidenceSummary.blockersMissing
        }`,
        tone: boot.diagnostics.evidenceSummary.blockersMissing > 0 ? "warn" : "good",
      },
    ],
    [
      boot.gateLocked,
      boot.isArmed,
      boot.isOperatorAssisted,
      boot.diagnostics.evidenceSummary.blockersSatisfied,
      boot.diagnostics.evidenceSummary.blockersMissing,
      status,
      statusTone,
      t,
    ]
  );

  const firstActions = useMemo<FirstActionModel[]>(
    () => [
      {
        id: "arm",
        title: t("slide00.firstActions.action.arm.title"),
        description: t("slide00.firstActions.action.arm.description"),
        badge: boot.canArm ? t("slide00.firstActions.badge.ready") : t("slide00.firstActions.badge.blocked"),
        badgeTone: boot.canArm ? "good" : "warn",
        enabled: boot.canArm,
        feedback: actionFeedback.arm,
        onClick: () => {
          void runFirstAction("arm", t("slide00.firstActions.action.arm.confirm"), boot.canArm, () => {
            armNow();
          });
        },
        testId: "first-action-arm",
      },
      {
        id: "confirm",
        title: t("slide00.firstActions.action.confirm.title"),
        description: t("slide00.firstActions.action.confirm.description"),
        badge: canConfirm && showConfirmButton
          ? t("slide00.firstActions.badge.ready")
          : t("slide00.firstActions.badge.blocked"),
        badgeTone: canConfirm && showConfirmButton ? "good" : "warn",
        enabled: canConfirm && showConfirmButton,
        feedback: actionFeedback.confirm,
        onClick: () => {
          void runFirstAction(
            "confirm",
            t("slide00.firstActions.action.confirm.confirm"),
            canConfirm && showConfirmButton,
            () => {
              confirmArm();
            }
          );
        },
        testId: "first-action-confirm",
      },
      {
        id: "override",
        title: t("slide00.firstActions.action.override.title"),
        description: t("slide00.firstActions.action.override.description"),
        badge: t("slide00.firstActions.badge.ready"),
        badgeTone: boot.state.boot.overrideEnabled ? "warn" : "neutral",
        enabled: true,
        feedback: actionFeedback.override,
        onClick: () => {
          void runFirstAction("override", t("slide00.firstActions.action.override.confirm"), true, () => {
            toggleOverride();
          });
        },
        testId: "first-action-override",
      },
      {
        id: "diagnostics",
        title: t("slide00.firstActions.action.diagnostics.title"),
        description: t("slide00.firstActions.action.diagnostics.description"),
        badge: diagnosticsSurfaceVisible ? t("slide00.firstActions.badge.ready") : t("slide00.firstActions.badge.blocked"),
        badgeTone: diagnosticsSurfaceVisible ? "good" : "danger",
        enabled: diagnosticsSurfaceVisible,
        feedback: actionFeedback.diagnostics,
        onClick: () => {
          void runFirstAction(
            "diagnostics",
            t("slide00.firstActions.action.diagnostics.confirm"),
            diagnosticsSurfaceVisible,
            () => {
              setDiagnosticsOpen(true);
            }
          );
        },
        testId: "first-action-diagnostics",
      },
      {
        id: "hud",
        title: t("slide00.firstActions.action.hud.title"),
        description: t("slide00.firstActions.action.hud.description"),
        badge: viewVisibility.showTopHudRow
          ? t("slide00.firstActions.badge.executed")
          : t("slide00.firstActions.badge.ready"),
        badgeTone: viewVisibility.showTopHudRow ? "good" : "neutral",
        enabled: true,
        feedback: actionFeedback.hud,
        onClick: () => {
          void runFirstAction("hud", t("slide00.firstActions.action.hud.confirm"), true, () => {
            viewVisibility.setShowTopHudRow(!viewVisibility.showTopHudRow);
          });
        },
        testId: "first-action-hud",
      },
      {
        id: "reset",
        title: t("slide00.firstActions.action.reset.title"),
        description: t("slide00.firstActions.action.reset.description"),
        badge: t("slide00.firstActions.badge.ready"),
        badgeTone: "warn",
        enabled: true,
        feedback: actionFeedback.reset,
        onClick: () => {
          void runFirstAction("reset", t("slide00.firstActions.action.reset.confirm"), true, () => {
            softReset();
          });
        },
        testId: "first-action-reset",
      },
      {
        id: "snapshot-copy",
        title: t("slide00.firstActions.action.snapshotCopy.title"),
        description: t("slide00.firstActions.action.snapshotCopy.description"),
        badge: t("slide00.firstActions.badge.ready"),
        badgeTone: "neutral",
        enabled: true,
        feedback: actionFeedback["snapshot-copy"],
        onClick: () => {
          void runFirstAction(
            "snapshot-copy",
            t("slide00.firstActions.action.snapshotCopy.confirm"),
            true,
            () => copySnapshot()
          );
        },
        testId: "first-action-snapshot-copy",
      },
      {
        id: "snapshot-download",
        title: t("slide00.firstActions.action.snapshotDownload.title"),
        description: t("slide00.firstActions.action.snapshotDownload.description"),
        badge: t("slide00.firstActions.badge.ready"),
        badgeTone: "neutral",
        enabled: true,
        feedback: actionFeedback["snapshot-download"],
        onClick: () => {
          void runFirstAction(
            "snapshot-download",
            t("slide00.firstActions.action.snapshotDownload.confirm"),
            true,
            () => downloadSnapshot()
          );
        },
        testId: "first-action-snapshot-download",
      },
    ],
    [
      actionFeedback,
      armNow,
      boot.canArm,
      boot.state.boot.overrideEnabled,
      canConfirm,
      confirmArm,
      copySnapshot,
      diagnosticsSurfaceVisible,
      downloadSnapshot,
      runFirstAction,
      showConfirmButton,
      softReset,
      t,
      toggleOverride,
      viewVisibility,
    ]
  );

  return (
    <SlideContainer>
      <TokenBridge
        preset={densityPreset.preset}
        width={viewportMetrics.viewportWidth}
        height={viewportMetrics.viewportHeight}
        scaleX={viewportMetrics.scaleX}
        scaleY={viewportMetrics.scaleY}
        compactViewport={viewportMetrics.compactViewport}
        className="slide00-token-bridge"
      >
        <PowerConsoleFrame preset={densityPreset.preset} metrics={viewportMetrics}>
          <Slide00Shell
            nav={<NavArea prev={prevSlide} next={nextSlide} />}
            toast={
              <BootToast
                open={showToast}
                detail={toastDetail}
                onDismiss={() => setShowToast(false)}
                title={t("slide00.toast.title")}
                dismissLabel={t("slide00.toast.dismiss")}
              />
            }
            diagnostics={
              diagnosticsSurfaceVisible ? (
                <>
                  <DiagnosticsDockToggle
                    open={diagnosticsOpen}
                    onClick={() => setDiagnosticsOpen((prev) => !prev)}
                    openLabel={t("slide00.diagnostics.toggle.open")}
                    closedLabel={t("slide00.diagnostics.toggle.closed")}
                  />
                  <DiagnosticsDock
                    open={diagnosticsOpen}
                    compact={diagnosticsCompact}
                    onBack={() => setDiagnosticsOpen(false)}
                    onToggleMode={() => setDiagnosticsCompact((prev) => !prev)}
                    metaItems={diagnosticsMeta}
                    controlRows={diagnosticsControls}
                    satisfiedRows={boot.diagnostics.satisfiedEvidence}
                    missingRows={boot.diagnostics.missingBlockers}
                    logRows={diagnosticsLogRows}
                    footerCopy={t("slide00.diagnostics.footer.copy")}
                    footerTime={t("slide00.diagnostics.footer.time", { time: new Date().toLocaleString() })}
                    title={t("slide00.diagnostics.title")}
                    modeCompactLabel={t("slide00.diagnostics.mode.compact")}
                    modeDockedLabel={t("slide00.diagnostics.mode.docked")}
                    backLabel={t("slide00.diagnostics.back")}
                    satisfiedTitle={t("slide00.diagnostics.section.satisfied")}
                    missingTitle={t("slide00.diagnostics.section.missing")}
                    logTitle={t("slide00.diagnostics.section.log")}
                    noneLabel={t("slide00.diagnostics.none")}
                    logEmptyLabel={t("slide00.diagnostics.log.empty")}
                  />
                </>
              ) : null
            }
          >
            <BootTopline
              brandTitle={t("slide00.topline.brandTitle")}
              brandSubtitle={t("slide00.topline.brandSubtitle")}
              slideLabel={t("slide00.topline.slideLabel")}
            />

            <Header
              title={t("slide00.header.title")}
              breadcrumb={t("slide00.header.breadcrumb")}
              slideNum={1}
              rightBadge={t("slide00.header.rightBadge", { status })}
            />

            <PowerConsoleGrid
              main={
                <>
                  <PowerConsoleSection className="slide00-power-console-section--firstproof">
                    <FirstProofRitual
                      recordAnchorInteraction={boot.recordAnchorInteraction}
                      appendOperatorLog={boot.appendOperatorLog}
                      profile={firstProofProfile}
                      showInlineRightSeal={false}
                      onSnapshotChange={onFirstProofSnapshotChange}
                    />
                  </PowerConsoleSection>

                  <BootPanel
                    header={
                      <BootPanelHeader
                        title={t("slide00.panel.title")}
                        subtitle={
                          <>
                            {t("slide00.panel.subtitle.start")} <strong>{t("slide00.panel.subtitle.armed")}</strong>{" "}
                            {t("slide00.panel.subtitle.end")}
                          </>
                        }
                        whyLabel={t("slide00.panel.why")}
                      />
                    }
                    body={
                      <BootPanelBody
                        status={boot.state.boot.status}
                        armLabel={t("slide00.panel.armButton")}
                        canArm={boot.canArm}
                        canConfirm={canConfirm}
                        showConfirm={showConfirmButton}
                        confirmLabel={confirmLabel}
                        onArm={armNow}
                        onConfirm={confirmArm}
                        confirmState={confirmSlot.state}
                        confirmText={confirmSlot.text}
                        confirmStrongText={confirmSlot.strongText}
                        cards={kpiCards}
                        stateChips={stateChips}
                      />
                    }
                    footer={
                      <BootPanelFooter>
                        <p className="slide00-arm-emphasis-copy">{t("slide00.panel.emphasis")}</p>
                      </BootPanelFooter>
                    }
                  />
                </>
              }
              side={
                <PowerConsoleSection className="slide00-power-console-section--side">
                  <SideDockScrollRegion maxHeight={viewportMetrics.sideScrollHeight}>
                    <BootSideColumn>
                      <RightSeal snapshot={firstProofSnapshot} profile={firstProofProfile} />

                      <ViewControlsTogglePanel
                        showTopHudRow={viewVisibility.showTopHudRow}
                        showTopRibbon={viewVisibility.showTopRibbon}
                        showDiagnostics={viewVisibility.showDiagnostics}
                        onTopHudRowChange={viewVisibility.setShowTopHudRow}
                        onTopRibbonChange={viewVisibility.setShowTopRibbon}
                        onDiagnosticsChange={viewVisibility.setShowDiagnostics}
                        title={t("slide00.viewControls.title")}
                        copy={t("slide00.viewControls.copy")}
                        topHudLabel={t("slide00.viewControls.topHud")}
                        topRibbonLabel={t("slide00.viewControls.topRibbon")}
                        diagnosticsLabel={t("slide00.viewControls.diagnostics")}
                      />

                      {/* TODO(slide00-first-proof): Legacy side modules intentionally kept but hidden in this ritual lock iteration. */}
                      <div hidden aria-hidden="true">
                        <BootStatusBadge
                          isArmed={boot.isArmed}
                          isOperatorAssisted={boot.isOperatorAssisted}
                          narrative={statusNarrativeLabel}
                          lastEventLabel={lastEventLabel}
                          label={t("slide00.badge.systemStatus.label")}
                          armedLabel={t("slide00.badge.systemStatus.armed")}
                          assistedLabel={t("slide00.badge.systemStatus.assisted")}
                          lockedLabel={t("slide00.badge.systemStatus.locked")}
                          lastEventPrefix={t("slide00.badge.systemStatus.lastEvent")}
                        />

                        <OpeningFlagsBadge
                          summary={cinematicFlagSummary || t("slide00.diagnostics.none")}
                          autostartReason={humanReason(boot.gates.tourAutostart.reason)}
                          warning={boot.gates.tourAutostart.reason === "autostart-disabled-by-boot-contract"}
                          label={t("slide00.badge.flags.label")}
                          autostartLabel={t("slide00.badge.flags.autostart")}
                        />

                        <PersistenceIndicator
                          persisted={persistence.hasSnapshot}
                          keyCount={persistence.keys.length}
                          keys={persistence.keys}
                          title={t("slide00.persistence.title")}
                          detectedLabel={t("slide00.persistence.detected")}
                          emptyLabel={t("slide00.persistence.none")}
                          keyCountLabel={t("slide00.persistence.keys", { count: persistence.keys.length })}
                        />

                        <ResetControls
                          onSoftReset={softReset}
                          onHardReset={hardReset}
                          title={t("slide00.reset.title")}
                          copy={t("slide00.reset.copy")}
                          softLabel={t("slide00.reset.soft")}
                          hardLabel={t("slide00.reset.hard")}
                        />

                        <GateMatrix
                          rows={gateRows}
                          humanReason={humanReason}
                          title={t("slide00.gate.title")}
                          availableLabel={t("slide00.gate.available")}
                          lockedLabel={t("slide00.gate.locked")}
                          disabledLabel={t("slide00.gate.disabled")}
                        />
                      </div>
                    </BootSideColumn>
                  </SideDockScrollRegion>
                </PowerConsoleSection>
              }
              afterMain={
                <>
                  <PowerConsoleSection className="slide00-power-console-section--status">
                    <StatusStrip
                      title={t("slide00.statusStrip.title")}
                      subtitle={t("slide00.statusStrip.subtitle")}
                      items={statusItems}
                    />
                  </PowerConsoleSection>
                  <PowerConsoleSection className="slide00-power-console-section--actions">
                    <FirstActionsRail
                      title={t("slide00.firstActions.title")}
                      subtitle={t("slide00.firstActions.subtitle")}
                      actions={firstActions}
                    />
                  </PowerConsoleSection>
                </>
              }
            />

            <EvidenceList
              title={t("slide00.evidence.title")}
              rows={blockerRows}
              formatTimestamp={formatTimestamp}
              metaLabel={t("slide00.evidence.meta")}
              confirmedLabel={(time) => t("slide00.evidence.confirmed", { time })}
              awaitingLabel={t("slide00.evidence.awaiting")}
              satisfiedLabel={t("slide00.evidence.state.satisfied")}
              missingLabel={t("slide00.evidence.state.missing")}
              idleLabel={t("slide00.evidence.state.idle")}
            />

            <BootFoot
              left={t("slide00.foot.left", { time: formatDateTime(Date.now()) })}
              right={t("slide00.foot.right", {
                anchor: boot.diagnostics.lastInteractedAnchor ?? t("slide00.diagnostics.meta.none"),
              })}
            />

            <BootNote warning={boot.isOperatorAssisted}>
              {t("slide00.note.override.start")} <strong>{t("slide00.note.override.armed")}</strong>
              {t("slide00.note.override.end")}
            </BootNote>

            <BootNote danger={boot.gateLocked}>{t("slide00.note.locked")}</BootNote>

            <Slide00HiddenState
              bootStatus={boot.state.boot.status}
              armedEvidence={
                boot.state.evidence.entries["evidence:system:armed"].satisfied
                  ? "satisfied"
                  : "missing"
              }
            />
          </Slide00Shell>
        </PowerConsoleFrame>

        <FitDiagnosticsOverlay
          enabled={SHOW_FIT_DIAGNOSTICS}
          preset={densityPreset.preset}
          presetReason={densityPreset.reason}
          metrics={viewportMetrics}
        />
      </TokenBridge>
    </SlideContainer>
  );
};
