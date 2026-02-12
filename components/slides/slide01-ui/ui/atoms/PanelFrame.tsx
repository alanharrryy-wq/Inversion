import React from "react";

type PanelFrameProps = {
  title: string;
  subtitle?: string;
  testId: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export const PanelFrame: React.FC<PanelFrameProps> = ({
  title,
  subtitle,
  testId,
  children,
  rightSlot,
  className,
}) => {
  return (
    <section
      data-testid={testId}
      className={`rounded-2xl border border-white/15 bg-black/45 p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)] ${className ?? ""}`}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-code text-xs uppercase tracking-[0.28em] text-cyan/85">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/70 leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </header>
      <div>{children}</div>
    </section>
  );
};
