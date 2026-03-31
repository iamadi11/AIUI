"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { Button } from "@/components/ui/button";
import { useGoldenDocumentExport } from "@/lib/builder/use-golden-document-export";
import { msg } from "@/lib/i18n/messages";
import { Copy, Download, Upload } from "lucide-react";

export function PreviewExportToolbar(props: { document: AiuiDocument }) {
  const {
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
  } = useGoldenDocumentExport(props.document);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleExportDownload}
        >
          <Download className="size-3.5" aria-hidden />
          {msg("preview.downloadJson")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void handleCopy()}
        >
          <Copy className="size-3.5" aria-hidden />
          {msg("preview.copyJson")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handlePickFile}
        >
          <Upload className="size-3.5" aria-hidden />
          {msg("preview.importJson")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => void onFileChange(e)}
        />
      </div>
      {notice ? (
        <p className="text-xs font-medium text-primary" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="max-w-full truncate text-xs text-destructive" title={error}>
          {error}
        </p>
      ) : null}
      {pendingImport ? (
        <div className="w-full rounded-lg border border-amber-300/70 bg-amber-50/60 p-3 text-left">
          <p className="text-xs font-medium text-amber-900">
            {msg("preview.migrationTitle")}
          </p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-amber-900/90">
            {pendingImport.originalVersion
              ? msg("preview.migrationVersionLine", {
                  from: pendingImport.originalVersion,
                  to: pendingImport.migratedVersion,
                })
              : msg("preview.migrationNoVersion", {
                  to: pendingImport.migratedVersion,
                })}
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
              {msg("preview.migrationConfirm")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelPendingImport}
            >
              {msg("preview.migrationCancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
