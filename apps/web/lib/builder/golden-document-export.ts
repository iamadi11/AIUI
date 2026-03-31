import type { AiuiDocument } from "@aiui/dsl-schema";
import {
  exportGoldenJson,
  importGoldenJson,
  inspectGoldenJsonImport,
} from "@aiui/dsl-schema";

export function downloadGoldenJsonFile(doc: AiuiDocument): {
  ok: boolean;
  message?: string;
} {
  const r = exportGoldenJson(doc);
  if (!r.ok) return { ok: false, message: r.message };
  const blob = new Blob([r.json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = goldenExportFilename(r.document);
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}

export function goldenExportFilename(doc: AiuiDocument): string {
  const safe = doc.version.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `aiui-document-${safe}.json`;
}

export async function copyGoldenJsonToClipboard(
  doc: AiuiDocument,
): Promise<{ ok: boolean; message?: string }> {
  const r = exportGoldenJson(doc);
  if (!r.ok) return { ok: false, message: r.message };
  try {
    await navigator.clipboard.writeText(r.json);
    return { ok: true };
  } catch {
    return { ok: false, message: "Clipboard write failed (permission denied)." };
  }
}

export type ImportInspection =
  | { kind: "ready"; text: string }
  | {
      kind: "needsMigration";
      document: AiuiDocument;
      warnings: string[];
      originalVersion: string | null;
      migratedVersion: string;
    };

export function inspectJsonFileText(text: string):
  | { ok: true; inspection: ImportInspection }
  | { ok: false; message: string } {
  const inspected = inspectGoldenJsonImport(text);
  if (!inspected.ok) return { ok: false, message: inspected.message };
  if (inspected.requiresMigration) {
    return {
      ok: true,
      inspection: {
        kind: "needsMigration",
        document: inspected.document,
        warnings: inspected.warnings,
        originalVersion: inspected.originalVersion,
        migratedVersion: inspected.migratedVersion,
      },
    };
  }
  return { ok: true, inspection: { kind: "ready", text } };
}

export function importGoldenJsonFromText(text: string):
  | { ok: true; document: AiuiDocument }
  | { ok: false; message: string } {
  return importGoldenJson(text);
}
