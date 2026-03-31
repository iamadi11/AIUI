"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { useDocumentStore } from "@/stores/document-store";
import { useCallback, useRef, useState } from "react";
import {
  copyGoldenJsonToClipboard,
  downloadGoldenJsonFile,
  importGoldenJsonFromText,
  inspectJsonFileText,
} from "./golden-document-export";

export function useGoldenDocumentExport(document: AiuiDocument) {
  const setDocument = useDocumentStore((s) => s.setDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    document: AiuiDocument;
    warnings: string[];
    originalVersion: string | null;
    migratedVersion: string;
  } | null>(null);
  const noticeTimer = useRef(0);

  const flash = useCallback((msg: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2500);
  }, []);

  const handleExportDownload = useCallback(() => {
    setError(null);
    const r = downloadGoldenJsonFile(document);
    if (!r.ok) {
      setError(r.message ?? "Export failed.");
      return;
    }
    flash("Downloaded validated JSON.");
  }, [document, flash]);

  const handleCopy = useCallback(async () => {
    setError(null);
    const r = await copyGoldenJsonToClipboard(document);
    if (!r.ok) {
      setError(r.message ?? "Copy failed.");
      return;
    }
    flash("Copied validated JSON to clipboard.");
  }, [document, flash]);

  const handlePickFile = useCallback(() => {
    setError(null);
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setPendingImport(null);
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const inspected = inspectJsonFileText(text);
        if (!inspected.ok) {
          setError(inspected.message);
          return;
        }
        if (inspected.inspection.kind === "needsMigration") {
          const i = inspected.inspection;
          setPendingImport({
            document: i.document,
            warnings: i.warnings,
            originalVersion: i.originalVersion,
            migratedVersion: i.migratedVersion,
          });
          return;
        }
        const r = importGoldenJsonFromText(inspected.inspection.text);
        if (!r.ok) {
          setError(r.message);
          return;
        }
        setDocument(r.document);
        flash("Imported document (history cleared).");
      } catch {
        setError("Could not read file.");
      }
    },
    [flash, setDocument],
  );

  const applyPendingImport = useCallback(() => {
    if (!pendingImport) return;
    setDocument(pendingImport.document);
    setPendingImport(null);
    flash("Migrated and imported document (history cleared).");
  }, [flash, pendingImport, setDocument]);

  const cancelPendingImport = useCallback(() => {
    setPendingImport(null);
  }, []);

  return {
    error,
    notice,
    pendingImport,
    handleExportDownload,
    handleCopy,
    handlePickFile,
    onFileChange,
    applyPendingImport,
    cancelPendingImport,
    fileInputRef,
  };
}
