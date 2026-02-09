import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WOW_AI_MOMENT, WOW_DEMO, WOW_REVEAL, WOW_TOUR, WOW_XRAY } from '../config/wow';
import { usePrefersReducedMotion } from '../wow';
import { AI_CHAT_FIXTURES } from '../wow/fixtures/aiChatFixtures';
import { emitTourEvent } from '../wow/tour';

type Message = {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
  xray?: string;
};

type Mode = 'chat' | 'fast' | 'think' | 'search' | 'voice';

type GeminiPayload = {
  text?: unknown;
  sources?: unknown;
  error?: unknown;
};

const MAX_INPUT_LENGTH = 8000;
const MAX_OUTPUT_LENGTH = 12000;
const REQUEST_TIMEOUT_MS = 35000;

function parseEnvFlag(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function isVoiceEnabled(): boolean {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
  return parseEnvFlag(env?.VITE_ENABLE_VOICE);
}

const FILLER_WORDS = new Set([
  'please', 'pls', 'just', 'actually', 'maybe', 'kindly', 'could', 'would', 'can', 'you', 'i', 'me', 'my',
  'tell', 'explain', 'show', 'about', 'like', 'know', 'understand', 'help', 'with', 'for', 'the', 'a', 'an'
]);

function buildXrayReframe(input: string): string {
  const clean = sanitizeText(input, '').replace(/\s+/g, ' ').trim();
  if (clean.length < 12) return '';

  const words = clean
    .replace(/[^\p{L}\p{N}\s?]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const filtered = words.filter((word, idx) => {
    const lower = word.toLowerCase();
    if (idx === 0 && (lower === 'how' || lower === 'what' || lower === 'why' || lower === 'when')) return true;
    return !FILLER_WORDS.has(lower);
  });

  const compact = (filtered.length >= 3 ? filtered : words).join(' ').trim();
  if (compact.length < 8) return '';

  const singleQuestion = compact.endsWith('?') ? compact : `${compact}?`;
  return singleQuestion.length > 90 ? `${singleQuestion.slice(0, 89).trimEnd()}?` : singleQuestion;
}

function RevealText({ text, enabled }: { text: string; enabled: boolean }) {
  const [length, setLength] = useState(enabled ? 0 : text.length);

  useEffect(() => {
    if (!enabled) {
      setLength(text.length);
      return;
    }

    setLength(0);
    let frame = 0;
    const tick = () => {
      frame += 1;
      setLength((prev) => {
        const next = Math.min(text.length, prev + Math.max(6, Math.ceil(text.length / 40)));
        return next;
      });
      if (frame < 55) {
        window.setTimeout(tick, 17);
      }
    };

    const starter = window.setTimeout(tick, 30);
    return () => window.clearTimeout(starter);
  }, [enabled, text]);

  return <p className="whitespace-pre-wrap break-words">{text.slice(0, length)}</p>;
}

function clampTextLength(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[respuesta truncada por seguridad]`;
}

function sanitizeText(raw: unknown, fallback = ''): string {
  const safeInput = typeof raw === 'string' ? raw : fallback;
  const wellFormed = typeof (safeInput as any).toWellFormed === 'function'
    ? (safeInput as any).toWellFormed()
    : safeInput;

  // Security decision: render only plain text. This strips control chars and blocks HTML/script injection paths.
  const withoutControls = wellFormed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  const normalized = withoutControls.replace(/\r\n?/g, '\n').trim();
  return clampTextLength(normalized, MAX_OUTPUT_LENGTH);
}

function coerceSources(raw: unknown): { title: string; uri: string }[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const title = sanitizeText((item as { title?: unknown })?.title, 'Fuente');
      const uri = sanitizeText((item as { uri?: unknown })?.uri, '');
      if (!uri) return null;
      return { title: title || 'Fuente', uri };
    })
    .filter((item): item is { title: string; uri: string } => item !== null);
}

type InvestorSections = {
  answer: string;
  why: string;
  next: string;
};

function buildInvestorSections(text: string): InvestorSections {
  const safe = sanitizeText(text, '').trim();
  const lines = safe.split('\n').map((line) => line.trim()).filter(Boolean);

  const findLabel = (labels: string[]): string => {
    const labelMatch = lines.find((line) => {
      const normalized = line.toLowerCase();
      return labels.some((label) => normalized.startsWith(`${label}:`) || normalized.startsWith(`${label} -`));
    });
    if (!labelMatch) return '';
    return labelMatch.replace(/^[^:]+:\s*/u, '').replace(/^[^-]+-\s*/u, '').trim();
  };

  const bulletLines = lines
    .filter((line) => /^([•*-]|\d+[.)])\s+/u.test(line))
    .map((line) => line.replace(/^([•*-]|\d+[.)])\s+/u, '').trim());

  const prose = safe
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const answer = findLabel(['answer', 'summary', 'resumen']) || bulletLines[0] || prose[0] || 'Sin respuesta clara.';
  const why = findLabel(['why', 'porque', 'por qué', 'impact']) || bulletLines[1] || prose[1] || 'Impacta directamente riesgo, velocidad de ejecución y defensibilidad ante auditoría.';
  const next = findLabel(['next', 'siguiente', 'action', 'accion']) || bulletLines[2] || prose[2] || 'Siguiente paso: definir métrica base y objetivo de 30/60 días para validar impacto.';
  return { answer, why, next };
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text:
        'HITECH CORE v2.2 listo. Soy el sistema de IA de HITECH RTS: te explico negocio, tecnica y retorno sobre inversion en espanol claro. Que quieres analizar primero: riesgo, dinero u operacion?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  const [tourPasteQuestion, setTourPasteQuestion] = useState('');
  const [tourStepRunning, setTourStepRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceEnabled = useMemo(() => isVoiceEnabled(), []);
  const reducedMotion = usePrefersReducedMotion();
  const wowAiMoment = WOW_DEMO && WOW_AI_MOMENT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendModelMessage = (text: unknown, sources: unknown = [], xray = '') => {
    const safeText = sanitizeText(text, 'No response generated.') || 'No response generated.';
    const safeSources = coerceSources(sources);
    setMessages((prev) => [...prev, { role: 'model', text: safeText, sources: safeSources, xray }]);
    emitTourEvent('ai:response', { len: safeText.length });
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('wow:ai-mode', { detail: { mode } }));
  }, [mode]);

  useEffect(() => {
    const onPaste = (event: Event) => {
      const custom = event as CustomEvent<{ text?: string }>;
      const text = sanitizeText(custom.detail?.text, '');
      if (!text) return;
      setInput(text);
    };
    const onStep = (event: Event) => {
      const custom = event as CustomEvent<{ pasteQuestion?: string; running?: boolean }>;
      setTourPasteQuestion(sanitizeText(custom.detail?.pasteQuestion, ''));
      setTourStepRunning(!!custom.detail?.running);
    };

    window.addEventListener('wow:tour-paste', onPaste as EventListener);
    window.addEventListener('wow:tour-step', onStep as EventListener);
    return () => {
      window.removeEventListener('wow:tour-paste', onPaste as EventListener);
      window.removeEventListener('wow:tour-step', onStep as EventListener);
    };
  }, []);

  const handleSend = async () => {
    const userMsg = sanitizeText(input, '');
    if (!userMsg || isLoading) return;

    if (userMsg.length > MAX_INPUT_LENGTH) {
      appendModelMessage(`Tu mensaje excede ${MAX_INPUT_LENGTH} caracteres. Reduce el texto e intenta de nuevo.`);
      return;
    }

    if (mode === 'voice' && !voiceEnabled) {
      appendModelMessage('Voice mode esta deshabilitado por configuracion. Activa VITE_ENABLE_VOICE=true para habilitarlo con una integracion segura de backend.');
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    emitTourEvent('ai:sent');
    setIsLoading(true);

    const ctrl = new AbortController();
    const timeoutId = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

    try {
      const resp = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, message: userMsg }),
        signal: ctrl.signal,
      });

      let payload: GeminiPayload = {};
      try {
        payload = (await resp.json()) as GeminiPayload;
      } catch {
        payload = {};
      }

      if (!resp.ok) {
        const serverError = sanitizeText(payload.error, `Server request failed (${resp.status})`);
        throw new Error(serverError || `Server request failed (${resp.status})`);
      }

      const text = sanitizeText(payload.text, 'No response generated.');
      if (!text) {
        appendModelMessage('No se recibio contenido util del modelo. Intenta de nuevo.');
        return;
      }

      const xray = WOW_DEMO && WOW_XRAY ? buildXrayReframe(userMsg) : '';
      appendModelMessage(text, payload.sources, xray);
    } catch (error) {
      const err = error as Error;
      const text = err.name === 'AbortError'
        ? 'La solicitud tardo demasiado y fue cancelada. Intenta de nuevo con una pregunta mas corta.'
        : sanitizeText(err.message, 'No se pudo conectar con el servicio de IA. Verifica que el servidor local este ejecutandose.');
      appendModelMessage(text);
    } finally {
      window.clearTimeout(timeoutId);
      ctrl.abort();
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (!voiceEnabled) {
      appendModelMessage('Voice mode no esta disponible en este entorno. Configura VITE_ENABLE_VOICE=true y backend de voz seguro para habilitarlo.');
      return;
    }

    appendModelMessage('Voice mode esta habilitado por bandera, pero esta build no incluye transporte de audio seguro. Usa chat/fast/think/search.');
  };

  const applyFixture = (fixtureId: string) => {
    const fixture = AI_CHAT_FIXTURES.find((item) => item.id === fixtureId);
    if (!fixture || isLoading) return;

    const prompt = sanitizeText(fixture.prompt, '');
    const response = sanitizeText(fixture.response, '');
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: prompt },
      { role: 'model', text: response },
    ]);
  };

  return (
    <>
      <button
        data-testid="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-cyan/10 border-2 border-cyan/80 rounded-full flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(0,240,255,0.45)] hover:bg-cyan hover:text-black transition-all duration-300 z-50 group"
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      >
        {isOpen ? '✖' : '🤖'}
      </button>

      {isOpen && (
        <div data-testid="chat-window" className="wow-chat-window fixed bottom-28 right-8 w-[400px] h-[600px] bg-panel border border-cyan/45 rounded-xl flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-50 animate-fade-up">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50 rounded-t-lg">
            <h3 className="font-display font-bold text-white tracking-wider">HITECH AI</h3>
            <div className="flex gap-2">
              <select
                data-testid="chat-mode"
                className="bg-black border border-cyan/50 text-cyan text-xs p-1 rounded font-code uppercase"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                aria-label="AI mode selector"
              >
                <option value="chat">Chat (Pro 3)</option>
                <option value="fast">Fast (Flash Lite)</option>
                <option value="think">Think (Reasoning)</option>
                <option value="search">Search (Google)</option>
                <option value="voice">Voice (Live{voiceEnabled ? ' ON' : ' OFF'})</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-main">
            {WOW_DEMO && (
              <div className="rounded-lg border border-cyan/25 bg-cyan/10 p-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan/80">QA fixtures</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AI_CHAT_FIXTURES.map((fixture) => (
                    <button
                      key={fixture.id}
                      type="button"
                      onClick={() => applyFixture(fixture.id)}
                      disabled={isLoading}
                      className="rounded border border-cyan/30 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan/90 hover:bg-cyan/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {fixture.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div data-testid={`chat-msg-${m.role}`} className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${m.role === 'user' ? 'bg-cyan/20 border border-cyan/30 text-white' : 'bg-white/10 border border-white/20 text-gray-200'}`}>
                  {m.role === 'model' && m.xray ? (
                    <p className="mb-2 text-[11px] uppercase tracking-[0.09em] text-cyan/80">
                      What you&apos;re actually asking is: {m.xray}
                    </p>
                  ) : null}
                  {m.role === 'model' && wowAiMoment ? (
                    (() => {
                      const sections = buildInvestorSections(m.text);
                      const shouldCollapse = m.text.length > 520;
                      const expanded = !!expandedMessages[i];
                      return (
                        <div className="space-y-2">
                          <div className="rounded-md border border-cyan/30 bg-cyan/10 px-2 py-1">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan/80">One-line answer</div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-white">{sections.answer}</p>
                          </div>
                          <div className="rounded-md border border-white/15 bg-white/5 px-2 py-1">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/70">Why it matters</div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-gray-200">{sections.why}</p>
                          </div>
                          <div className="rounded-md border border-gold/35 bg-gold/10 px-2 py-1">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-gold/90">Next action / metric</div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-gray-100">{sections.next}</p>
                          </div>
                          {(expanded || !shouldCollapse) && (
                            <div className={`rounded-md border border-white/10 bg-black/20 px-2 py-1 ${reducedMotion ? '' : 'transition-all duration-200'}`}>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-white/55">Full response</div>
                              <p className="mt-1 whitespace-pre-wrap break-words">{m.text}</p>
                            </div>
                          )}
                          {shouldCollapse && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedMessages((prev) => ({ ...prev, [i]: !expanded }))
                              }
                              className="text-xs uppercase tracking-[0.14em] text-cyan/80 hover:text-cyan"
                            >
                              {expanded ? 'Collapse' : 'Expand'}
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : m.role === 'model' ? (
                    <RevealText text={m.text} enabled={WOW_DEMO && WOW_REVEAL && !reducedMotion} />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  )}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400 max-w-[85%]">
                    <span className="font-bold text-gold">SOURCES:</span>
                    <ul className="list-disc pl-4 mt-1">
                      {m.sources.map((s, idx) => (
                        <li key={idx}><a href={s.uri} target="_blank" rel="noopener noreferrer" className="hover:text-cyan underline truncate block">{s.title}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="text-cyan text-xs font-code animate-pulse">PROCESSING...</div>}
            {!isLoading && messages.length === 0 && <div className="text-gray-400 text-xs">No messages yet.</div>}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="p-4 border-t border-white/10 bg-black/40 rounded-b-lg">
            {mode === 'voice' ? (
              <>
                <button
                  data-testid="chat-voice-btn"
                  onClick={handleVoiceToggle}
                  className="w-full py-3 font-display font-bold tracking-widest border rounded transition-all bg-cyan/20 border-cyan text-cyan hover:bg-cyan hover:text-black disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-disabled={!voiceEnabled}
                >
                  {voiceEnabled ? 'VOICE MODE LIMITED' : 'VOICE MODE UNAVAILABLE'}
                </button>
                {!voiceEnabled && (
                  <p className="mt-2 text-xs text-amber-300">Voice is disabled by environment policy (VITE_ENABLE_VOICE=false).</p>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  data-testid="chat-input"
                  type="text"
                  value={input}
                  maxLength={MAX_INPUT_LENGTH}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask HITECH system..."
                  className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-cyan outline-none font-code"
                />
                <button
                  data-testid="chat-send"
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-gold/20 border border-gold text-gold px-4 py-2 rounded hover:bg-gold hover:text-black transition-all font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  ➤
                </button>
              </div>
            )}
            {WOW_DEMO && WOW_TOUR && tourStepRunning && tourPasteQuestion && mode !== 'voice' && (
              <button
                type="button"
                onClick={() => setInput(tourPasteQuestion)}
                className="mt-2 w-full rounded border border-cyan/35 bg-cyan/12 px-2 py-2 text-[10px] uppercase tracking-[0.16em] text-cyan/90 hover:bg-cyan/20"
              >
                Paste question
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
