export type DirectorCallout = {
  id: string;
  label: string;
  detail: string;
};

export type DirectorHighlightLine = {
  id: string;
  label: string;
};

export type DirectorStepScript = {
  stepId: string;
  callouts: DirectorCallout[];
  highlightLines: DirectorHighlightLine[];
};
