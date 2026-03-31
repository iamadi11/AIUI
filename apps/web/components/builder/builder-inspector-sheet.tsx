"use client";

import type { AiuiDocument, PrototypeEdge } from "@aiui/dsl-schema";
import type { UiNode } from "@aiui/dsl-schema";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertiesInspector } from "./properties-inspector";
import { BuilderEdgeInspector } from "./builder-edge-inspector";
import { msg } from "@/lib/i18n/messages";

type BuilderInspectorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: AiuiDocument;
  editorRoot: UiNode;
  rootId: string;
  selectedNodeId: string | null;
  selectedEdge: PrototypeEdge | null;
};

export function BuilderInspectorSheet(props: BuilderInspectorSheetProps) {
  const {
    open,
    onOpenChange,
    document,
    editorRoot,
    rootId,
    selectedNodeId,
    selectedEdge,
  } = props;

  const showEdge = selectedEdge !== null;
  const title = showEdge
    ? msg("builder.edgeInspectorSheetTitle")
    : msg("builder.inspectorSheetTitle");
  const description = showEdge
    ? msg("builder.edgeInspectorIntro")
    : msg("builder.inspectorSheetDescription");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <ScrollArea
          className="min-h-0 flex-1 px-4 py-4"
          aria-label={msg("builder.propertiesInspectorAriaLabel")}
        >
          {showEdge && selectedEdge ? (
            <BuilderEdgeInspector
              document={document}
              edge={selectedEdge}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <PropertiesInspector
              root={editorRoot}
              selectedId={selectedNodeId}
              rootId={rootId}
            />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
