/**
 * Screen graph templates (labels for “Add screen from template” in the builder).
 * Composed starter trees live in `apps/web/lib/builder/screen-template-builders.ts`.
 */
export const SCREEN_TEMPLATE_LABELS = {
  dashboard: "Dashboard shell",
  stacked: "Stacked layout",
  tableModal: "Table + modal",
} as const;

export type ScreenTemplateId = keyof typeof SCREEN_TEMPLATE_LABELS;
