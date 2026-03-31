"use client";

import { msg } from "@/lib/i18n/messages";

/**
 * Collapsible reference for builder keyboard shortcuts (Product UX Phase 8).
 */
export function BuilderShortcutsHelp() {
  return (
    <details className="group rounded-lg border border-border bg-card/60 px-2 py-1.5 text-card-foreground shadow-sm">
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground marker:text-muted-foreground">
        {msg("shortcuts.title")}
      </summary>
      <dl className="mt-2 space-y-1.5 border-t border-border/80 pt-2 text-[0.65rem] leading-snug text-muted-foreground">
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.undoRedo")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">
            ⌘/Ctrl+Z · ⌘/Ctrl+⇧Z · ⌘/Ctrl+Y
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.clearSelection")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">Esc</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.toggleMultiSelect")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">⌘/Ctrl+Click</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.selectAllLayers")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">⌘/Ctrl+A</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.rangeSelectInTree")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">Shift+Click</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.selectParentLayer")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">Alt+↑</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.deleteSelectedLayer")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">
            Delete · Backspace
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{msg("shortcuts.duplicateSelectedLayer")}</dt>
          <dd className="shrink-0 font-mono text-foreground/90">⌘/Ctrl+D</dd>
        </div>
        <p className="pt-1 text-[0.6rem] text-muted-foreground/90">
          {msg("shortcuts.ignoredWhileTyping")}
        </p>
      </dl>
    </details>
  );
}
