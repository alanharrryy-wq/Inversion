import React, { useMemo } from "react";
import { DataBox } from "../../SlideRenderer";
import { createDeterministicRng } from "../../../src/utils/deterministicRng";
import type { OperationalSignal } from "./types";

type OperationalPanelProps = {
  signals: OperationalSignal[];
};

type SignalViewModel = OperationalSignal & {
  spark: number[];
};

function createSignalViewModel(signal: OperationalSignal): SignalViewModel {
  const rng = createDeterministicRng(`slide05-${signal.id}`);
  const spark = Array.from({ length: 10 }, (_, idx) => {
    const baseline = 26 + idx * 4;
    const jitter = Math.round(rng.next() * 18);
    return Math.max(20, Math.min(88, baseline + jitter));
  });
  return { ...signal, spark };
}

export function OperationalPanel(props: OperationalPanelProps) {
  const viewModel = useMemo(
    () => props.signals.map((signal) => createSignalViewModel(signal)),
    [props.signals]
  );

  return (
    <DataBox
      title="MODELO OPERATIVO"
      rightTag="FUSED FROM LEGACY 07"
      className="h-full border-white/15"
      highlight="cyan"
    >
      <div className="space-y-4">
        {viewModel.map((signal) => (
          <article
            key={signal.id}
            className="rounded-xl border border-white/12 bg-black/30 px-4 py-3"
            data-stable-id={signal.id}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-code tracking-[0.2em] text-cyan/80">{signal.label}</h4>
                <p className="mt-1 text-sm text-gray-300">{signal.detail}</p>
              </div>
              <div className="text-2xl font-black text-white">{signal.score}%</div>
            </div>

            <div className="mt-3 flex items-end gap-1">
              {signal.spark.map((value, idx) => (
                <span
                  // Deterministic bar heights ensure visual replay does not drift.
                  key={`${signal.id}-${String(idx)}`}
                  className="w-2 rounded-t-sm bg-gradient-to-t from-cyan/50 to-cyan"
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </DataBox>
  );
}
