/**
 * Matches `buttonClickFetchPopulateTableTemplate` (`assignTo: "table.rows"`).
 * Merging this into `document.state` gives fetch a well-known path without JSON edits.
 */
export function getFetchTableStarterState(): Record<string, unknown> {
  return {
    table: {
      rows: [] as unknown[],
    },
  };
}
