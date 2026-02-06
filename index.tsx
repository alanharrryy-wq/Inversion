import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/** ============================
 * [B1] CrashOverlay (en pantalla)
 * ============================ */
class CrashOverlay extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorText: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorText: "" };
  }

  static getDerivedStateFromError(err: any) {
    return {
      hasError: true,
      errorText: String(err?.stack || err?.message || err),
    };
  }

  componentDidCatch(err: any) {
    // También lo mandamos a consola para debugging
    console.error("[CRASH]", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            color: "#fff",
            padding: 24,
            overflow: "auto",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontSize: 14, opacity: 0.8, letterSpacing: 1 }}>
              HITECH DECK — CRASH OVERLAY
            </div>
            <h1 style={{ marginTop: 10, fontSize: 28, color: "#02A7CA" }}>
              Tronó algo y por eso veías pantalla negra.
            </h1>

            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              Copia el texto de abajo y pégamelo. Con eso lo matamos en un tiro.
            </p>

            <pre
              style={{
                marginTop: 18,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.45,
                fontSize: 12,
              }}
            >
              {this.state.errorText}
            </pre>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

/** ============================
 * [B2] Mount
 * ============================ */
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

/** ============================
 * [B3] Render (con protección)
 * ============================ */
root.render(
  <React.StrictMode>
    <CrashOverlay>
      <App />
    </CrashOverlay>
  </React.StrictMode>
);
