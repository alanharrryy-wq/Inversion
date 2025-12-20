import { useEffect, useMemo, useState } from "react";
import type { KpiItem } from "./kpi.data";

export type KpiMode = "ambient" | "active" | "locked";

export type KpiController = {
  items: KpiItem[];
  hoveredId: string | null;
  selectedId: string | null;
  activeId: string | null; // selected si existe, si no hovered
  mode: KpiMode;

  setHovered: (id: string | null) => void;
  select: (id: string) => void;
  clear: () => void;

  prefersReducedMotion: boolean;
};

export function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setPrefers(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return prefers;
}

export function useKpiController(items: KpiItem[]): KpiController {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = useMemo(() => selectedId ?? hoveredId, [selectedId, hoveredId]);

  const mode: KpiMode = selectedId ? "locked" : hoveredId ? "active" : "ambient";

  const setHovered = (id: string | null) => {
    // Si está locked, ignoramos hover (selección manda)
    if (selectedId) return;
    setHoveredId(id);
  };

  const select = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
  };

  const clear = () => {
    setSelectedId(null);
    setHoveredId(null);
  };

  return {
    items,
    hoveredId,
    selectedId,
    activeId,
    mode,
    setHovered,
    select,
    clear,
    prefersReducedMotion,
  };
}
