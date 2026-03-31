"use client";

import { safeParseDocument } from "@aiui/dsl-schema";
import Link from "next/link";
import { RuntimePreview } from "@/components/preview/runtime-preview";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";

export default function PreviewPage() {
  const document = useDocumentStore((s) => s.document);
  const parsed = safeParseDocument(document);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">AIUI</p>
            <h1 className="text-lg font-semibold tracking-tight">Preview</h1>
            <p className="text-sm text-muted-foreground">
              Runtime preview uses <code className="font-mono text-xs">@aiui/runtime-core</code>
              ; the React panel below is a dev host via{" "}
              <code className="font-mono text-xs">@aiui/registry</code>. Same in-memory document
              as the builder.
            </p>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            ← Builder
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
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Runtime preview (DOM)
          </h2>
          <RuntimePreview document={document} />
        </section>
      </main>
    </div>
  );
}
