import Link from "next/link";
import { BuilderDemo } from "@/components/builder/builder-demo";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">AIUI</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Builder + Universal JSON DSL
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Phase 1: document model and Zustand stores, palette and canvas,
            properties panel, undo/redo, and a live{" "}
            <Link
              href="/preview"
              className="text-primary underline-offset-4 hover:underline"
            >
              preview route
            </Link>{" "}
            that renders the same document with registry-driven React.
          </p>
        </div>

        <BuilderDemo />

        <div className="flex flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Next: golden JSON export (validated round-trip).
          </p>
        </div>
      </main>
    </div>
  );
}
