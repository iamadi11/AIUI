import type { UiNode } from "@aiui/dsl-schema";
import { BOX_TYPE, STACK_TYPE } from "@aiui/registry";
import { createNodeFromType } from "@/lib/document/model";

function createLabeledBox(
  label: string,
  layout?: UiNode["layout"],
  extraProps?: Record<string, unknown>,
): UiNode {
  const box = createNodeFromType(BOX_TYPE);
  return {
    ...box,
    props: { ...box.props, ...extraProps, label },
    layout: layout ? { ...(box.layout ?? {}), ...layout } : box.layout,
  };
}

function createStack(
  direction: "row" | "column",
  gap: number,
  label: string,
  children: UiNode[],
): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction, gap, label },
    children,
  };
}

/** Horizontal stack with two empty boxes (gap 8px). */
export function createRowWithTwoBoxes(): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  const b1 = createNodeFromType(BOX_TYPE);
  const b2 = createNodeFromType(BOX_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction: "row", gap: 8 },
    children: [b1, b2],
  };
}

/** Vertical stack with header, content, footer boxes. */
export function createHeaderContentFooter(): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  const header = createNodeFromType(BOX_TYPE);
  const content = createNodeFromType(BOX_TYPE);
  const footer = createNodeFromType(BOX_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction: "column", gap: 8 },
    children: [header, content, footer],
  };
}

/** Sidebar + content layout: row stack with narrow sidebar and flexible content. */
export function createSidebarAndContent(): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  const sidebar = createNodeFromType(BOX_TYPE);
  const content = createNodeFromType(BOX_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction: "row", gap: 8 },
    children: [
      {
        ...sidebar,
        layout: { ...(sidebar.layout ?? {}), width: 240 },
      },
      content,
    ],
  };
}

/** Starter filter row with two filters and one action button placeholder. */
export function createDashboardFilterBar(): UiNode {
  return createStack("row", 8, "Filter bar", [
    createLabeledBox("Filter: Status", { width: 180, height: 40 }),
    createLabeledBox("Filter: Date range", { width: 220, height: 40 }),
    createLabeledBox("Button: Apply filters", { width: 140, height: 40 }),
  ]);
}

/** Three-card KPI row used as a dashboard summary strip. */
export function createDashboardCardRow(): UiNode {
  return createStack("row", 8, "KPI cards", [
    createLabeledBox("Card: Revenue", { width: 220, height: 92 }),
    createLabeledBox("Card: Active users", { width: 220, height: 92 }),
    createLabeledBox("Card: Conversion", { width: 220, height: 92 }),
  ]);
}

/** Data table block with header controls and table body placeholder. */
export function createDashboardTableSection(): UiNode {
  const controls = createStack("row", 8, "Table controls", [
    createLabeledBox("Table title", { height: 36 }),
    createLabeledBox("Button: Refresh", { width: 140, height: 36 }),
  ]);
  const body = createLabeledBox("Table: Results", { height: 240 });
  return createStack("column", 8, "Table section", [controls, body]);
}

/** Chart card with title + chart surface placeholder. */
export function createDashboardChartSection(): UiNode {
  return createStack("column", 8, "Chart section", [
    createLabeledBox("Chart title", { height: 36 }),
    createLabeledBox("Chart: Trend", { height: 220 }),
  ]);
}

/** Combined starter dashboard with filter, cards, table, and chart zones. */
export function createStarterDashboardTemplate(): UiNode {
  return createStack("column", 12, "Starter dashboard", [
    createLabeledBox("Dashboard title", { height: 48 }),
    createDashboardFilterBar(),
    createDashboardCardRow(),
    createDashboardTableSection(),
    createDashboardChartSection(),
  ]);
}

export const BUILDER_DOCUMENT_TEMPLATES = [
  {
    id: "row-two-boxes",
    label: "Row + two boxes",
    description: "Stack (row) with two Box children",
    create: createRowWithTwoBoxes,
  },
  {
    id: "header-content-footer",
    label: "Header / content / footer",
    description: "Vertical Stack with three Box rows",
    create: createHeaderContentFooter,
  },
  {
    id: "sidebar-and-content",
    label: "Sidebar + content",
    description: "Row Stack with fixed-width sidebar Box and flexible content Box",
    create: createSidebarAndContent,
  },
  {
    id: "starter-dashboard",
    label: "Starter dashboard",
    description: "Filter bar + KPI cards + table + chart starter layout",
    create: createStarterDashboardTemplate,
  },
  {
    id: "dashboard-filter-bar",
    label: "Filter bar",
    description: "Two filter controls + apply button placeholders",
    create: createDashboardFilterBar,
  },
  {
    id: "dashboard-card-row",
    label: "KPI card row",
    description: "Three starter KPI cards",
    create: createDashboardCardRow,
  },
  {
    id: "dashboard-table-section",
    label: "Table section",
    description: "Table toolbar + table placeholder",
    create: createDashboardTableSection,
  },
  {
    id: "dashboard-chart-section",
    label: "Chart section",
    description: "Chart title + chart placeholder area",
    create: createDashboardChartSection,
  },
] as const;
