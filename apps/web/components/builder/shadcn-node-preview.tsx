"use client";

import type { UiNode } from "@aiui/dsl-schema";
import {
  BADGE_TYPE,
  BOX_TYPE,
  BUTTON_TYPE,
  CARD_TYPE,
  INPUT_TYPE,
  STACK_TYPE,
  TABLE_TYPE,
} from "@aiui/registry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShadcnNodePreviewProps = {
  node: UiNode;
  className?: string;
};

function readStringProp(
  props: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const raw = props[key];
  return typeof raw === "string" ? raw : fallback;
}

function renderChildren(node: UiNode): React.ReactNode {
  if (!node.children?.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {node.children.map((child) => (
        <ShadcnNodePreviewNode key={child.id} node={child} />
      ))}
    </div>
  );
}

function ShadcnNodePreviewNode(props: { node: UiNode }) {
  const { node } = props;
  const nodeProps = node.props as Record<string, unknown>;

  if (node.type === BUTTON_TYPE) {
    const label = readStringProp(nodeProps, "label", "Button");
    const rawVariant = readStringProp(nodeProps, "variant", "default");
    const variant =
      rawVariant === "outline" ||
      rawVariant === "secondary" ||
      rawVariant === "ghost" ||
      rawVariant === "destructive" ||
      rawVariant === "link"
        ? rawVariant
        : "default";
    return (
      <div className="rounded-md border border-border bg-card p-2">
        <Button variant={variant} size="sm" className="pointer-events-none">
          {label}
        </Button>
      </div>
    );
  }

  if (node.type === INPUT_TYPE) {
    const placeholder = readStringProp(nodeProps, "placeholder", "Type here...");
    return (
      <div className="rounded-md border border-border bg-card p-2">
        <input
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none"
          placeholder={placeholder}
          readOnly
        />
      </div>
    );
  }

  if (node.type === BADGE_TYPE) {
    const label = readStringProp(nodeProps, "label", "Status");
    return (
      <div className="rounded-md border border-border bg-card p-2">
        <span className="inline-flex h-6 items-center rounded-full bg-secondary px-2 text-xs font-medium text-secondary-foreground">
          {label}
        </span>
      </div>
    );
  }

  if (node.type === CARD_TYPE) {
    const title = readStringProp(nodeProps, "label", "Card");
    const description = readStringProp(nodeProps, "description", "");
    return (
      <Card className="py-0">
        <CardHeader className="px-3 py-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {node.children?.length ? renderChildren(node) : null}
        </CardContent>
      </Card>
    );
  }

  if (node.type === TABLE_TYPE) {
    const title = readStringProp(nodeProps, "label", "Table");
    const emptyState = readStringProp(nodeProps, "emptyState", "No rows yet");
    return (
      <div className="rounded-lg border border-border bg-card p-2">
        <p className="mb-2 text-xs font-medium text-foreground">{title}</p>
        <div className="overflow-hidden rounded-md border border-border/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 font-medium">Name</th>
                <th className="px-2 py-1.5 font-medium">Status</th>
                <th className="px-2 py-1.5 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/70">
                <td className="px-2 py-1.5">Acme</td>
                <td className="px-2 py-1.5">Ok</td>
                <td className="px-2 py-1.5">42</td>
              </tr>
              <tr className="border-t border-border/70">
                <td className="px-2 py-1.5">Globex</td>
                <td className="px-2 py-1.5">Pending</td>
                <td className="px-2 py-1.5">-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[0.65rem] text-muted-foreground">{emptyState}</p>
        {node.children?.length ? (
          <div className="mt-2 flex flex-col gap-2">{renderChildren(node)}</div>
        ) : null}
      </div>
    );
  }

  if (node.type === STACK_TYPE || node.type === BOX_TYPE) {
    const label = readStringProp(nodeProps, "label", "");
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border bg-background/80 p-2",
          node.type === STACK_TYPE && "flex flex-col gap-2",
        )}
      >
        {label ? (
          <p className="text-[0.65rem] font-medium text-muted-foreground">{label}</p>
        ) : null}
        {renderChildren(node)}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-2">
      <p className="text-xs text-muted-foreground">{node.type}</p>
      {renderChildren(node)}
    </div>
  );
}

export function ShadcnNodePreview(props: ShadcnNodePreviewProps) {
  return (
    <div className={cn("rounded-md bg-muted/10 p-2", props.className)}>
      <ShadcnNodePreviewNode node={props.node} />
    </div>
  );
}
