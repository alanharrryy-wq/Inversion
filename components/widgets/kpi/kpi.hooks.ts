import { useEffect, useMemo, useRef, useState } from "react";
import type { KpiItem } from "./kpi.data";

export type KpiMode = "ambient" | "active" | "locked";

export type KpiController = {
  items: KpiItem[];
  hoveredId: string | null;   // sticky hover
  selectedId: string | null;  // lock
  activeId: string | null;    // selected ?? hovered
  mode: KpiMode;

  setHovered: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  clear: () => void;

  prefersReducedMotion: boolean;
  insideRef: React.RefObject<HTMLDivElement>;
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

function idxOf(items: KpiItem[], id: string | null) {
  if (!id) return -1;
  return items.findIndex((x) => x.id === id);
}

export function useKpiController(items: KpiItem[]): KpiController {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [hoveredId, setHoveredId] = useState<string | null>(items[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const insideRef = useRef<HTMLDivElement>(null);

  const activeId = useMemo(() => selectedId ?? hoveredId, [selectedId, hoveredId]);

  const mode: KpiMode = selectedId ? "locked" : hoveredId ? "active" : "ambient";

  // ✅ Sticky hover: NO limpiamos hover en null (solo cambia al entrar a otra tarjeta)
  const setHovered = (id: string | null) => {
    if (selectedId) return;
    if (!id) return; // sticky: ignorar null
    setHoveredId(id);
  };

  const toggleSelect = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
  };

  const clear = () => {
    setSelectedId(null);
  };

  // Click afuera → unlock (solo si locked)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!selectedId) return;
      const el = insideRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      clear();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [selectedId]);

  // ESC → unlock (solo si locked)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === "Escape") {
        e.preventDefault();
        clear();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selectedId]);

  // ✅ Keyboard nav (solo cuando LOCKED)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;

      const curIdx = idxOf(items, selectedId);
      if (curIdx < 0) return;

      const cols = 2; // grid 2x2
      const rows = Math.ceil(items.length / cols);

      const go = (nextIdx: number) => {
        const safe = (nextIdx + items.length) % items.length;
        const nextId = items[safe]?.id;
        if (nextId) setSelectedId(nextId);
      };

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          go(curIdx + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          go(curIdx - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          go(curIdx + cols);
          break;
        case "ArrowUp":
          e.preventDefault();
          go(curIdx - cols);
          break;
        case "Enter":
          e.preventDefault();
          // Enter: toggle lock (unlock)
          clear();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selectedId, items]);

  return {
    items,
    hoveredId,
    selectedId,
    activeId,
    mode,
    setHovered,
    toggleSelect,
    clear,
    prefersReducedMotion,
    insideRef,
  };
}
