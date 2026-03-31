import type { UiNode } from "@aiui/dsl-schema";
import {
  BADGE_TYPE,
  BUTTON_TYPE,
  CARD_TYPE,
  INPUT_TYPE,
  type ScreenTemplateId,
  STACK_TYPE,
  TABLE_TYPE,
} from "@aiui/registry";
import { createNodeFromType } from "@/lib/document/model";

/** Composed roots for “Add screen from template” (ids match `SCREEN_TEMPLATE_LABELS` in `@aiui/registry`). */
export function buildScreenTemplateRoot(templateId: ScreenTemplateId): UiNode {
  switch (templateId) {
    case "dashboard": {
      const stack = createNodeFromType(STACK_TYPE);
      const header = createNodeFromType(STACK_TYPE);
      const headerRow: UiNode = {
        ...header,
        props: {
          ...header.props,
          direction: "row",
          gap: 8,
          label: "Toolbar",
        },
      };
      const badge = createNodeFromType(BADGE_TYPE);
      const badgeTitled: UiNode = {
        ...badge,
        props: { ...badge.props, label: "Dashboard" },
      };
      const input = createNodeFromType(INPUT_TYPE);
      const inputSearch: UiNode = {
        ...input,
        props: { ...input.props, placeholder: "Search…" },
      };
      const card = createNodeFromType(CARD_TYPE);
      return {
        ...stack,
        props: {
          ...stack.props,
          direction: "column",
          gap: 16,
          label: "Dashboard shell",
        },
        children: [
          {
            ...headerRow,
            children: [badgeTitled, inputSearch],
          },
          card,
        ],
      };
    }
    case "stacked": {
      const stack = createNodeFromType(STACK_TYPE);
      const c1 = createNodeFromType(CARD_TYPE);
      const c2 = createNodeFromType(CARD_TYPE);
      return {
        ...stack,
        props: {
          ...stack.props,
          direction: "column",
          gap: 12,
          label: "Stacked layout",
        },
        children: [
          { ...c1, props: { ...c1.props, label: "Section A" } },
          { ...c2, props: { ...c2.props, label: "Section B" } },
        ],
      };
    }
    case "tableModal": {
      const stack = createNodeFromType(STACK_TYPE);
      const table = createNodeFromType(TABLE_TYPE);
      const btn = createNodeFromType(BUTTON_TYPE);
      const btnTitled: UiNode = {
        ...btn,
        props: { ...btn.props, label: "Open details" },
      };
      return {
        ...stack,
        props: {
          ...stack.props,
          direction: "column",
          gap: 12,
          label: "Table + modal",
        },
        children: [
          { ...table, props: { ...table.props, label: "Orders" } },
          btnTitled,
        ],
      };
    }
    default: {
      const _x: never = templateId;
      return _x;
    }
  }
}
