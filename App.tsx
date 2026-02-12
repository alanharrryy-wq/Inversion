import React, { useCallback, useEffect, useMemo, useState } from "react";
import Background from "./components/Background";
import Scaler from "./components/Scaler";
import SlideRenderer from "./components/SlideRenderer";
import Modal from "./components/Modal";
import AIChat from "./components/AIChat";
import { DeckModeProvider, useDeckMode } from "./components/DeckRuntimeMode";
import { SLIDE_LABELS } from "./components/SlideRenderer";
import {
  OPERATOR_VIEW_DEFAULT_ON,
  WOW_DEMO,
  WOW_DEMO_SCRIPT,
  WOW_DIAGNOSTICS,
  WOW_FLAGS,
  WOW_GUIDE_ENGINE,
  WOW_MIRROR,
  WOW_OVERLAY,
  WOW_TOUR,
  WOW_TOUR_SCRIPT,
} from "./config/wow";
import { emitGuideEvidence, TourOverlay, useTourEngine } from "./wow/tour";
import { hasTourTarget } from "./wow/tour/events";
import { TourAutostartStatus } from "./wow/tour/types";
import {
  Slide00ViewVisibilityProvider,
  TopHudRow,
  TopRibbon,
  useSlide00ViewVisibility,
} from "./components/slides/slide00-ui";
import {
  BootRuntimeProvider,
  canShowDemoScript,
  canShowMirrorIntro,
  canStartTourManually,
  createWowFlagSnapshot,
  isTourAutostartBlocked,
  useBootRuntime,
  useSlideEntryEvidence,
} from "./runtime/boot";

/* ==========================================
   B9 - ControlBar HUD Pro (v1.4.0)
   ========================================== */

