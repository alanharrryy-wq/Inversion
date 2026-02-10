
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  clearBootSnapshotFromLocalStorage,
  readBootSnapshotFromLocalStorage,
  writeBootSnapshotToLocalStorage,
} from './storage';
import { createInitialBootRuntimeState, reduceBootRuntimeState } from './runtimeReducer';
import {
  selectBootCanArm,
  selectBootCanConfirm,
  selectBootDiagnostics,
  selectBootGateLocked,
  selectBootIsArmed,
  selectBootIsOperatorAssisted,
} from './selectors';
import { serializeBootSnapshot } from './snapshot';
import { resolveWowFeatureGates, WowFlagSnapshot } from './wowGate';
import { BootOperatorLogEntry, BootRuntimeAction, BootRuntimeSnapshot, BootRuntimeState } from './types';

export type BootRuntimeApi = {
  state: BootRuntimeState;
  gates: ReturnType<typeof resolveWowFeatureGates>;
  diagnostics: ReturnType<typeof selectBootDiagnostics>;
  canArm: boolean;
  canConfirm: boolean;
  isArmed: boolean;
  gateLocked: boolean;
  isOperatorAssisted: boolean;
  recordSlideEntry: (slide: number, ts?: number) => void;
  recordAnchorInteraction: (anchorId: string, note?: string, ts?: number) => void;
  requestArm: (ts?: number) => void;
  confirmArm: (ts?: number) => void;
  setOverride: (enabled: boolean, ts?: number) => void;
  toggleOverride: (ts?: number) => void;
  resetLocal: (ts?: number) => void;
  appendOperatorLog: (entry: {
    level: BootOperatorLogEntry['level'];
    title: string;
    detail: string;
    action: string;
    ts?: number;
  }) => void;
  exportSnapshot: (ts?: number) => BootRuntimeSnapshot;
  exportSnapshotJson: (ts?: number) => string;
  copySnapshotToClipboard: (ts?: number) => Promise<boolean>;
  downloadSnapshot: (fileName?: string, ts?: number) => boolean;
};

const BootRuntimeContext = createContext<BootRuntimeApi | null>(null);

export function useBootRuntime(): BootRuntimeApi {
  const value = useContext(BootRuntimeContext);
  if (!value) {
    throw new Error('useBootRuntime must be used inside BootRuntimeProvider.');
  }
  return value;
}

function buildInitialState(loadFromStorage: boolean): BootRuntimeState {
  if (!loadFromStorage || typeof window === 'undefined') {
    return createInitialBootRuntimeState();
  }

  const snapshot = readBootSnapshotFromLocalStorage(window.localStorage);
  if (!snapshot) {
    return createInitialBootRuntimeState();
  }

  return reduceBootRuntimeState(createInitialBootRuntimeState(), {
    type: 'BOOT_RUNTIME_RESTORE',
    snapshot,
  });
}

export function BootRuntimeProvider(props: {
  children: React.ReactNode;
  wowFlags: WowFlagSnapshot;
  loadFromStorage?: boolean;
  persistToStorage?: boolean;
}) {
  const {
    children,
    wowFlags,
    loadFromStorage = true,
    persistToStorage = true,
  } = props;

  const [state, dispatch] = useReducer<React.Reducer<BootRuntimeState, BootRuntimeAction>>(
    reduceBootRuntimeState,
    loadFromStorage,
    buildInitialState
  );

  useEffect(() => {
    if (!persistToStorage) return;
    if (typeof window === 'undefined') return;
    const snapshot = serializeBootSnapshot(state, Date.now());
    writeBootSnapshotToLocalStorage(snapshot, window.localStorage);
  }, [persistToStorage, state]);

  const gates = useMemo(() => resolveWowFeatureGates(state, wowFlags), [state, wowFlags]);
  const diagnostics = useMemo(() => selectBootDiagnostics(state), [state]);
  const canArm = useMemo(() => selectBootCanArm(state), [state]);
  const canConfirm = useMemo(() => selectBootCanConfirm(state), [state]);
  const isArmed = useMemo(() => selectBootIsArmed(state), [state]);
  const gateLocked = useMemo(() => selectBootGateLocked(state), [state]);
  const isOperatorAssisted = useMemo(() => selectBootIsOperatorAssisted(state), [state]);

  const api = useMemo<BootRuntimeApi>(() => {
    const recordSlideEntry = (slide: number, ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_RECORD_SLIDE_ENTRY', slide, ts });
    };

    const recordAnchorInteraction = (anchorId: string, note?: string, ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_RECORD_ANCHOR_INTERACTION', anchorId, note, ts });
    };

    const requestArm = (ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_REQUEST_ARM', ts });
    };

    const confirmArm = (ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_CONFIRM_ARM', ts });
    };

    const setOverride = (enabled: boolean, ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_SET_OVERRIDE', enabled, ts });
    };

    const toggleOverride = (ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_SET_OVERRIDE', enabled: !state.boot.overrideEnabled, ts });
    };

    const resetLocal = (ts?: number) => {
      dispatch({ type: 'BOOT_RUNTIME_RESET_LOCAL', ts });
      if (typeof window !== 'undefined') {
        clearBootSnapshotFromLocalStorage(window.localStorage);
      }
    };

    const appendOperatorLog = (entry: {
      level: BootOperatorLogEntry['level'];
      title: string;
      detail: string;
      action: string;
      ts?: number;
    }) => {
      dispatch({
        type: 'BOOT_RUNTIME_ADD_LOG',
        level: entry.level,
        title: entry.title,
        detail: entry.detail,
        action: entry.action,
        ts: entry.ts,
      });
    };

    const exportSnapshot = (ts?: number): BootRuntimeSnapshot => {
      const exportedAtTs = ts ?? Date.now();
      return serializeBootSnapshot(state, exportedAtTs);
    };

    const exportSnapshotJson = (ts?: number): string => {
      return JSON.stringify(exportSnapshot(ts), null, 2);
    };

    const copySnapshotToClipboard = async (ts?: number): Promise<boolean> => {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        return false;
      }
      try {
        await navigator.clipboard.writeText(exportSnapshotJson(ts));
        return true;
      } catch {
        return false;
      }
    };

    const downloadSnapshot = (fileName = 'boot-snapshot.json', ts?: number): boolean => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
      }

      const json = exportSnapshotJson(ts);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
      return true;
    };

    return {
      state,
      gates,
      diagnostics,
      canArm,
      canConfirm,
      isArmed,
      gateLocked,
      isOperatorAssisted,
      recordSlideEntry,
      recordAnchorInteraction,
      requestArm,
      confirmArm,
      setOverride,
      toggleOverride,
      resetLocal,
      appendOperatorLog,
      exportSnapshot,
      exportSnapshotJson,
      copySnapshotToClipboard,
      downloadSnapshot,
    };
  }, [
    state,
    gates,
    diagnostics,
    canArm,
    canConfirm,
    isArmed,
    gateLocked,
    isOperatorAssisted,
  ]);

  return <BootRuntimeContext.Provider value={api}>{children}</BootRuntimeContext.Provider>;
}

