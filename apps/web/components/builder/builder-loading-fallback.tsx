"use client";

import { msg } from "@/lib/i18n/messages";

export function BuilderLoadingFallback() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
      {msg("page.loadingBuilder")}
    </div>
  );
}