const ControlBar = () => {
  const { mode, setStealth, setTrack, toggleInvestorLock, toggleAutoplay } = useDeckMode();

  const btn = (active: boolean, onClick: () => void, label: string, glow: string, testId: string) => (
    <button
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 10,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        border: "1px solid rgba(255,255,255,.12)",
        background:
          active
            ? "rgba(255,255,255,.14)"
            : "rgba(255,255,255,.04)",
        boxShadow:
          active ? `0 0 18px ${glow}` : "none",
        color: "white",
        transition: "all .25s ease",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      data-testid="controlbar"
      style={{
        position: "absolute",
        top: 14,
        left: 18,
        right: 18,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(0,0,0,.6), rgba(0,0,0,.4))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 12px 30px rgba(0,0,0,.55)",
        zIndex: 9999,
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        {btn(mode.stealth, () => setStealth(), "Stealth", "rgba(120,120,120,.6)", "mode-stealth")}
        {btn(mode.track, () => setTrack(), "Track", "rgba(0,180,200,.9)", "mode-track")}
        {btn(mode.investorLock, () => toggleInvestorLock(), "Lock", "rgba(0,180,200,.6)", "mode-lock")}
        {btn(mode.autoplay && mode.investorLock, () => toggleAutoplay(), "Autoplay", "rgba(180,140,40,.9)", "mode-autoplay")}
      </div>

      <div
        data-testid="mode-hint"
        style={{
          fontSize: 10,
          opacity: 0.55,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        F1 STEALTH · F2 TRACK · F3 LOCK · F4 AUTOPLAY
      </div>
      <div data-testid="mode-state" style={{ display: "none" }}>
        {mode.stealth ? "stealth:on" : "stealth:off"}|{mode.track ? "track:on" : "track:off"}|{mode.investorLock ? "lock:on" : "lock:off"}|{mode.autoplay ? "autoplay:on" : "autoplay:off"}
      </div>
    </div>
  );
};

const TOTAL_SLIDES = 20;
const DECK_NAV_START = 0;
const DECK_NAV_END = 4;
const DECK_NAV_INDICES = [0, 1, 2, 3, 4] as const;

const normalizeSlideIndex = (idx: number) => {
  const n = TOTAL_SLIDES;
  if (!Number.isFinite(idx)) return 0;
  return ((Math.trunc(idx) % n) + n) % n;
};

const clampDeckNavIndex = (idx: number) => {
  const normalized = normalizeSlideIndex(idx);
  if (normalized < DECK_NAV_START) return DECK_NAV_START;
  if (normalized > DECK_NAV_END) return DECK_NAV_END;
  return normalized;
};

const formatSlideId = (idx: number) => String(normalizeSlideIndex(idx)).padStart(2, "0");

const parseSlideIndexFromLocation = (locationLike: Pick<Location, "pathname" | "hash" | "search">): number => {
  const pathMatch = locationLike.pathname.match(/^\/slides\/(\d{1,2})\/?$/i);
  if (pathMatch) {
    return normalizeSlideIndex(Number(pathMatch[1]));
  }

  const hashRaw = locationLike.hash.startsWith("#")
    ? locationLike.hash.slice(1)
    : locationLike.hash;
  const hashMatch = hashRaw.match(/^(?:slides\/|slide\/|slide-)?(\d{1,2})$/i);
  if (hashMatch) {
    return normalizeSlideIndex(Number(hashMatch[1]));
  }

  const query = new URLSearchParams(locationLike.search);
  const querySlide = query.get("slide");
  if (querySlide != null && querySlide.trim() !== "") {
    const parsed = Number(querySlide);
    if (Number.isFinite(parsed)) {
      return normalizeSlideIndex(parsed);
    }
  }

  return 0;
};

const slidePathFromIndex = (idx: number) => `/slides/${formatSlideId(idx)}`;

const ModePill: React.FC = () => {
  const { mode } = useDeckMode();

  if (mode.stealth) return null;

  return (
    <ControlBar />
  );
};

const MirrorIntro: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[120] flex items-center justify-center bg-black">
      <div className="w-full max-w-[960px] px-10">
        <p className="wow-mirror-line">Every investor says they back AI.</p>
        <p className="wow-mirror-line wow-mirror-line--2">Very few actually understand it.</p>
        <p className="wow-mirror-line wow-mirror-line--3">Let&apos;s fix that.</p>
      </div>
    </div>
  );
};

const OperatorOverlay: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const { mode } = useDeckMode();
  const boot = useBootRuntime();
  const [aiMode, setAiMode] = React.useState("chat");

  React.useEffect(() => {
    const onModeChange = (event: Event) => {
      const custom = event as CustomEvent<{ mode?: string }>;
      const nextMode = custom.detail?.mode;
      if (typeof nextMode === "string" && nextMode) {
        setAiMode(nextMode);
      }
    };

    window.addEventListener("wow:ai-mode", onModeChange as EventListener);
    return () => window.removeEventListener("wow:ai-mode", onModeChange as EventListener);
  }, []);

  if (!WOW_OVERLAY) return null;

  const slideName = SLIDE_LABELS[currentSlide] ?? `Slide${String(currentSlide).padStart(2, "0")}`;
  const onFlags = Object.entries(WOW_FLAGS)
    .filter(([, isOn]) => isOn)
    .map(([name]) => name.replace("WOW_", "").toLowerCase())
    .join(" · ");

  return (
    <aside className="pointer-events-none absolute right-5 top-5 z-[130] min-w-[240px] rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-[10px] font-code tracking-[0.2em] text-white/70 backdrop-blur-sm" data-testid="top-ribbon-operator-overlay">
      <div>SLIDE {String(currentSlide + 1).padStart(2, "0")} · {slideName}</div>
      <div className="mt-1">AI MODE · {aiMode.toUpperCase()}</div>
      <div className="mt-1">FLAGS · {onFlags || "none"}</div>
      <div className="mt-1">RUNTIME · {mode.track ? "TRACK" : "STD"}/{mode.stealth ? "STEALTH" : "OPEN"}</div>
      <div className="mt-1">BOOT · {boot.state.boot.status}</div>
      <div className="mt-1">GATE · {boot.gateLocked ? "LOCKED" : "OPEN"}</div>
      <div className="mt-1">ARMED · {String(boot.isArmed)}</div>
      <div className="mt-1">ASSISTED · {String(boot.isOperatorAssisted)}</div>
    </aside>
  );
};

