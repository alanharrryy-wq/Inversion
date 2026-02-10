import React from 'react';
import type { GuideOverlayModel } from '../types';
import { GuideCompletionToast } from './GuideCompletionToast';
import { GuideEvidenceList } from './GuideEvidenceList';
import { GuideProgressHeader } from './GuideProgressHeader';

type Props = {
  scriptTitle: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  model: GuideOverlayModel;
  toast: string;
};

export function GuideScaffold({ scriptTitle, status, model, toast }: Props) {
  return (
    <div className="wow-guide-shell" data-testid="guide-scaffold">
      <GuideProgressHeader
        scriptTitle={scriptTitle}
        stepTitle={model.stepTitle}
        progressLabel={model.progressLabel}
        status={status}
      />

      <GuideEvidenceList
        blockedReasons={model.blockedReasons}
        missingEvidence={model.missingEvidence}
        satisfiedEvidence={model.satisfiedEvidence}
      />

      <GuideCompletionToast visible={Boolean(toast)} text={toast} />
    </div>
  );
}
