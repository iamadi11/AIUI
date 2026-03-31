"use client";

import { safeParseDocument } from "@aiui/dsl-schema";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RuntimePreview } from "@/components/preview/runtime-preview";
import { buttonVariants } from "@/components/ui/button";
import {
  VIEWPORT_PRESETS,
  getViewportPreset,
  type ViewportPresetId,
} from "@/lib/builder/viewport-presets";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { useState } from "react";

export default function PreviewPage() {
  const document = useDocumentStore((s) => s.document);
  const parsed = safeParseDocument(document);
  const [viewportId, setViewportId] = useState<ViewportPresetId>("desktop");
  const viewport = getViewportPreset(viewportId);
  const searchParams = useSearchParams();
  const developerMode = searchParams.get("dev") === "1";

  if (!developerMode) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        <main className="flex w-full flex-1 flex-col">
          <div className="flex justify-end px-4 py-3">
            <Link
              href="/?dev=1"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open builder controls
            </Link>
          </div>
          <div className="flex-1 px-0 pb-0 pt-1">
            <RuntimePreview
              document={document}
              viewport={viewport}
              hideChrome
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">AIUI</p>
            <h1 className="text-lg font-semibold tracking-tight">Preview (Developer mode)</h1>
            <p className="text-sm text-muted-foreground">
              Runtime preview uses <code className="font-mono text-xs">@aiui/runtime-core</code>
              ; the React panel below is a dev host via{" "}
              <code className="font-mono text-xs">@aiui/registry</code>. Same in-memory document
              as the builder.
            </p>
          </div>
          <Link
            href="/preview"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Hide preview chrome
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
          <span>
            DSL <span className="font-mono text-foreground">{document.version}</span>
          </span>
          {parsed.success ? (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
              Valid against schema
            </span>
          ) : (
            <span className="rounded-md bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
              Schema validation failed
            </span>
          )}
        </div>

        {!parsed.success ? (
          <pre className="max-h-48 overflow-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {JSON.stringify(parsed.error.flatten(), null, 2)}
          </pre>
        ) : null}

        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Runtime preview (DOM)
            </h2>
            <div className="ml-auto flex flex-wrap gap-1">
              {VIEWPORT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs transition-colors",
                    preset.id === viewportId
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                  title={preset.description}
                  onClick={() => setViewportId(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {viewport.description}
          </h2>
          <RuntimePreview document={document} viewport={viewport} />
        </section>
      </main>
    </div>
  );
}