const DemoScriptOverlay: React.FC<{ currentSlide: number; enabled: boolean }> = ({ currentSlide, enabled }) => {
  if (!enabled) return null;

  const slide = currentSlide + 1;
  const moment =
    slide <= 1
      ? "Set context: evidence-first operations."
      : slide <= 5
      ? "Open AIChat after proof lock pulse for conviction."
      : slide <= 12
      ? "Use AIChat to convert telemetry into board language."
      : "Close with outcome + next 30/60 day metric.";

  return (
    <aside className="wow-demo-script-overlay" data-testid="demo-script-overlay">
      <h4>DEMO SCRIPT</h4>
      <p>Slide {String(slide).padStart(2, "0")} moment: {moment}</p>
      <p className="wow-killer-q">Q1: What evidence appears first under audit pressure?</p>
      <p className="wow-killer-q">Q2: What 60-day KPI proves risk reduction is real?</p>
    </aside>
  );
};

const DeckSlideNav: React.FC<{
  currentSlide: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
}> = ({ currentSlide, canPrev, canNext, onPrev, onNext, onJump }) => {
  const currentSlideId = formatSlideId(currentSlide);

  return (
    <aside className="pointer-events-auto fixed bottom-4 right-4 z-[2147483004] rounded-xl border border-white/25 bg-black/70 px-3 py-3 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          data-testid="nav-prev"
          onClick={onPrev}
          disabled={!canPrev}
          className="rounded border border-white/25 px-3 py-1 text-xs font-code tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          PREV
        </button>
        <button
          type="button"
          data-testid="nav-next"
          onClick={onNext}
          disabled={!canNext}
          className="rounded border border-white/25 px-3 py-1 text-xs font-code tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          NEXT
        </button>
      </div>
      <div className="mb-2 flex items-center gap-1">
        {DECK_NAV_INDICES.map((index) => {
          const id = formatSlideId(index);
          return (
            <button
              key={id}
              type="button"
              data-testid={`nav-jump-${id}`}
              onClick={() => onJump(index)}
              className="rounded border border-white/20 px-2 py-1 text-[10px] font-code tracking-[0.2em] text-white/90"
            >
              {id}
            </button>
          );
        })}
      </div>
      <div data-testid="nav-current-index" className="text-[10px] font-code tracking-[0.18em] text-white/70">
        {formatSlideId(currentSlide)}
      </div>
      <div data-testid="nav-current-id" className="text-[10px] font-code tracking-[0.18em] text-white/55">
        slide-{currentSlideId}
      </div>
    </aside>
  );
};

