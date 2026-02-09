import React, { useCallback, useEffect, useMemo, useState } from "react";
import Background from "./components/Background";
import Scaler from "./components/Scaler";
import SlideRenderer from "./components/SlideRenderer";
import Modal from "./components/Modal";
import AIChat from "./components/AIChat";
import { DeckModeProvider, useDeckMode } from "./components/DeckRuntimeMode";
import { SLIDE_LABELS } from "./components/SlideRenderer";
import { WOW_DEMO, WOW_DEMO_SCRIPT, WOW_FLAGS, WOW_MIRROR, WOW_OVERLAY, WOW_TOUR, WOW_TOUR_SCRIPT } from "./config/wow";
import { TourOverlay, useTourEngine } from "./wow/tour";

/* ==========================================
   B9 — ControlBar HUD Pro (v1.4.0)
   ========================================== */

const ControlBar = () => {
  const { mode, setStealth, setTrack, toggleInvestorLock, toggleAutoplay } = useDeckMode();
  const [visible, setVisible] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const hideTimer = React.useRef<number | null>(null);

  const kickHideTimer = () => {
    if (locked) return;
    setVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setVisible(false),
      2200
    );
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
        setLocked((v) => !v);
        setVisible(true);
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener(
        "keydown",
        onKey,
        { capture: true } as any
      );
  }, []);

  React.useEffect(() => {
    kickHideTimer();
    window.addEventListener("mousemove", kickHideTimer, { passive: true });
    return () =>
      window.removeEventListener("mousemove", kickHideTimer);
  }, [locked]);

  const btn = (active: boolean, onClick: () => void, label: string, glow: string, testId: string) => (
    <button
      data-testid={testId}
      aria-pressed={active}
      onClick={() => {
        onClick();
        kickHideTimer();
      }}
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
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity .35s ease, transform .35s ease",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 9999,
      }}
    >
      {/* LEFT — MODES */}
      <div style={{ display: "flex", gap: 10 }}>
        {btn(mode.stealth, () => setStealth(), "Stealth", "rgba(120,120,120,.6)", "mode-stealth")}
        {btn(mode.track, () => setTrack(), "Track", "rgba(0,180,200,.9)", "mode-track")}
        {btn(mode.investorLock, () => toggleInvestorLock(), "Lock", "rgba(0,180,200,.6)", "mode-lock")}
        {btn(mode.autoplay && mode.investorLock, () => toggleAutoplay(), "Autoplay", "rgba(180,140,40,.9)", "mode-autoplay")}
      </div>

      {/* RIGHT — STATUS */}
      <div
        data-testid="mode-hint"
        style={{
          fontSize: 10,
          opacity: 0.55,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        F1 STEALTH · F2 TRACK · F3 LOCK · F4 AUTOPLAY · CTRL+SHIFT+L{" "}
        {locked ? "UNLOCK" : "LOCK"}
      </div>
      <div data-testid="mode-state" style={{ display: "none" }}>
        {mode.stealth ? "stealth:on" : "stealth:off"}|{mode.track ? "track:on" : "track:off"}|{mode.investorLock ? "lock:on" : "lock:off"}|{mode.autoplay ? "autoplay:on" : "autoplay:off"}
      </div>
    </div>
  );
};


const TOTAL_SLIDES = 20;

// wrap matemático correcto (incluye negativos)
const normalizeSlideIndex = (idx: number) => {
  const n = TOTAL_SLIDES;
  if (!Number.isFinite(idx)) return 0;
  return ((Math.trunc(idx) % n) + n) % n;
};

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
    <aside className="pointer-events-none absolute right-5 top-5 z-[130] min-w-[210px] rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-[10px] font-code tracking-[0.2em] text-white/70 backdrop-blur-sm">
      <div>SLIDE {String(currentSlide + 1).padStart(2, "0")} · {slideName}</div>
      <div className="mt-1">AI MODE · {aiMode.toUpperCase()}</div>
      <div className="mt-1">FLAGS · {onFlags || "none"}</div>
      <div className="mt-1">RUNTIME · {mode.track ? "TRACK" : "STD"}/{mode.stealth ? "STEALTH" : "OPEN"}</div>
    </aside>
  );
};

