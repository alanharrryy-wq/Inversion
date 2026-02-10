import React from 'react';

type Props = {
  visible: boolean;
  text: string;
};

export function GuideCompletionToast({ visible, text }: Props) {
  if (!visible || !text) return null;
  return (
    <div className="wow-guide-complete-toast" role="status" aria-live="polite" data-testid="guide-success-toast">
      <span className="wow-guide-complete-toast__glyph">✓</span>
      <span>{text}</span>
    </div>
  );
}
