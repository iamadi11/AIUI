import { BuilderDemo } from "@/components/builder/builder-demo";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">AIUI</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Builder + Universal JSON DSL
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Phase 1: document model aligned with the shared Zod schema, Zustand for
            the live tree and selection, and a draggable palette onto a canvas with
            nested drop targets.
          </p>
        </div>

        <BuilderDemo />

        <div className="flex flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Next: inspector, undo/redo, preview route, golden JSON export.
          </p>
        </div>
      </main>
    </div>
  );
}
