/**
 * Screen graph templates (labels for future "Add screen from template" flows).
 * Multi-screen defaults stay centralized here for easy updates.
 */
export const SCREEN_TEMPLATE_LABELS = {
  dashboard: "Dashboard shell",
  stacked: "Stacked layout",
  tableModal: "Table + modal",
} as const;

export type ScreenTemplateId = keyof typeof SCREEN_TEMPLATE_LABELS;
