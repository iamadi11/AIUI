"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentDataAndStatePanel } from "./document-data-state-panel";
import { msg } from "@/lib/i18n/messages";

export function DataAndStateSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle>{msg("builder.dataStateSheetTitle")}</SheetTitle>
          <SheetDescription>{msg("builder.dataStateSheetDescription")}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-4 py-4">
          <DocumentDataAndStatePanel />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
