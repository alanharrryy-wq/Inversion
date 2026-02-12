import React from "react";
import { Slide01State, SLIDE01_TEST_IDS } from "../../core/fsm";
import { ActionButton } from "../atoms/ActionButton";
import { PanelFrame } from "../atoms/PanelFrame";

type ReplayPanelProps = {
  state: Slide01State;
  replayText: string;
  onReplayTextChange: (next: string) => void;
  onExport: () => void;
  onCopy: () => void;
  onLoadSample: () => void;
  onReplay: () => void;
};

export const ReplayPanel: React.FC<ReplayPanelProps> = ({
  state,
  replayText,
  onReplayTextChange,
  onExport,
  onCopy,
  onLoadSample,
  onReplay,
}) => {
  return (
    <PanelFrame
      testId={SLIDE01_TEST_IDS.replayPanel}
      title="Trace Replay Harness"
      subtitle="Export live pointer trace, paste JSON, and replay through the same reducer path."
      className="h-full"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          data-testid={SLIDE01_TEST_IDS.traceLength}
          className="rounded-lg border border-white/20 bg-black/35 px-3 py-2 font-code text-xs text-white/85"
        >
          trace events: {state.trace.length}
        </div>
        <ActionButton
          label="Export"
          testId={SLIDE01_TEST_IDS.traceExport}
          onClick={onExport}
          tone="primary"
        />
        <ActionButton
          label="Copy"
          testId={SLIDE01_TEST_IDS.traceCopy}
          onClick={onCopy}
          tone="neutral"
        />
        <ActionButton
          label="Load Sample"
          testId={SLIDE01_TEST_IDS.replayLoadSample}
          onClick={onLoadSample}
          tone="neutral"
        />
        <ActionButton
          label="Replay JSON"
          testId={SLIDE01_TEST_IDS.replayApply}
          onClick={onReplay}
          tone="primary"
          disabled={replayText.trim().length === 0}
        />
      </div>
      <label className="mb-1 block font-code text-[11px] uppercase tracking-[0.2em] text-white/65" htmlFor="slide01-replay-input">
        Replay JSON
      </label>
      <textarea
        id="slide01-replay-input"
        data-testid={SLIDE01_TEST_IDS.replayInput}
        className="h-40 w-full resize-y rounded-xl border border-white/20 bg-black/35 p-3 font-code text-xs leading-relaxed text-white/80 outline-none focus:border-cyan-300"
        placeholder='{\"version\":\"slide01.trace.v1\",\"source\":\"Slide01\",\"events\":[]}'
        value={replayText}
        onChange={(event) => onReplayTextChange(event.target.value)}
      />
      <p data-testid={SLIDE01_TEST_IDS.replayStatus} className="mt-2 font-code text-xs text-white/70">
        replay status: {state.replay.status} | {state.replay.message}
      </p>
    </PanelFrame>
  );
};
