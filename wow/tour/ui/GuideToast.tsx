import React from 'react';

type Props = {
  visible: boolean;
  text: string;
};

export function GuideToast({ visible, text }: Props) {
  if (!visible || !text) return null;
  return <div className="wow-guide-toast">{text}</div>;
}
