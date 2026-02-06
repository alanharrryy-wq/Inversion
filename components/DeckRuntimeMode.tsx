// components/DeckRuntimeMode.tsx
import React, { createContext, useContext, useMemo, useState } from "react";

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

type DeckModeCtx = {
  mode: DeckModeComputed;
  setMode: React.Dispatch<React.SetStateAction<DeckModeState>>;
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

  const mode = useMemo<DeckModeComputed>(() => {
    // Track ON => heavyFx solo si slide está whitelisted
    const whitelisted = heavyFxWhitelist.includes(slideIndex);
    let heavyFx = base.track ? whitelisted : true;

    // Seguridad demo (evita lag/ruido)
    if (base.stealth) heavyFx = false;
    if (base.investorLock) heavyFx = false;

    return { ...base, heavyFx };
  }, [base, slideIndex, heavyFxWhitelist]);

  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
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
