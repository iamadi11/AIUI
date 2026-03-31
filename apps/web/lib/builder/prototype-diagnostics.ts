import type { AiuiDocument } from "@aiui/dsl-schema";

export type PrototypeDiagnostic = {
  code: string;
  severity: "warn" | "error";
  message: string;
};

export function collectPrototypeDiagnostics(
  doc: AiuiDocument,
): PrototypeDiagnostic[] {
  const out: PrototypeDiagnostic[] = [];
  const screenIds = new Set(Object.keys(doc.screens));
  for (const e of doc.flowLayout?.edges ?? []) {
    if (!screenIds.has(e.source)) {
      out.push({
        code: "PROTOTYPE_EDGE_UNKNOWN_SOURCE",
        severity: "error",
        message: `Edge ${e.id} references missing screen "${e.source}".`,
      });
    }
    if (!screenIds.has(e.target)) {
      out.push({
        code: "PROTOTYPE_EDGE_UNKNOWN_TARGET",
        severity: "error",
        message: `Edge ${e.id} references missing screen "${e.target}".`,
      });
    }
  }
  for (const [id, def] of Object.entries(doc.screens)) {
    if (def.role === "modal" && id === doc.initialScreenId) {
      out.push({
        code: "MODAL_AS_INITIAL_SCREEN",
        severity: "warn",
        message: `Screen "${id}" is marked modal but is also the initial screen.`,
      });
    }
  }
  return out;
}
