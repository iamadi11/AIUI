"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { exportGoldenJson, inspectGoldenJsonImport, importGoldenJson } from "@aiui/dsl-schema";
import { useDocumentStore } from "@/stores/document-store";
import { Button } from "@/components/ui/button";
import { Copy, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

function exportFilename(doc: AiuiDocument) {
  const safe = doc.version.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `aiui-document-${safe}.json`;
}

export function DocumentExportPanel(props: { document: AiuiDocument }) {
  const { document } = props;
  const setDocument = useDocumentStore((s) => s.setDocument);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    document: AiuiDocument;
    warnings: string[];
    originalVersion: string | null;
    migratedVersion: string;
  } | null>(null);
  const noticeTimer = useRef(0);

  function flash(msg: string) {
    window.clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2500);
  }

  function handleExportDownload() {
    setError(null);
    const r = exportGoldenJson(document);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    downloadTextFile(exportFilename(r.document), r.json);
    flash("Downloaded validated JSON.");
  }

  async function handleCopy() {
    setError(null);
    const r = exportGoldenJson(document);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    try {
      await navigator.clipboard.writeText(r.json);
      flash("Copied validated JSON to clipboard.");
    } catch {
      setError("Clipboard write failed (permission denied).");
    }
  }

  function handlePickFile() {
    setError(null);
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setPendingImport(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const inspected = inspectGoldenJsonImport(text);
      if (!inspected.ok) {
        setError(inspected.message);
        return;
      }
      if (inspected.requiresMigration) {
        setPendingImport({
          document: inspected.document,
          warnings: inspected.warnings,
          originalVersion: inspected.originalVersion,
          migratedVersion: inspected.migratedVersion,
        });
        return;
      }
      const r = importGoldenJson(text);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setDocument(r.document);
      flash("Imported document (history cleared).");
    } catch {
      setError("Could not read file.");
    }
  }

  function applyPendingImport() {
    if (!pendingImport) return;
    setDocument(pendingImport.document);
    setPendingImport(null);
    flash("Migrated and imported document (history cleared).");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Golden export / import
      </p>
      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        Export runs <code className="font-mono text-[0.65rem]">safeParseDocument</code>{" "}
        so the file matches the shared Zod schema. Import replaces the document and
        clears undo history. Older documents open a migration assistant before import.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleExportDownload}
        >
          <Download className="size-3.5" aria-hidden />
          Download JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void handleCopy()}
        >
          <Copy className="size-3.5" aria-hidden />
          Copy JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handlePickFile}
        >
          <Upload className="size-3.5" aria-hidden />
          Import JSON…
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => void onFileChange(e)}
        />
      </div>
      {notice ? (
        <p className="mt-2 text-xs font-medium text-primary" role="status">
          {notice}
        </p>
      ) : null}
      {pendingImport ? (
        <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-50/60 p-3">
          <p className="text-xs font-medium text-amber-900">Migration assistant</p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-amber-900/90">
            {pendingImport.originalVersion
              ? `This file uses DSL version ${pendingImport.originalVersion}.`
              : "This file has no explicit DSL version."}{" "}
            It will be migrated to {pendingImport.migratedVersion} before import.
          </p>
          {pendingImport.warnings.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {pendingImport.warnings.map((warning, i) => (
                <li
                  key={`${warning}-${i}`}
                  className="text-[0.68rem] leading-snug text-amber-900/90"
                >
                  - {warning}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyPendingImport}>
              Migrate and import
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingImport(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {error ? (
        <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive whitespace-pre-wrap">
          {error}
        </pre>
      ) : null}
    </div>
  );
}
