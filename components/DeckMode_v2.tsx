import React, { createContext, useContext, useMemo, useState } from "react";

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

type Ctx = {
  mode: DeckModeComputed;
  setMode: React.Dispatch<React.SetStateAction<DeckModeState>>;
};

const DeckModeContext = createContext<Ctx | null>(null);

export function useDeckMode() {
  const ctx = useContext(DeckModeContext);
  if (!ctx) throw new Error("useDeckMode must be used inside DeckModeProvider");
  return ctx;
}

type Props = {
  slideIndex: number;
  children: React.ReactNode;
  heavyFxWhitelist?: number[];
};

export function DeckModeProvider({
  slideIndex,
  heavyFxWhitelist = [4, 13],
  children,
}: Props) {
  const [base, setMode] = useState<DeckModeState>({
    stealth: false,
    track: true,
    investorLock: false,
    autoplay: false,
    autoplayMs: 6500,
  });

  const mode = useMemo<DeckModeComputed>(() => {
    const whitelisted = heavyFxWhitelist.includes(slideIndex);
    const heavyFx = base.track ? whitelisted : true;
    return { ...base, heavyFx };
  }, [base, slideIndex, heavyFxWhitelist]);

  return (
    <DeckModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DeckModeContext.Provider>
  );
}
