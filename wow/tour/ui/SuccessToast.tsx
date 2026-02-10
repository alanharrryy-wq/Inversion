import React from 'react';

type Props = {
  visible: boolean;
  text: string;
  className?: string;
};

export function SuccessToast({ visible, text, className = '' }: Props) {
  if (!visible || !text) return null;
  return <div className={`wow-tour-success-toast ${className}`.trim()}>{text}</div>;
}
