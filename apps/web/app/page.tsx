import Link from "next/link";
import { BuilderDemo } from "@/components/builder/builder-demo";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16" aria-labelledby="builder-page-title">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">AIUI</p>
          <h1 id="builder-page-title" className="text-3xl font-semibold tracking-tight">
            Builder + Universal JSON DSL
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Phase 1–2 baseline: document model, builder, golden JSON, and the pure-TS{" "}
            <span className="text-foreground">layout engine</span> (debug rects below).
            Includes Zod-validated{" "}
            <span className="text-foreground">export/import</span> and a{" "}
            <Link
              href="/preview"
              className="text-primary underline-offset-4 hover:underline"
            >
              live preview
            </Link>{" "}
            driven by the shared registry.
          </p>
        </div>

        <BuilderDemo />

        <div className="flex flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Next: Phase 3 — logic (expressions, actions) or wire runtime to layout rects.
          </p>
        </div>
      </main>
    </div>
  );
}
