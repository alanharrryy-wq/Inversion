import React, { createContext, useContext, useMemo, useState } from "react";
import { ViewToggleState } from "./types";

export type Slide00ViewVisibilityApi = ViewToggleState & {
  setShowTopHudRow: (value: boolean) => void;
  setShowTopRibbon: (value: boolean) => void;
  setShowDiagnostics: (value: boolean) => void;
  resetToDefaults: () => void;
};

const Slide00ViewVisibilityContext = createContext<Slide00ViewVisibilityApi | null>(null);

function buildDefaultState(defaultOn: boolean): ViewToggleState {
  return {
    showTopHudRow: defaultOn,
    showTopRibbon: defaultOn,
    showDiagnostics: defaultOn,
  };
}

export function Slide00ViewVisibilityProvider(props: {
  children: React.ReactNode;
  defaultOn?: boolean;
}) {
  const { children, defaultOn = false } = props;

  const [state, setState] = useState<ViewToggleState>(() => buildDefaultState(defaultOn));

  const api = useMemo<Slide00ViewVisibilityApi>(
    () => ({
      ...state,
      setShowTopHudRow: (value: boolean) => setState((prev) => ({ ...prev, showTopHudRow: value })),
      setShowTopRibbon: (value: boolean) => setState((prev) => ({ ...prev, showTopRibbon: value })),
      setShowDiagnostics: (value: boolean) => setState((prev) => ({ ...prev, showDiagnostics: value })),
      resetToDefaults: () => setState(buildDefaultState(defaultOn)),
    }),
    [defaultOn, state]
  );

  return (
    <Slide00ViewVisibilityContext.Provider value={api}>
      {children}
    </Slide00ViewVisibilityContext.Provider>
  );
}

export function useSlide00ViewVisibility(): Slide00ViewVisibilityApi {
  const context = useContext(Slide00ViewVisibilityContext);

  if (!context) {
    throw new Error("useSlide00ViewVisibility must be used inside Slide00ViewVisibilityProvider.");
  }

  return context;
}
