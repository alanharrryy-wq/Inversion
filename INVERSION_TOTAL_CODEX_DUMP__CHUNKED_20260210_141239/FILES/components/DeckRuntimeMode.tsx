
// components/DeckRuntimeMode.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// =========================================================
// [B1] Types (compat con App.tsx)
// =========================================================
export type DeckModeState = {
  stealth: boolean;
  track: boolean;
  investorLock: boolean;
  autoplay: boolean;
  autoplayMs: number;
};

export type DeckModeComputed = DeckModeState & {
  heavyFx: boolean;
};
const isModeHotkey = (key: string) => key === "F1" || key === "F2" || key === "F3" || key === "F4";

type DeckModeCtx = {
  mode: DeckModeComputed;
  setMode: (next: Partial<DeckModeState> | ((prev: DeckModeState) => Partial<DeckModeState> | DeckModeState)) => void;
  setStealth: (value?: boolean) => void;
  setTrack: (value?: boolean) => void;
  toggleInvestorLock: () => void;
  toggleAutoplay: () => void;
};

const Ctx = createContext<DeckModeCtx | null>(null);

// =========================================================
// [B2] Hook
// =========================================================
export function useDeckMode(): DeckModeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDeckMode must be used inside DeckModeProvider");
  return v;
}

// =========================================================
// [B3] Provider principal (lo usa App.tsx)
// =========================================================
export function DeckModeProvider(props: {
  slideIndex: number;
  heavyFxWhitelist?: number[];
  children: React.ReactNode;
}) {
  const { slideIndex, heavyFxWhitelist = [4, 13], children } = props;

  const [base, setMode] = useState<DeckModeState>({
    stealth: false,
    track: true,
    investorLock: false,
    autoplay: false,
    autoplayMs: 6500,
  });

  const updateMode = useCallback(
    (next: Partial<DeckModeState> | ((prev: DeckModeState) => Partial<DeckModeState> | DeckModeState)) => {
      setMode((prev) => {
        const patch = typeof next === "function" ? next(prev) : next;
        const resolved = { ...prev, ...patch };
        if (!resolved.investorLock && resolved.autoplay) {
          resolved.autoplay = false;
        }
        if (!Number.isFinite(resolved.autoplayMs)) {
          resolved.autoplayMs = prev.autoplayMs;
        }
        resolved.autoplayMs = Math.max(1500, Math.min(30000, Math.round(resolved.autoplayMs)));
        return resolved;
      });
    },
    []
  );

  const setStealth = useCallback((value?: boolean) => {
    updateMode((prev) => ({ stealth: value ?? !prev.stealth }));
  }, [updateMode]);

  const setTrack = useCallback((value?: boolean) => {
    updateMode((prev) => ({ track: value ?? !prev.track }));
  }, [updateMode]);

  const toggleInvestorLock = useCallback(() => {
    updateMode((prev) => {
      const investorLock = !prev.investorLock;
      return { investorLock, autoplay: investorLock ? prev.autoplay : false };
    });
  }, [updateMode]);

  const toggleAutoplay = useCallback(() => {
    updateMode((prev) => (prev.investorLock ? { autoplay: !prev.autoplay } : {}));
  }, [updateMode]);

  useEffect(() => {
    // Global keyboard authority:
    // This layer exclusively owns F1-F4 mode hotkeys. Other components should not handle these keys.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
        updateMode({ investorLock: false, autoplay: false });
        return;
      }

      if (isModeHotkey(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "F1") {
        setStealth();
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        setTrack();
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        toggleInvestorLock();
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        toggleAutoplay();
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as AddEventListenerOptions);
  }, [setStealth, setTrack, toggleAutoplay, toggleInvestorLock, updateMode]);

  const mode = useMemo<DeckModeComputed>(() => {
    // Track ON => heavyFx solo si slide está whitelisted
    const whitelisted = heavyFxWhitelist.includes(slideIndex);
    let heavyFx = base.track ? whitelisted : true;

    // Seguridad demo (evita lag/ruido)
    if (base.stealth) heavyFx = false;
    if (base.investorLock) heavyFx = false;

    return { ...base, heavyFx };
  }, [base, slideIndex, heavyFxWhitelist]);

  const ctxValue = useMemo(
    () => ({
      mode,
      setMode: updateMode,
      setStealth,
      setTrack,
      toggleInvestorLock,
      toggleAutoplay,
    }),
    [mode, setStealth, setTrack, toggleAutoplay, toggleInvestorLock, updateMode]
  );

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
}

// =========================================================
// [B4] Alias compat (por si algún archivo viejo lo llama así)
// =========================================================
export const DeckRuntimeModeProvider = DeckModeProvider;

// =========================================================
// [B5] Hook opcional: modo efectivo por slide
// (si lo necesitas en slides para heavyFx por slide)
// =========================================================
export function useDeckModeForSlide(slideIndex: number) {
  const api = useDeckMode();
  const { mode } = api;

  // Si Track ON, heavyFx solo en whitelist (la misma regla del provider),
  // pero esto te permite “consultar” por slide si alguna slide lo requiere.
  // OJO: aquí no tenemos whitelist, así que solo regresamos el modo actual.
  // Si quieres que esto sea exacto por slide, pásale slideIndex al provider (ya lo haces en App).
  return { ...api, slideIndex };
}

