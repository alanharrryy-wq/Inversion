import React, { useEffect, useMemo, useState } from "react";
import Background from "./components/Background";
import Scaler from "./components/Scaler";
import SlideRenderer from "./components/SlideRenderer";
import Modal from "./components/Modal";
import AIChat from "./components/AIChat";
import { DeckModeProvider, useDeckMode } from "./components/DeckRuntimeMode";

/* ==========================================
   B9 — ControlBar HUD Pro (v1.4.0)
   ========================================== */

type Mode = "stealth" | "track" | "free" | "manual";

const ControlBar = () => {
  const [mode, setMode] = React.useState<Mode>("track");
  const [visible, setVisible] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const hideTimer = React.useRef<number | null>(null);

  /* ===============================
     SAFE EMIT (no rompe si no existe)
     =============================== */
  const emitMode = (m: Mode) => {
    // 1) Orchestrator global (si existe)
    // @ts-ignore
    if (window?.emit) window.emit("deck_mode", m);

    // 2) CustomEvent (fallback universal)
    window.dispatchEvent(
      new CustomEvent("deck_mode", { detail: m })
    );
  };

  const applyMode = (m: Mode) => {
    setMode(m);
    emitMode(m);
    kickHideTimer();
  };

  const kickHideTimer = () => {
    if (locked) return;
    setVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setVisible(false),
      2200
    );
  };

  /* ===============================
     HOTKEYS (FIX DEFINITIVO)
     =============================== */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["F1", "F2", "F3", "F4"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        case "F1":
          applyMode("stealth");
          break;
        case "F2":
          applyMode("track");
          break;
        case "F3":
          applyMode("free");
          break;
        case "F4":
          applyMode("manual");
          break;
      }

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
  }, [locked]);

  React.useEffect(() => {
    kickHideTimer();
    window.addEventListener("mousemove", kickHideTimer);
    return () =>
      window.removeEventListener("mousemove", kickHideTimer);
  }, [locked]);

  const btn = (id: Mode, label: string, glow: string) => (
    <button
      onClick={() => applyMode(id)}
      style={{
        padding: "6px 14px",
        borderRadius: 10,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        border: "1px solid rgba(255,255,255,.12)",
        background:
          mode === id
            ? "rgba(255,255,255,.14)"
            : "rgba(255,255,255,.04)",
        boxShadow:
          mode === id ? `0 0 18px ${glow}` : "none",
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
        {btn("stealth", "Stealth", "rgba(120,120,120,.6)")}
        {btn("track", "Track", "rgba(0,180,200,.9)")}
        {btn("free", "Free", "rgba(0,180,200,.6)")}
        {btn("manual", "Manual", "rgba(180,140,40,.9)")}
      </div>

      {/* RIGHT — STATUS */}
      <div
        style={{
          fontSize: 10,
          opacity: 0.55,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        F1 STEALTH · F2 TRACK · F3 FREE · F4 MANUAL · CTRL+SHIFT+L{" "}
        {locked ? "UNLOCK" : "LOCK"}
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

// UI mini de estado (solo si NO stealth)
const ModePill: React.FC<{ slide: number }> = ({ slide }) => {
  const { mode } = useDeckMode();

  if (mode.stealth) return null;

  const tags = [
    mode.track ? "TRACK" : "TRACK-OFF",
    mode.investorLock ? "LOCK" : "FREE",
    mode.autoplay && mode.investorLock ? "AUTO" : "MANUAL",
    mode.heavyFx ? "FX" : "FX-OFF",
  ];

  return (
    <ControlBar />
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
  const { mode, setMode } = useDeckMode();

  const nextSlide = () => setCurrentSlide((prev) => normalizeSlideIndex(prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => normalizeSlideIndex(prev - 1));
  const goToSlide = (index: number) => setCurrentSlide(normalizeSlideIndex(index));

  // 🔒 NAV por teclado + hotkeys globales
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // salida secreta SIEMPRE disponible
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
        setMode((m) => ({
          ...m,
          investorLock: false,
          autoplay: false,
        }));
        return;
      }

      // toggles aunque haya modal (para demo)
      if (e.key === "F1") {
        e.preventDefault();
        setMode((m) => ({ ...m, stealth: !m.stealth }));
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        setMode((m) => ({ ...m, track: !m.track }));
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        setMode((m) => {
          const next = !m.investorLock;
          return {
            ...m,
            investorLock: next,
            autoplay: next ? m.autoplay : false, // si apagas lock, apaga autoplay
          };
        });
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        setMode((m) => {
          if (!m.investorLock) return m;
          return { ...m, autoplay: !m.autoplay };
        });
        return;
      }

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
  }, [modalOpen, mode.investorLock, setMode]);

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
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-main">
      <Background />

      <ModePill slide={currentSlide} />

      <Scaler slideIndex={normalizeSlideIndex(currentSlide)}>
        <div className="w-full h-full relative [perspective:1000px]">
          <SlideRenderer
            index={normalizeSlideIndex(currentSlide)}
            totalSlides={TOTAL_SLIDES}
            nextSlide={nextSlide}
            prevSlide={prevSlide}
            goToSlide={goToSlide}
            openModal={openModal}
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
