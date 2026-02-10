
import React, { useEffect } from "react";
import { FirstProofDebugOverlay } from "./firstProof.debugOverlay";
import { FirstProofRail } from "./FirstProofRail";
import { LayerStackDemo } from "./LayerStackDemo";
import { RightSeal } from "./RightSeal";
import { useFirstProofRitual } from "./useFirstProofRitual";
import {
  FirstProofCanonicalProfile,
  FirstProofSnapshot,
  FirstProofThresholds,
} from "./firstProof.types";
import "./firstProof.css";

export function FirstProofRitual(props: {
  recordAnchorInteraction?: (anchorId: string, note?: string, ts?: number) => void;
  appendOperatorLog?: (entry: {
    level: "info" | "success" | "warning";
    title: string;
    detail: string;
    action: string;
    ts?: number;
  }) => void;
  profile?: FirstProofCanonicalProfile;
  thresholds?: Partial<FirstProofThresholds>;
  showInlineRightSeal?: boolean;
  onSnapshotChange?: (snapshot: FirstProofSnapshot) => void;
}) {
  const ritual = useFirstProofRitual({
    recordAnchorInteraction: props.recordAnchorInteraction,
    appendOperatorLog: props.appendOperatorLog,
    profile: props.profile,
    thresholds: props.thresholds,
  });

  useEffect(() => {
    props.onSnapshotChange?.(ritual.snapshot);
  }, [props.onSnapshotChange, ritual.snapshot]);

  return (
    <section className="slide00-firstproof-root" data-testid="slide00-firstproof-root">
      <div className="slide00-firstproof-main-grid">
        <LayerStackDemo
          snapshot={ritual.snapshot}
          gestureHandlers={ritual.gestureHandlers}
        />
        <FirstProofRail snapshot={ritual.snapshot} />
      </div>

      {props.showInlineRightSeal === false ? null : (
        <RightSeal snapshot={ritual.snapshot} profile={ritual.profile} />
      )}

      <FirstProofDebugOverlay
        state={ritual.state}
        snapshot={ritual.snapshot}
        thresholds={ritual.thresholds}
      />
    </section>
  );
}

