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
import { useBootRuntime } from "../../runtime/boot";
import {
  BootCenterLayout,
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
  GateMatrix,
  OpeningFlagsBadge,
  PersistenceIndicator,
  ResetControls,
  Slide00HiddenState,
  Slide00Shell,
  ViewControlsTogglePanel,
  buildConfirmSlotContent,
  buildEvidenceRows,
  buildEvidenceStatusCards,
  buildGateRows,
  clearSystemStorageKeys,
  collectSystemStorageKeys,
  formatDateTime,
  formatTimestamp,
  humanReason,
  statusLabel,
  statusNarrative,
  useSlide00ViewVisibility,
} from "./slide00-ui";
import "./Slide00.boot.css";

type Slide00Props = {
  nextSlide: () => void;
  prevSlide: () => void;
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

export const Slide00: React.FC<Slide00Props> = ({ nextSlide, prevSlide }) => {
  const boot = useBootRuntime();
  const viewVisibility = useSlide00ViewVisibility();
  const [showToast, setShowToast] = useState(false);
  const [toastDetail, setToastDetail] = useState("Sistema listo");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsCompact, setDiagnosticsCompact] = useState(false);
  const [demoScriptActive, setDemoScriptActive] = useState(false);
  const [mirrorActive, setMirrorActive] = useState(false);
  const [persistence, setPersistence] = useState<PersistenceState>(() => readPersistenceState());
  const lastToastLogIdRef = useRef<string | null>(null);

  const refreshPersistence = useCallback(() => {
    setPersistence(readPersistenceState());
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
      }),
    [boot.gateLocked, boot.isArmed, boot.isOperatorAssisted, boot.diagnostics.evidenceSummary]
  );

  const confirmSlot = useMemo(
    () =>
      buildConfirmSlotContent({
        status: boot.state.boot.status,
        isArmed: boot.isArmed,
      }),
    [boot.state.boot.status, boot.isArmed]
  );

  const showConfirmButton =
    boot.state.boot.status === "ARMED_PENDING_CONFIRM" ||
    (boot.state.boot.status === "OPERATOR_ASSISTED" && !boot.isArmed);

  const confirmLabel =
    boot.state.boot.status === "OPERATOR_ASSISTED" && !boot.isArmed
      ? "confirm arming (override path)"
      : "confirm arming";

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
        label: "boot state",
        value: boot.state.boot.status,
        testId: "boot-state-value",
      },
      {
        key: "gate",
        label: "gate lock",
        value: boot.gateLocked ? "LOCKED" : "OPEN",
      },
      {
        key: "event",
        label: "last event",
        value: boot.diagnostics.lastEvent
          ? `${boot.diagnostics.lastEvent.id} · ${boot.diagnostics.lastEvent.action}`
          : "--",
      },
      {
        key: "anchor",
        label: "last anchor",
        value: boot.diagnostics.lastInteractedAnchor ?? "--",
      },
    ],
    [boot.state.boot.status, boot.gateLocked, boot.diagnostics.lastEvent, boot.diagnostics.lastInteractedAnchor]
  );

  const diagnosticsControls = useMemo(
    () => [
      {
        key: "override",
        copy: "Allow advance without arming (operator-assisted only).",
        actions: [
          {
            key: "toggle",
            label: boot.state.boot.overrideEnabled ? "override on" : "override off",
            active: boot.state.boot.overrideEnabled,
            onClick: toggleOverride,
            testId: "operator-override-toggle",
          },
        ],
      },
      {
        key: "reset",
        copy: "Soft reset local runtime to IDLE and clear active boot snapshot.",
        actions: [
          {
            key: "soft-reset",
            label: "soft reset",
            onClick: softReset,
            testId: "operator-reset-local",
          },
        ],
      },
      {
        key: "snapshot",
        copy: "Snapshot export (deterministic JSON).",
        actions: [
          {
            key: "copy",
            label: "copy",
            onClick: copySnapshot,
            testId: "operator-copy-snapshot",
          },
          {
            key: "download",
            label: "download",
            onClick: downloadSnapshot,
            testId: "operator-download-snapshot",
          },
        ],
      },
      {
        key: "demo-script",
        copy: "Manual script surface (still blocked before arming).",
        actions: [
          {
            key: "demo",
            label: demoScriptActive ? "script on" : "script off",
            active: demoScriptActive,
            onClick: toggleDemoScript,
          },
        ],
      },
      {
        key: "mirror",
        copy: "Manual mirror intro (still blocked before arming).",
        actions: [
          {
            key: "mirror",
            label: mirrorActive ? "mirror on" : "mirror off",
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
    : "--";

  const cinematicFlagSummary = [
    WOW_TOUR ? "tour" : null,
    WOW_TOUR_AUTOSTART ? "tour_autostart" : null,
    WOW_DEMO_SCRIPT ? "demo_script" : null,
    WOW_OPENING_CINEMA ? "opening_cinema" : null,
    WOW_MIRROR ? "mirror" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const status = statusLabel(boot.state.boot.status);

  const diagnosticsSurfaceVisible = viewVisibility.showDiagnostics && OPERATOR_DIAGNOSTICS;

  return (
    <div data-testid="slide-00-root" className="w-full h-full">
      <SlideContainer>
        <Slide00Shell
          nav={<NavArea prev={prevSlide} next={nextSlide} />}
          toast={<BootToast open={showToast} detail={toastDetail} onDismiss={() => setShowToast(false)} />}
          diagnostics={
            diagnosticsSurfaceVisible ? (
              <>
                <DiagnosticsDockToggle
                  open={diagnosticsOpen}
                  onClick={() => setDiagnosticsOpen((prev) => !prev)}
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
                  footerCopy="local diagnostics only · does not alter evidence semantics"
                  footerTime={new Date().toLocaleString()}
                />
              </>
            ) : null
          }
        >
          <BootTopline
            brandTitle="HITECH RTS"
            brandSubtitle="boot / deterministic gate"
            slideLabel="slide 00 · boot gate"
          />

          <Header
            title="BOOT CONSOLE"
            breadcrumb="ACTION / WHY / CONFIRM"
            slideNum={1}
            rightBadge={`STATE ${status}`}
          />

          <BootCenterLayout
            main={
              <BootPanel
                header={
                  <BootPanelHeader
                    title="Operator arming required"
                    subtitle={
                      <>
                        This deck starts in manual mode. Scripted systems remain blocked until
                        <strong> evidence:system:armed </strong>
                        is satisfied by explicit operator action.
                      </>
                    }
                    whyLabel="why: register verifiable activity"
                  />
                }
                body={
                  <BootPanelBody
                    status={boot.state.boot.status}
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
                  />
                }
                footer={
                  <BootPanelFooter>
                    <p className="slide00-arm-emphasis-copy">
                      arm lane reserved for glow, glass and directional emphasis modules.
                    </p>
                  </BootPanelFooter>
                }
              />
            }
            side={
              <BootSideColumn>
                <BootStatusBadge
                  isArmed={boot.isArmed}
                  isOperatorAssisted={boot.isOperatorAssisted}
                  narrative={statusNarrative(boot.state.boot.status)}
                  lastEventLabel={lastEventLabel}
                />

                <OpeningFlagsBadge
                  summary={cinematicFlagSummary || "none"}
                  autostartReason={humanReason(boot.gates.tourAutostart.reason)}
                  warning={boot.gates.tourAutostart.reason === "autostart-disabled-by-boot-contract"}
                />

                <ViewControlsTogglePanel
                  showTopHudRow={viewVisibility.showTopHudRow}
                  showTopRibbon={viewVisibility.showTopRibbon}
                  showDiagnostics={viewVisibility.showDiagnostics}
                  onTopHudRowChange={viewVisibility.setShowTopHudRow}
                  onTopRibbonChange={viewVisibility.setShowTopRibbon}
                  onDiagnosticsChange={viewVisibility.setShowDiagnostics}
                />

                <PersistenceIndicator
                  persisted={persistence.hasSnapshot}
                  keyCount={persistence.keys.length}
                  keys={persistence.keys}
                />

                <ResetControls onSoftReset={softReset} onHardReset={hardReset} />

                <GateMatrix rows={gateRows} humanReason={humanReason} />
              </BootSideColumn>
            }
          />

          <EvidenceList title="evidence blockers" rows={blockerRows} formatTimestamp={formatTimestamp} />

          <BootFoot
            left={`local time: ${formatDateTime(Date.now())}`}
            right={`last anchor: ${boot.diagnostics.lastInteractedAnchor ?? "--"}`}
          />

          <BootNote warning={boot.isOperatorAssisted}>
            override path can unlock progression for operator testing, but it never satisfies
            <strong> evidence:system:armed</strong>.
          </BootNote>

          <BootNote danger={boot.gateLocked}>
            when locked, WOW tour/demo-script/opening-cinema stay disabled regardless of flags.
          </BootNote>

          <Slide00HiddenState
            bootStatus={boot.state.boot.status}
            armedEvidence={
              boot.state.evidence.entries["evidence:system:armed"].satisfied
                ? "satisfied"
                : "missing"
            }
          />
        </Slide00Shell>
      </SlideContainer>
    </div>
  );
};
