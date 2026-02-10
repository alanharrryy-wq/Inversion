import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import { config as dotenvConfig } from "dotenv";
import { randomUUID } from "node:crypto";

dotenvConfig({ path: ".env.local" });

const PORT = Number(process.env.PORT || 8787);
const AI_ROUTE_PATH = "/api/ai";
const MAX_MESSAGE_LENGTH = 8000;
const REQUEST_TIMEOUT_MS = 30000;
const MODEL_FLASH = process.env.AI_MODEL_FAST || "gemini-1.5-flash";
const MODEL_PRO = process.env.AI_MODEL_THINK || "gemini-1.5-pro";

const HITECH_SYSTEM_PROMPT = `
ERES EL SISTEMA DE IA DE HITECH RTS (HITECH CORE AI).
Tu objetivo es asistir a inversores y usuarios explicando la propuesta de valor, tecnica y comercial de HITECH RTS con precision, foco en ROI y mitigacion de riesgo.
Cuando hables de diagnostico usa conceptos de Condition Score (CS), Risk Index (RI), DE/DT/DCtrl/DM/DOH y recomendaciones accionables.
`;

type Mode = "chat" | "fast" | "think" | "search" | "voice";

type AiRequest = {
  mode?: Mode;
  message?: string;
};

type AiError = {
  name?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  cause?: unknown;
};

function parseEnvFlag(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

const DEMO_TEST_MODE = parseEnvFlag(process.env.DEMO_TEST_MODE);
const AI_BACKEND_ENABLED = parseEnvFlag(process.env.ENABLE_AI_BACKEND);
const PROVIDER_API_KEY = process.env.AI_BACKEND_API_KEY || process.env.GEMINI_API_KEY;

function logInfo(scope: string, message: string, extra?: unknown) {
  if (typeof extra === "undefined") {
    console.log(`[server:${scope}] ${message}`);
    return;
  }
  console.log(`[server:${scope}] ${message}`, extra);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Upstream timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

function sanitizeMessage(input: string): string {
  return input.replace(/\0/g, "").trim();
}

function sanitizePreview(input: string): string {
  return input.slice(0, 80).replace(/\s+/g, " ");
}

function isAiConfigured(key: string | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed.toUpperCase().includes("PLACEHOLDER")) return false;
  if (trimmed.length < 20) return false;
  return true;
}

function pickMode(rawMode: unknown): Mode {
  return rawMode === "fast" || rawMode === "think" || rawMode === "search" || rawMode === "voice" ? rawMode : "chat";
}

function sanitizeError(error: unknown): AiError {
  const err = error as AiError;
  const causeText = typeof err?.cause === "string"
    ? err.cause.slice(0, 160)
    : err?.cause instanceof Error
      ? `${err.cause.name}: ${err.cause.message}`.slice(0, 160)
      : undefined;

  return {
    name: err?.name ?? "UnknownError",
    message: (err?.message ?? "no message").slice(0, 240),
    status: typeof err?.status === "number" ? err.status : undefined,
    statusCode: typeof err?.statusCode === "number" ? err.statusCode : undefined,
    cause: causeText,
  };
}

function modelForMode(mode: Mode): string {
  if (mode === "think") return MODEL_PRO;
  return MODEL_FLASH;
}

function configForMode(mode: Mode) {
  if (mode === "think") {
    return {
      systemInstruction: HITECH_SYSTEM_PROMPT,
      thinkingConfig: { thinkingBudget: 32768 },
    };
  }

  if (mode === "search") {
    return {
      systemInstruction:
        HITECH_SYSTEM_PROMPT +
        " Si se requiere, usa busqueda web para datos recientes de costos, mantenimiento y mercado.",
      tools: [{ googleSearch: {} }],
    };
  }

  return { systemInstruction: HITECH_SYSTEM_PROMPT };
}

function extractSources(response: any): { title: string; uri: string }[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];

  return chunks
    .map((chunk: any) => chunk?.web)
    .filter((web: any) => web && typeof web.uri === "string")
    .map((web: any) => ({
      title: String(web.title || web.uri),
      uri: String(web.uri),
    }));
}

function deterministicStub(mode: Mode, message: string, reason: string) {
  const preview = sanitizePreview(message).slice(0, 42);
  return {
    text: `[AI_BACKEND:${reason}] mode=${mode} input="${preview || "ok"}"`,
    sources: [] as { title: string; uri: string }[],
  };
}

