import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import { WOW_DEMO, WOW_OPENING_CINEMA, WOW_OPENING_IMPACT } from "../../config/wow";
import { clamp, useOnceEffect, usePrefersReducedMotion, useStableTimeout } from "../../wow";

type Mouse = { x: number; y: number; vx: number; vy: number; t: number };

function useRafMouse(ref: React.RefObject<HTMLElement>, enabled = true) {
  const [m, setM] = useState<Mouse>({ x: 0.5, y: 0.5, vx: 0, vy: 0, t: 0 });
  const raf = useRef<number | null>(null);
  const last = useRef<{ x: number; y: number; ts: number }>({
    x: 0.5,
    y: 0.5,
    ts: performance.now(),
  });

  useEffect(() => {
    if (!enabled) return;
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
  }, [ref, enabled]);

  return m;
}

export const Slide00: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const wowOpeningCinema = WOW_DEMO && WOW_OPENING_CINEMA;
  const wowOpeningLegacy = WOW_DEMO && WOW_OPENING_IMPACT;
  const mouse = useRafMouse(shellRef, !wowOpeningCinema);
  const wowOpening = (wowOpeningLegacy || wowOpeningCinema) && !reducedMotion;
  const [cinemaBeat, setCinemaBeat] = useState<number>(
    wowOpeningCinema && !reducedMotion ? 0 : 3
  );
  const beatTimer = useStableTimeout();

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
  useOnceEffect(() => {
    return () => beatTimer.clear();
  }, [beatTimer]);

  useEffect(() => {
    if (!wowOpeningCinema || reducedMotion) {
      beatTimer.clear();
      setCinemaBeat(3);
      return;
    }
    let cancelled = false;
    const queueBeat = (targetBeat: number, delay: number) => {
      beatTimer.schedule(() => {
        if (cancelled) return;
        setCinemaBeat(targetBeat);
      }, delay);
    };

    setCinemaBeat(0);
    queueBeat(1, 480);
    const t2 = window.setTimeout(() => queueBeat(2, 0), 1700);
    const t3 = window.setTimeout(() => queueBeat(3, 0), 3200);
    return () => {
      cancelled = true;
      beatTimer.clear();
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [wowOpeningCinema, reducedMotion, beatTimer]);

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

          @keyframes s00_wow_grain {
            0% { transform: translate3d(0,0,0); }
            50% { transform: translate3d(-1%, 1%, 0); }
            100% { transform: translate3d(0,0,0); }
          }

          @keyframes s00_cinema_sweep {
            0% { transform: translateX(-35%) skewX(-10deg); opacity: 0; }
            22% { opacity: 0.2; }
            100% { transform: translateX(40%) skewX(-10deg); opacity: 0; }
          }
        `}</style>

        <div
          className="absolute inset-0"
          style={{
            transform: wowOpeningCinema
              ? "perspective(1600px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1.01)"
              : `perspective(1600px) translate3d(${cam.tx}px, ${cam.ty}px, 0) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) scale(1.01)`,
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

              <div className={`font-mono uppercase text-white/50 ${wowOpening ? "text-[10px] tracking-[0.38em]" : "text-[11px] tracking-[0.26em]"} ${wowOpeningCinema && cinemaBeat < 1 ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}>
                EVIDENCE · AUTOMATION · OPERATIONS
              </div>

              <div className={`mt-5 font-black text-[56px] leading-[1.02] tracking-[-0.02em] text-white/90 transition-all duration-700 ${wowOpeningCinema && cinemaBeat < 2 ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                Ingeniería que
                <br />
                <span className="text-white/70">opera el futuro</span>
              </div>

              {wowOpening && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    ["latency", "< 1.2s"],
                    ["traceability", "98.7%"],
                    ["ops confidence", "A+"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2 backdrop-blur-md">
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/45">{k}</div>
                      <div className="mt-1 text-[14px] font-semibold tracking-[0.08em] text-cyan/80">{v}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className={`mt-4 max-w-[740px] text-[18px] leading-relaxed text-white/60 transition-all duration-700 ${wowOpeningCinema && cinemaBeat < 3 ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
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

        {wowOpening && (
          <>
            {wowOpeningCinema && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(900px 480px at 52% -6%, rgba(255,255,255,0.12), transparent 58%), radial-gradient(1200px 800px at 50% 50%, transparent 40%, rgba(0,0,0,0.28) 100%)",
                }}
              />
            )}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.09]"
              style={{
                background:
                  "radial-gradient(900px 460px at 50% 0%, rgba(0,240,255,0.18), transparent 60%), radial-gradient(1200px 500px at 50% 100%, rgba(255,255,255,0.10), transparent 72%)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 4px)",
                animation: "s00_wow_grain 3.2s steps(2, end) infinite",
              }}
            />
            {wowOpeningCinema && !reducedMotion && cinemaBeat >= 1 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(98deg, transparent 22%, rgba(255,255,255,0.16) 48%, transparent 74%)",
                  mixBlendMode: "screen",
                  animation: "s00_cinema_sweep 900ms cubic-bezier(.24,.74,.24,1) 1",
                }}
              />
            )}
          </>
        )}
      </div>
    </SlideContainer>
  );
};
