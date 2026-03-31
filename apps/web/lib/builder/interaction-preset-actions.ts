import type { Action } from "@aiui/dsl-schema";
import type { InteractionPreset } from "@aiui/registry";
import {
  buttonClickFetchPopulateTableTemplate,
  rowActionModalSubmitRefreshTemplate,
} from "./event-actions";

export function actionsForInteractionPreset(preset: InteractionPreset): Action[] {
  switch (preset.templateKey) {
    case "buttonFetchTable":
      return buttonClickFetchPopulateTableTemplate().actions;
    case "rowModalSubmit":
      return rowActionModalSubmitRefreshTemplate().actions;
    case "notify":
      return [{ type: "notify", level: "info", message: "Done" }];
    default:
      return [];
  }
}
