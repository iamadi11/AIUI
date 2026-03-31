"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ComponentPaletteNavbar } from "./component-palette";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import { BUILDER_DOCUMENT_TEMPLATES } from "@/lib/builder/document-templates";
import { MoreHorizontal, Redo2, Undo2 } from "lucide-react";
import { useRef, useState } from "react";

export type BuilderNavbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onAddBoxToRoot: () => void;
  onAddStackToRoot: () => void;
  onInsertTemplate: (templateId: string) => void;
  /** When true, show a link to open builder with dev panels (`?dev=1`). */
  showAdvancedDevLink?: boolean;
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
    onInsertTemplate,
    showAdvancedDevLink,
  } = props;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-0 flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
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
          {showAdvancedDevLink ? (
            <Link
              href="/?dev=1"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {msg("navbar.advanced")}
            </Link>
          ) : null}
        </div>

        <ComponentPaletteNavbar />

        <div className="flex shrink-0 items-center justify-end gap-1 sm:ml-auto">
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
                    {BUILDER_DOCUMENT_TEMPLATES.map((tpl) => (
                      <Button
                        key={tpl.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-start font-normal"
                        title={tpl.description}
                        onClick={() => {
                          onInsertTemplate(tpl.id);
                          setMoreOpen(false);
                        }}
                      >
                        {tpl.label}
                      </Button>
                    ))}
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
