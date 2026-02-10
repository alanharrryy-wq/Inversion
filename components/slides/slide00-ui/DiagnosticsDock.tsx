import React from "react";
import { DiagnosticsBackButton } from "./DiagnosticsBackButton";
import { GlassSurface } from "./GlassSurface";
import { DiagnosticsControlRow, DiagnosticsLogRow, DiagnosticsMetaItem } from "./types";

export function DiagnosticsDock(props: {
  open: boolean;
  compact: boolean;
  onBack: () => void;
  onToggleMode: () => void;
  metaItems: DiagnosticsMetaItem[];
  controlRows: DiagnosticsControlRow[];
  satisfiedRows: string[];
  missingRows: string[];
  logRows: DiagnosticsLogRow[];
  footerCopy: string;
  footerTime: string;
}) {
  if (!props.open) return null;

  return (
    <GlassSurface
      as="aside"
      className="slide00-boot-dock"
      variant="dock"
    >
      <div className="slide00-boot-dock-frame" data-compact={props.compact ? "true" : "false"} data-testid="boot-operator-dock">
        <header className="slide00-boot-dock-header">
          <h3 className="slide00-boot-dock-title">operator diagnostics</h3>
          <div className="slide00-boot-dock-header-actions">
            <button
              type="button"
              className="slide00-boot-dock-close"
              onClick={props.onToggleMode}
              data-testid="diagnostics-dock-mode-toggle"
            >
              {props.compact ? "docked" : "compact"}
            </button>
            <DiagnosticsBackButton onClick={props.onBack} testId="boot-operator-dock-close" />
          </div>
        </header>

        <div className="slide00-boot-dock-meta">
          {props.metaItems.map((item) => (
            <article key={item.key} className="slide00-boot-dock-meta-item">
              <p className="slide00-boot-dock-meta-key">{item.label}</p>
              <p className="slide00-boot-dock-meta-value" data-testid={item.testId}>{item.value}</p>
            </article>
          ))}
        </div>

        <div className="slide00-boot-dock-controls">
          {props.controlRows.map((row) => (
            <div key={row.key} className="slide00-boot-dock-control-row">
              <p className="slide00-boot-dock-control-copy">{row.copy}</p>
              <div className="slide00-boot-dock-action-group">
                {row.actions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    className="slide00-boot-dock-btn"
                    data-active={action.active ? "true" : "false"}
                    data-testid={action.testId}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="slide00-boot-dock-scroll slide00-boot-scrollbar">
          <section className="slide00-boot-dock-block">
            <h4 className="slide00-boot-dock-block-title">evidence satisfied</h4>
            <ul className="slide00-boot-dock-list">
              {props.satisfiedRows.length === 0 ? (
                <li className="slide00-boot-dock-list-item">none</li>
              ) : (
                props.satisfiedRows.map((item) => (
                  <li key={item} className="slide00-boot-dock-list-item">{item}</li>
                ))
              )}
            </ul>
          </section>

          <section className="slide00-boot-dock-block">
            <h4 className="slide00-boot-dock-block-title">blockers missing</h4>
            <ul className="slide00-boot-dock-list">
              {props.missingRows.length === 0 ? (
                <li className="slide00-boot-dock-list-item">none</li>
              ) : (
                props.missingRows.map((item) => (
                  <li key={item} className="slide00-boot-dock-list-item">{item}</li>
                ))
              )}
            </ul>
          </section>

          <section className="slide00-boot-dock-block">
            <h4 className="slide00-boot-dock-block-title">operator log</h4>
            <div className="slide00-boot-dock-log-list">
              {props.logRows.length === 0 ? (
                <p className="slide00-boot-dock-list-item">no entries</p>
              ) : (
                props.logRows.map((entry) => (
                  <article key={entry.id} className="slide00-boot-dock-log-row" data-testid="operator-log-row">
                    <p className="slide00-boot-dock-log-head">{entry.head}</p>
                    <p className="slide00-boot-dock-log-body">{entry.body}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="slide00-boot-dock-footer">
          <p className="slide00-boot-dock-footer-copy">{props.footerCopy}</p>
          <p className="slide00-boot-dock-footer-time">{props.footerTime}</p>
        </footer>
      </div>
    </GlassSurface>
  );
}