const AppInner: React.FC<{
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  modalOpen: boolean;
  openModal: (images: string[], title: string) => void;
  closeModal: () => void;
  modalImages: string[];
  modalTitle: string;
}> = ({
  currentSlide,
  setCurrentSlide,
  modalOpen,
  openModal,
  closeModal,
  modalImages,
  modalTitle,
}) => {
  const { mode } = useDeckMode();
  const boot = useBootRuntime();
  const viewVisibility = useSlide00ViewVisibility();
  const normalizedSlide = normalizeSlideIndex(currentSlide);
  useSlideEntryEvidence(normalizedSlide);

  const tourEnabled = canStartTourManually(boot.gates);
  const demoScriptAvailable = canShowDemoScript(boot.gates);
  const mirrorAvailable = canShowMirrorIntro(boot.gates);
  const [demoScriptActive, setDemoScriptActive] = useState(false);
  const [mirrorActive, setMirrorActive] = useState(false);

  const [autostartStatus, setAutostartStatus] = useState<TourAutostartStatus>({
    attempts: 0,
    started: false,
    reason: "not-requested",
  });

  const {
    state: tourState,
    activeStep: tourStep,
    stepComplete,
    api: tourApi,
    guideOverlayModel,
  } = useTourEngine({
    enabled: tourEnabled,
    currentSlide: normalizedSlide,
    scriptId: WOW_TOUR_SCRIPT || "enterprise",
  });
  const tourStepTargetExists = useMemo(() => hasTourTarget(tourStep?.targetSelector), [tourStep?.targetSelector, tourState.stepIndex, normalizedSlide]);

  const cancelMirror = useCallback(() => {
    setMirrorActive(false);
  }, []);

  const nextSlide = useCallback(() => {
    cancelMirror();
    setCurrentSlide((prev) => normalizeSlideIndex(prev + 1));
  }, [cancelMirror, setCurrentSlide]);
  const prevSlide = useCallback(() => {
    cancelMirror();
    setCurrentSlide((prev) => normalizeSlideIndex(prev - 1));
  }, [cancelMirror, setCurrentSlide]);
  const goToSlide = useCallback((index: number) => {
    cancelMirror();
    setCurrentSlide(normalizeSlideIndex(index));
  }, [cancelMirror, setCurrentSlide]);
  const deckNavIndex = clampDeckNavIndex(normalizedSlide);
  const deckCanPrev = deckNavIndex > DECK_NAV_START;
  const deckCanNext = deckNavIndex < DECK_NAV_END;
  const goToDeckSlide = useCallback((index: number) => {
    cancelMirror();
    setCurrentSlide(clampDeckNavIndex(index));
  }, [cancelMirror, setCurrentSlide]);
  const deckPrev = useCallback(() => {
    if (!deckCanPrev) return;
    goToDeckSlide(deckNavIndex - 1);
  }, [deckCanPrev, deckNavIndex, goToDeckSlide]);
  const deckNext = useCallback(() => {
    if (!deckCanNext) return;
    goToDeckSlide(deckNavIndex + 1);
  }, [deckCanNext, deckNavIndex, goToDeckSlide]);

  useEffect(() => {
    if (!WOW_DEMO || !WOW_MIRROR || !mirrorAvailable) {
      setMirrorActive(false);
      return;
    }

    if (normalizedSlide !== 0) {
      setMirrorActive(false);
      return;
    }

    if (!mirrorActive) return;
    setMirrorActive(true);
  }, [normalizedSlide, mirrorAvailable, mirrorActive]);

  useEffect(() => {
    if (!demoScriptAvailable && demoScriptActive) {
      setDemoScriptActive(false);
    }
  }, [demoScriptAvailable, demoScriptActive]);

  useEffect(() => {
    if (!mirrorAvailable && mirrorActive) {
      setMirrorActive(false);
    }
  }, [mirrorAvailable, mirrorActive]);

  useEffect(() => {
    const onDemoScriptToggle = (event: Event) => {
      const custom = event as CustomEvent<{ enabled?: boolean }>;
      if (!demoScriptAvailable) {
        setDemoScriptActive(false);
        return;
      }
      if (typeof custom.detail?.enabled === "boolean") {
        setDemoScriptActive(custom.detail.enabled);
        return;
      }
      setDemoScriptActive((prev) => !prev);
    };

    const onMirrorToggle = (event: Event) => {
      const custom = event as CustomEvent<{ enabled?: boolean }>;
      if (!mirrorAvailable) {
        setMirrorActive(false);
        return;
      }
      if (typeof custom.detail?.enabled === "boolean") {
        setMirrorActive(custom.detail.enabled);
        return;
      }
      setMirrorActive((prev) => !prev);
    };

    window.addEventListener("wow:demo-script-toggle", onDemoScriptToggle as EventListener);
    window.addEventListener("wow:mirror-toggle", onMirrorToggle as EventListener);
    return () => {
      window.removeEventListener("wow:demo-script-toggle", onDemoScriptToggle as EventListener);
      window.removeEventListener("wow:mirror-toggle", onMirrorToggle as EventListener);
    };
  }, [demoScriptAvailable, mirrorAvailable]);

  useEffect(() => {
    if (!WOW_DEMO) return;

    window.dispatchEvent(
      new CustomEvent("wow:tour-event", {
        detail: { name: "slide:changed", payload: { to: normalizedSlide }, ts: Date.now() },
      })
    );

    if (WOW_GUIDE_ENGINE) {
      emitGuideEvidence("slide:changed", { to: normalizedSlide });
      emitGuideEvidence("slide:entered", { slide: normalizedSlide });
    }
  }, [normalizedSlide]);

  useEffect(() => {
    if (!tourEnabled) return;
    window.dispatchEvent(
      new CustomEvent("wow:tour-step", {
        detail: {
          stepId: tourStep?.id ?? "",
          pasteQuestion: tourStep?.pasteQuestion ?? "",
          readAloudText: tourStep?.readAloudText ?? "",
          running: tourState.status === "running",
        },
      })
    );
  }, [tourEnabled, tourStep, tourState.status]);

  useEffect(() => {
    if (!tourEnabled || tourState.status !== "running") return;
    if (!tourStep?.id) return;
    if (tourStep.id === "open-aichat" || tourStep.id === "fixture-load" || tourStep.id === "ask-killer-question") {
      window.dispatchEvent(new CustomEvent("wow:tour-command", { detail: { cmd: "open-chat" } }));
    }
  }, [tourEnabled, tourState.status, tourStep?.id]);

  useEffect(() => {
    if (!WOW_DEMO || !WOW_TOUR) {
      setAutostartStatus({ attempts: 0, started: false, reason: "tour-disabled" });
      return;
    }

    if (!tourEnabled) {
      setAutostartStatus({ attempts: 0, started: false, reason: boot.gates.tour.reason });
      return;
    }

    if (isTourAutostartBlocked(boot.gates)) {
      setAutostartStatus({
        attempts: 0,
        started: false,
        reason: boot.gates.tourAutostart.reason,
      });
      return;
    }

    setAutostartStatus({ attempts: 0, started: false, reason: "manual-start-only" });
  }, [tourEnabled, boot.gates]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1" || e.key === "F2" || e.key === "F3" || e.key === "F4") return;
      if (modalOpen) return;
      if (mode.investorLock) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [modalOpen, mode.investorLock, nextSlide, prevSlide]);

  useEffect(() => {
    if (!mode.investorLock) return;
    if (!mode.autoplay) return;

    const t = window.setInterval(() => {
      setCurrentSlide((prev) => normalizeSlideIndex(prev + 1));
    }, Math.max(1500, mode.autoplayMs));

    return () => window.clearInterval(t);
  }, [mode.investorLock, mode.autoplay, mode.autoplayMs, setCurrentSlide]);

  return (
    <div data-testid="deck-root" className="deck-stage-root relative w-screen h-screen overflow-hidden bg-black text-white font-main">
      <Background />
      <MirrorIntro active={mirrorActive} />
      <TopRibbon visible={viewVisibility.showTopRibbon}>
        <OperatorOverlay currentSlide={normalizedSlide} />
      </TopRibbon>
      <DemoScriptOverlay
        currentSlide={normalizedSlide}
        enabled={WOW_DEMO && WOW_DEMO_SCRIPT && demoScriptAvailable && demoScriptActive}
      />
      {tourEnabled && (
        <TourOverlay
          active={tourState.status === "running" || tourState.status === "completed"}
          scriptTitle={tourState.scriptTitle || "Enterprise Investor Demo"}
          stepIndex={tourState.stepIndex}
          totalSteps={tourState.steps.length || 1}
          step={tourStep}
          status={tourState.status}
          canNext={stepComplete || !!tourStep?.allowNextBeforeComplete}
          targetExists={tourStepTargetExists}
          autostartStatus={autostartStatus}
          stepComplete={stepComplete}
          completedStepIds={tourState.completedStepIds}
          guideOverlayModel={guideOverlayModel}
          onBack={tourApi.back}
          onNext={tourApi.next}
          onSkip={tourApi.skip}
          onRestart={() => {
            tourApi.stop();
            tourApi.start(WOW_TOUR_SCRIPT || "enterprise");
          }}
          onStart={() => tourApi.start(WOW_TOUR_SCRIPT || "enterprise")}
          onPasteQuestion={(text) => window.dispatchEvent(new CustomEvent("wow:tour-paste", { detail: { text } }))}
        />
      )}
      {viewVisibility.showDiagnostics && WOW_DIAGNOSTICS && !tourEnabled && WOW_DEMO && (
        <div className="fixed bottom-4 left-4 z-[2147483002] rounded border border-white/25 bg-black/80 px-3 py-2 text-[11px] text-white/80" data-testid="wow-diagnostics">
          WOW diagnostics: gate locked ({boot.gates.tour.reason}).
        </div>
      )}
      <div data-testid="global-mode-state" style={{ display: "none" }}>
        {mode.stealth ? "stealth:on" : "stealth:off"}|{mode.track ? "track:on" : "track:off"}|{mode.investorLock ? "lock:on" : "lock:off"}|{mode.autoplay ? "autoplay:on" : "autoplay:off"}
      </div>
      <div data-testid="boot-gate-state" style={{ display: "none" }}>
        status:{boot.state.boot.status}|gateLocked:{String(boot.gateLocked)}|armed:{String(boot.isArmed)}|operatorAssisted:{String(boot.isOperatorAssisted)}|tourReady:{String(canStartTourManually(boot.gates))}|tourAutostart:{boot.gates.tourAutostart.reason}
      </div>
      <div data-testid="boot-evidence-system-armed" style={{ display: "none" }}>
        {boot.state.evidence.entries["evidence:system:armed"].satisfied ? "satisfied" : "missing"}
      </div>
      <div data-testid="boot-feature-state" style={{ display: "none" }}>
        demoScriptAvailable:{String(demoScriptAvailable)}|demoScriptActive:{String(demoScriptActive)}|mirrorAvailable:{String(mirrorAvailable)}|mirrorActive:{String(mirrorActive)}
      </div>
      <DeckSlideNav
        currentSlide={deckNavIndex}
        canPrev={deckCanPrev}
        canNext={deckCanNext}
        onPrev={deckPrev}
        onNext={deckNext}
        onJump={goToDeckSlide}
      />

      <TopHudRow visible={viewVisibility.showTopHudRow}>
        <ModePill />
      </TopHudRow>

      <Scaler slideIndex={normalizedSlide}>
        <div className="deck-stage-frame w-full h-full relative [perspective:1400px]">
          <SlideRenderer
            index={normalizedSlide}
            totalSlides={TOTAL_SLIDES}
            nextSlide={nextSlide}
            prevSlide={prevSlide}
            goToSlide={goToSlide}
            openModal={openModal}
            wowDemo={WOW_DEMO}
          />
        </div>
      </Scaler>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          images={modalImages}
          title={modalTitle}
        />
      )}

      {!mode.stealth && <AIChat />}
    </div>
  );
};

const WOW_FLAG_SNAPSHOT = createWowFlagSnapshot();

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    return parseSlideIndexFromLocation(window.location);
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const openModal = (images: string[], title: string) => {
    setModalImages(images);
    setModalTitle(title);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const whitelist = useMemo(() => [4, 13], []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      setCurrentSlide(parseSlideIndexFromLocation(window.location));
    };

    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextPath = slidePathFromIndex(currentSlide);
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(window.history.state, "", nextPath);
    }
  }, [currentSlide]);

  return (
    <BootRuntimeProvider wowFlags={WOW_FLAG_SNAPSHOT}>
      <Slide00ViewVisibilityProvider defaultOn={OPERATOR_VIEW_DEFAULT_ON}>
        <DeckModeProvider slideIndex={normalizeSlideIndex(currentSlide)} heavyFxWhitelist={whitelist}>
          <AppInner
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            modalOpen={modalOpen}
            openModal={openModal}
            closeModal={closeModal}
            modalImages={modalImages}
            modalTitle={modalTitle}
          />
        </DeckModeProvider>
      </Slide00ViewVisibilityProvider>
    </BootRuntimeProvider>
  );
}
