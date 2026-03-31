import { Suspense } from "react";
import { BuilderDemo } from "@/components/builder/builder-demo";

function BuilderFallback() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
      Loading builder…
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background text-foreground">
      <Suspense fallback={<BuilderFallback />}>
        <BuilderDemo />
      </Suspense>
    </div>
  );
}