const DemoScriptOverlay: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  if (!(WOW_DEMO && WOW_DEMO_SCRIPT)) return null;

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
    <aside className="wow-demo-script-overlay">
      <h4>DEMO SCRIPT</h4>
      <p>Slide {String(slide).padStart(2, "0")} moment: {moment}</p>
      <p className="wow-killer-q">Q1: What evidence appears first under audit pressure?</p>
      <p className="wow-killer-q">Q2: What 60-day KPI proves risk reduction is real?</p>
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
  const [mirrorActive, setMirrorActive] = useState(WOW_DEMO && WOW_MIRROR && currentSlide === 0);
  const tourEnabled = WOW_DEMO && WOW_TOUR;
  const { state: tourState, activeStep: tourStep, stepComplete, api: tourApi } = useTourEngine({
    enabled: tourEnabled,
    currentSlide: normalizeSlideIndex(currentSlide),
    scriptId: WOW_TOUR_SCRIPT || "enterprise",
  });

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

  useEffect(() => {
    if (!WOW_DEMO || !WOW_MIRROR) return;
    if (currentSlide !== 0) {
      setMirrorActive(false);
      return;
    }
    setMirrorActive(true);
  }, [currentSlide]);

  useEffect(() => {
    if (!tourEnabled) return;
    window.dispatchEvent(
      new CustomEvent("wow:tour-event", {
        detail: { name: "slide:changed", payload: { to: normalizeSlideIndex(currentSlide) }, ts: Date.now() },
      })
    );
  }, [currentSlide, tourEnabled]);

  useEffect(() => {
    if (!tourEnabled) return;
    window.dispatchEvent(
      new CustomEvent("wow:tour-step", {
        detail: {
          stepId: tourStep?.id ?? "",
          pasteQuestion: tourStep?.pasteQuestion ?? "",
          running: tourState.status === "running",
        },
      })
    );
  }, [tourEnabled, tourStep, tourState.status]);

  // Keyboard authority:
  // - DeckModeProvider exclusively owns F1-F4 (global mode control).
  // - App layer only handles slide navigation keys.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1" || e.key === "F2" || e.key === "F3" || e.key === "F4") return;
      // Si hay modal abierto, no navegues slides
      if (modalOpen) return;

      // Investor lock: bloquea navegación normal
      if (mode.investorLock) return;

      // navegación normal
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [modalOpen, mode.investorLock, nextSlide, prevSlide]);

  // ▶ Autoplay (solo si investorLock)
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
      <OperatorOverlay currentSlide={normalizeSlideIndex(currentSlide)} />
      <DemoScriptOverlay currentSlide={normalizeSlideIndex(currentSlide)} />
      {tourEnabled && (
        <TourOverlay
          active={tourState.status === "running"}
          scriptTitle={tourState.scriptTitle || "Enterprise Investor Demo"}
          stepIndex={tourState.stepIndex}
          totalSteps={tourState.steps.length || 1}
          step={tourStep}
          canNext={stepComplete || !!tourStep?.allowNextBeforeComplete}
          onBack={tourApi.back}
          onNext={tourApi.next}
          onSkip={tourApi.skip}
          onStart={() => tourApi.start(WOW_TOUR_SCRIPT || "enterprise")}
          onPasteQuestion={(text) => window.dispatchEvent(new CustomEvent("wow:tour-paste", { detail: { text } }))}
        />
      )}
      <div data-testid="global-mode-state" style={{ display: "none" }}>
        {mode.stealth ? "stealth:on" : "stealth:off"}|{mode.track ? "track:on" : "track:off"}|{mode.investorLock ? "lock:on" : "lock:off"}|{mode.autoplay ? "autoplay:on" : "autoplay:off"}
      </div>

      <ModePill />

      <Scaler slideIndex={normalizeSlideIndex(currentSlide)}>
        <div className="deck-stage-frame w-full h-full relative [perspective:1400px]">
          <SlideRenderer
            index={normalizeSlideIndex(currentSlide)}
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

      {/* En stealth, normalmente quitas chat para demo fina */}
      {!mode.stealth && <AIChat />}
    </div>
  );
};

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const openModal = (images: string[], title: string) => {
    setModalImages(images);
    setModalTitle(title);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  // whitelist default: Slide04 + Slide13 (FX pesados permitidos en Track Mode)
  const whitelist = useMemo(() => [4, 13], []);

  return (
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
  );
}