const AI_CONFIGURED = AI_BACKEND_ENABLED && isAiConfigured(PROVIDER_API_KEY);
const ai = AI_CONFIGURED ? new GoogleGenAI({ apiKey: PROVIDER_API_KEY! }) : null;

const app = express();

app.use(express.json({ limit: "20kb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Try again in a minute." },
  })
);

logInfo(
  "startup",
  `aiRoute=${AI_ROUTE_PATH} backendEnabled=${AI_BACKEND_ENABLED} demoTestMode=${DEMO_TEST_MODE} aiConfigured=${AI_CONFIGURED} keyPresent=${Boolean(PROVIDER_API_KEY)} keyLen=${PROVIDER_API_KEY?.length ?? 0} models={fast:${MODEL_FLASH},think:${MODEL_PRO}}`
);

if (!AI_BACKEND_ENABLED) {
  logInfo("startup", "ENABLE_AI_BACKEND is disabled (default). Serving deterministic offline responses.");
}
if (AI_BACKEND_ENABLED && !isAiConfigured(PROVIDER_API_KEY)) {
  logInfo("startup", "AI backend enabled but provider key is missing/invalid. Serving deterministic offline responses.");
}
if (DEMO_TEST_MODE) {
  logInfo("startup", "DEMO_TEST_MODE enabled. Forcing deterministic stub responses.");
}

app.get("/api/health", (_req: Request, res: Response) => {
  return res.json({
    ok: true,
    aiConfigured: AI_CONFIGURED,
    aiBackendEnabled: AI_BACKEND_ENABLED,
    demoTestMode: DEMO_TEST_MODE,
  });
});

app.post(AI_ROUTE_PATH, async (req: Request<unknown, unknown, AiRequest>, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const bodyKeys = body ? Object.keys(body) : [];
    const allowedKeys = new Set(["mode", "message"]);
    if (bodyKeys.some((k) => !allowedKeys.has(k))) {
      return res.status(400).json({ error: "invalid request shape" });
    }

    const rawMode = body?.mode;
    const rawMessage = req.body?.message;
    const mode = pickMode(rawMode);

    if (typeof rawMessage !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const message = sanitizeMessage(rawMessage);
    if (!message) {
      return res.status(400).json({ error: "message cannot be empty" });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(413).json({ error: `message is too long (max ${MAX_MESSAGE_LENGTH})` });
    }

    if (DEMO_TEST_MODE) {
      logInfo("ai", "stub_response_demo_mode", { requestId, mode, durationMs: Date.now() - startedAt });
      return res.json(deterministicStub(mode, message, "demo_test_mode"));
    }

    if (!AI_BACKEND_ENABLED) {
      logInfo("ai", "stub_response_backend_disabled", { requestId, mode, durationMs: Date.now() - startedAt });
      return res.json(deterministicStub(mode, message, "backend_disabled"));
    }

    if (!ai) {
      logInfo("ai", "stub_response_not_configured", { requestId, mode, durationMs: Date.now() - startedAt });
      return res.json(deterministicStub(mode, message, "not_configured"));
    }

    const effectiveMode: Mode = mode === "voice" ? "chat" : mode;
    const model = modelForMode(effectiveMode);

    logInfo("ai", "request", {
      requestId,
      mode: effectiveMode,
      model,
      chars: message.length,
      preview: `${sanitizePreview(message)}${message.length > 80 ? "..." : ""}`,
    });

    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: message,
        config: configForMode(effectiveMode),
      }),
      REQUEST_TIMEOUT_MS
    );

    const text = String(response.text || "No response generated.");
    const sources = effectiveMode === "search" ? extractSources(response) : [];

    logInfo("ai", "response", {
      requestId,
      mode: effectiveMode,
      model,
      durationMs: Date.now() - startedAt,
      upstreamStatus: 200,
      textChars: text.length,
      sources: sources.length,
    });

    return res.json({ text, sources });
  } catch (error) {
    const safeError = sanitizeError(error);
    logInfo("ai", "request_error", {
      requestId,
      durationMs: Date.now() - startedAt,
      ...safeError,
    });
    return next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const err = sanitizeError(error);
  logInfo("error", "unhandled", {
    name: err.name,
    message: err.message,
    status: err.status ?? null,
    statusCode: err.statusCode ?? null,
    cause: err.cause ?? null,
  });
  return res.status(500).json({ error: "Request failed. Please try again." });
});

app.listen(PORT, () => {
  logInfo("startup", `listening on http://localhost:${PORT}`);
});
