import type {
  DiagnosticSeverity,
  RuntimeDiagnostic,
} from "@aiui/runtime-core";

export type IssueTelemetrySource =
  | "builder"
  | "runtime"
  | "export"
  | "layout"
  | "logic"
  | "schema";

export type IssueTelemetryCategory =
  | "binding"
  | "schema"
  | "action"
  | "layout"
  | "performance"
  | "security"
  | "runtime";

export type IssueTelemetryEnvelope = {
  issueId: string;
  source: IssueTelemetrySource;
  severity: DiagnosticSeverity;
  category: IssueTelemetryCategory;
  summary: string;
  userMessage: string;
  developerMessage: string;
  timestamp: string;
  documentVersion: string;
  contextRef: string;
  code?: string;
  nodeId?: string;
  details?: Record<string, unknown>;
  fingerprint: string;
};

type RedactableValue = Record<string, unknown> | unknown[] | unknown;

const REDACT_KEYS = [
  "token",
  "secret",
  "password",
  "authorization",
  "cookie",
  "session",
  "apiKey",
  "accessKey",
];

function randomId(prefix: string): string {
  try {
    return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  } catch {
    return `${prefix}_${Math.random().toString(36).slice(2, 14)}`;
  }
}

function shouldRedact(key: string): boolean {
  const lowered = key.toLowerCase();
  return REDACT_KEYS.some((needle) => lowered.includes(needle.toLowerCase()));
}

function redactValue(value: RedactableValue): RedactableValue {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      if (shouldRedact(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactValue(val);
      }
    }
    return out;
  }
  return value;
}

function classifyFromCode(code?: string): IssueTelemetryCategory {
  const normalized = (code ?? "").toUpperCase();
  if (normalized.includes("SCHEMA") || normalized.includes("DSL")) return "schema";
  if (normalized.includes("ACTION")) return "action";
  if (normalized.includes("LAYOUT")) return "layout";
  if (normalized.includes("BIND")) return "binding";
  if (normalized.includes("PERF")) return "performance";
  if (normalized.includes("SECURITY") || normalized.includes("REDACT")) return "security";
  return "runtime";
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  return String(value);
}

export function createIssueTelemetryEnvelope(input: {
  source: IssueTelemetrySource;
  severity: DiagnosticSeverity;
  summary: string;
  userMessage?: string;
  developerMessage?: string;
  documentVersion: string;
  category?: IssueTelemetryCategory;
  code?: string;
  nodeId?: string;
  details?: Record<string, unknown>;
}): IssueTelemetryEnvelope {
  const details = input.details
    ? (redactValue(input.details) as Record<string, unknown>)
    : undefined;
  const code = input.code?.trim();
  return {
    issueId: randomId("iss"),
    source: input.source,
    severity: input.severity,
    category: input.category ?? classifyFromCode(code),
    summary: input.summary,
    userMessage: input.userMessage ?? input.summary,
    developerMessage: input.developerMessage ?? input.summary,
    timestamp: new Date().toISOString(),
    documentVersion: input.documentVersion,
    contextRef: randomId("ctx"),
    code,
    nodeId: input.nodeId,
    details,
    fingerprint: [
      input.source,
      input.severity,
      code ?? "NO_CODE",
      input.nodeId ?? "NO_NODE",
      input.summary.trim(),
    ].join("|"),
  };
}

export function createRuntimeIssueTelemetryEnvelope(input: {
  diagnostic: RuntimeDiagnostic;
  documentVersion: string;
}): IssueTelemetryEnvelope {
  const diag = input.diagnostic;
  return createIssueTelemetryEnvelope({
    source: diag.source,
    severity: diag.severity,
    summary: diag.summary,
    userMessage: diag.summary,
    developerMessage: [
      diag.code ? `code=${diag.code}` : undefined,
      diag.nodeId ? `nodeId=${diag.nodeId}` : undefined,
      diag.details?.message ? `message=${safeString(diag.details.message)}` : undefined,
    ]
      .filter(Boolean)
      .join(" | "),
    documentVersion: input.documentVersion,
    category: classifyFromCode(diag.code),
    code: diag.code,
    nodeId: diag.nodeId,
    details: diag.details,
  });
}
