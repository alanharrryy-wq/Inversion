import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";

type Mouse = { x: number; y: number; vx: number; vy: number; t: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function useRafMouse(ref: React.RefObject<HTMLElement>) {
  const [m, setM] = useState<Mouse>({ x: 0.5, y: 0.5, vx: 0, vy: 0, t: 0 });
  const raf = useRef<number | null>(null);
  const last = useRef<{ x: number; y: number; ts: number }>({
    x: 0.5,
    y: 0.5,
    ts: performance.now(),
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (raf.current) return;

      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        const r = el.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width, 0, 1);
        const y = clamp((e.clientY - r.top) / r.height, 0, 1);

        const now = performance.now();
        const dt = Math.max(16, now - last.current.ts);
        const vx = (x - last.current.x) / (dt / 1000);
        const vy = (y - last.current.y) / (dt / 1000);

        last.current = { x, y, ts: now };
        setM({ x, y, vx, vy, t: now });
      });
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [ref]);

  return m;
}

export const Slide00: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const mouse = useRafMouse(shellRef);

  const v = clamp(Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy), 0, 2.2);
  const energy = clamp(0.10 + v * 0.12, 0.10, 0.50);

  const cam = useMemo(() => {
    const depth = 0.9;
    const tx = (mouse.x - 0.5) * 16 * depth;
    const ty = (mouse.y - 0.5) * 12 * depth;
    const rx = (mouse.y - 0.5) * 0.55;
    const ry = (mouse.x - 0.5) * -0.7;
    return { tx, ty, rx, ry };
  }, [mouse.x, mouse.y]);

  const hx = Math.round(18 + mouse.x * 68);
  const hy = Math.round(12 + mouse.y * 60);

  return (
    <SlideContainer>
      <div
        ref={shellRef}
        className="relative w-full h-full overflow-hidden rounded-[24px]"
        style={{ background: "transparent" }}
      >
        <style>{`
          @keyframes s00_sweep {
            0% { transform: translate3d(-10%,0,0); opacity: 0.10; }
            50% { transform: translate3d(10%,0,0); opacity: 0.16; }
            100% { transform: translate3d(-10%,0,0); opacity: 0.10; }
          }
        `}</style>

        <div
          className="absolute inset-0"
          style={{
            transform:
              `perspective(1600px) translate3d(${cam.tx}px, ${cam.ty}px, 0) ` +
              `rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) scale(1.01)`,
            transformOrigin: "58% 42%",
            transition: "transform 520ms cubic-bezier(.2,.9,.2,1)",
          }}
        >
          <Header
            title="HITECH RTS"
            breadcrumb="MENOS FRICCIÓN. MÁS SISTEMA. CERO PAJA."
            slideNum={1}
          />

          <div className="absolute inset-0 flex items-center justify-center px-[84px] py-[72px]">
            <div
              className="glass-ios glow-cyan"
              style={{
                width: "min(980px, 92vw)",
                padding: "56px 58px",
                textAlign: "left",
              }}
            >
              {/* mouse-follow spectral sweep (cyan/teal only) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: 24,
                  background:
                    `radial-gradient(760px 420px at ${hx}% ${hy}%, rgba(0,180,255,${0.10 + energy * 0.18}), rgba(0,0,0,0) 66%),` +
                    `radial-gradient(820px 520px at 72% 72%, rgba(2,167,202,${0.08 + energy * 0.14}), rgba(0,0,0,0) 72%)`,
                  mixBlendMode: "screen",
                  filter: "blur(0.35px)",
                  opacity: 0.85,
                }}
              />

              <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/50">
                EVIDENCE · AUTOMATION · OPERATIONS
              </div>

              <div className="mt-5 font-black text-[56px] leading-[1.02] tracking-[-0.02em] text-white/90">
                Ingeniería que
                <br />
                <span className="text-white/70">opera el futuro</span>
              </div>

              <div className="mt-4 max-w-[740px] text-[18px] leading-relaxed text-white/60">
                No vendemos humo. Diseñamos sistemas que dejan{" "}
                <span className="text-white/80 font-semibold">evidencia</span>, reducen fricción y
                convierten operación real en trazabilidad.
              </div>

              <div className="mt-7 h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["MODE", "RTS / DECK"],
                  ["LAYER", "LIQUID GLASS (DISCIPLINE)"],
                  ["TARGET", "INDUSTRIAL / TRANSNATIONAL"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-full px-4 py-2 border border-white/10 bg-white/5"
                    style={{
                      backdropFilter: "blur(18px) saturate(1.45)",
                      WebkitBackdropFilter: "blur(18px) saturate(1.45)",
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
                      {k}: <span className="text-white/70">{v}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between gap-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/35">
                  HITECH // RTS DECK
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/35">
                  SPACE / ENTER → NEXT
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-0 right-0 bottom-0 px-[42px] py-[28px]">
            <NavArea prev={prevSlide} next={nextSlide} />
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 160px rgba(0,0,0,0.22)",
          }}
        />
      </div>
    </SlideContainer>
  );
};
