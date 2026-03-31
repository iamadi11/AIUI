"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { exportGoldenJson, importGoldenJson } from "@/lib/dsl/golden-json";
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
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
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

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Golden export / import
      </p>
      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        Export runs <code className="font-mono text-[0.65rem]">safeParseDocument</code>{" "}
        so the file matches the shared Zod schema. Import replaces the document and
        clears undo history.
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
      {error ? (
        <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive whitespace-pre-wrap">
          {error}
        </pre>
      ) : null}
    </div>
  );
}
