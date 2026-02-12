
import React from "react";

export function AiCoreIcon(props: {
  className?: string;
  title?: string;
}) {
  const { className = "", title = "AI core placeholder" } = props;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={`slide00-ai-core-icon ${className}`.trim()}
    >
      <defs>
        <linearGradient id="slide00AiCoreStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--boot-token-accent-primary)" />
          <stop offset="100%" stopColor="var(--boot-token-accent-secondary)" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="8" fill="rgba(5, 20, 29, 0.84)" stroke="url(#slide00AiCoreStroke)" strokeWidth="1.8" />
      <path d="M16 32h32M32 16v32M20 20l24 24M44 20L20 44" stroke="url(#slide00AiCoreStroke)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="32" cy="32" r="6" fill="rgba(70, 220, 255, 0.18)" stroke="url(#slide00AiCoreStroke)" strokeWidth="1.8" />
      <circle cx="32" cy="32" r="2.2" fill="var(--boot-token-accent-primary)" />
    </svg>
  );
}

