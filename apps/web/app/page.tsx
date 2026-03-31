import { Suspense } from "react";
import { BuilderDemo } from "@/components/builder/builder-demo";
import { BuilderLoadingFallback } from "@/components/builder/builder-loading-fallback";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background text-foreground">
      <Suspense fallback={<BuilderLoadingFallback />}>
        <BuilderDemo />
      </Suspense>
    </div>
  );
}
