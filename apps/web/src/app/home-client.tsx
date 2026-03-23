"use client";

import dynamic from "next/dynamic";

const Playground = dynamic(() => import("@/components/playground"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-dvh bg-background"
      aria-busy="true"
      aria-label="Loading playground"
    >
      <div className="h-14 animate-pulse border-b border-border/60 bg-background/80" />
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="h-8 w-48 rounded-md bg-muted" />
          <div className="h-4 w-72 rounded-md bg-muted/60" />
        </div>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="h-[320px] rounded-xl bg-muted/40 lg:col-span-4" />
          <div className="h-[480px] rounded-xl bg-muted/30 lg:col-span-8" />
        </div>
      </div>
    </div>
  ),
});

export function HomeClient() {
  return <Playground />;
}
