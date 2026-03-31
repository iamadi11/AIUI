"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import { Database, MoreHorizontal, Redo2, Undo2 } from "lucide-react";
import { useRef, useState } from "react";

export type BuilderNavbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onAddBoxToRoot: () => void;
  onAddStackToRoot: () => void;
  /** When true, show a link to open builder with dev panels (`?dev=1`). */
  showAdvancedDevLink?: boolean;
  /** Opens the unified Data & state sheet (document state + sample sources). */
  onOpenDataAndState?: () => void;
};

export function BuilderNavbar(props: BuilderNavbarProps) {
  const {
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onReset,
    onAddBoxToRoot,
    onAddStackToRoot,
    showAdvancedDevLink,
    onOpenDataAndState,
  } = props;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-0 flex-wrap items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {msg("navbar.brand")}
          </Link>
          <Link
            href="/preview"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            {msg("builder.preview")}
          </Link>
          {onOpenDataAndState ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onOpenDataAndState()}
            >
              <Database className="size-3.5" aria-hidden />
              {msg("navbar.dataAndState")}
            </Button>
          ) : null}
          {showAdvancedDevLink ? (
            <Link
              href="/?dev=1"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {msg("navbar.advanced")}
            </Link>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!canUndo}
            onClick={() => onUndo()}
            title={msg("builder.undoTitle")}
            aria-label={msg("builder.undo")}
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!canRedo}
            onClick={() => onRedo()}
            title={msg("builder.redoTitle")}
            aria-label={msg("builder.redo")}
          >
            <Redo2 className="size-4" />
          </Button>

          <div className="relative" ref={moreWrapRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 px-2"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((o) => !o)}
            >
              <MoreHorizontal className="size-4" aria-hidden />
              <span className="sr-only sm:not-sr-only sm:text-xs">
                {msg("navbar.more")}
              </span>
            </Button>
            {moreOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label={msg("navbar.closeMenu")}
                  onClick={() => setMoreOpen(false)}
                />
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
                  role="menu"
                >
                  <div className="flex flex-col gap-0.5 p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start font-normal"
                      onClick={() => {
                        onAddBoxToRoot();
                        setMoreOpen(false);
                      }}
                    >
                      {msg("builder.addBoxToRoot")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start font-normal"
                      onClick={() => {
                        onAddStackToRoot();
                        setMoreOpen(false);
                      }}
                    >
                      {msg("builder.addStackToRoot")}
                    </Button>
                    <div className="my-1 h-px bg-border" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start font-normal text-destructive hover:text-destructive"
                      onClick={() => {
                        onReset();
                        setMoreOpen(false);
                      }}
                    >
                      {msg("builder.resetDocument")}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
