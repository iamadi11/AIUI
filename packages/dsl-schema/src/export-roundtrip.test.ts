import { describe, expect, it } from "vitest";
import {
  DSL_VERSION,
  LAYOUT_VERSION,
  exportGoldenJson,
  importGoldenJson,
  migrateDocument,
  safeParseDocument,
  safeParseDocumentWithMigration,
} from "./index";

const ROOT_ID = "10000000-0000-4000-8000-000000000001";

function minimalDoc() {
  return {
    version: DSL_VERSION,
    layoutVersion: LAYOUT_VERSION,
    root: {
      id: ROOT_ID,
      type: "Box",
      props: {},
    },
  };
}

describe("migrateDocument", () => {
  it("fills missing version and layoutVersion", () => {
    const raw = {
      root: {
        id: ROOT_ID,
        type: "Box",
        props: {},
      },
    };
    expect(safeParseDocument(raw).success).toBe(false);
    const r = safeParseDocumentWithMigration(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.version).toBe(DSL_VERSION);
      expect(r.data.layoutVersion).toBe(LAYOUT_VERSION);
    }
  });

  it("passes through migrateDocument", () => {
    const m = migrateDocument(minimalDoc());
    const r = safeParseDocument(m);
    expect(r.success).toBe(true);
  });
});

describe("golden JSON", () => {
  it("round-trips export → import", () => {
    const doc = minimalDoc();
    const ex = exportGoldenJson(doc);
    expect(ex.ok).toBe(true);
    if (!ex.ok) return;
    const im = importGoldenJson(ex.json);
    expect(im.ok).toBe(true);
    if (!im.ok) return;
    expect(im.document).toEqual(ex.document);
  });

  it("imports JSON missing layoutVersion after migration", () => {
    const json = JSON.stringify({
      version: DSL_VERSION,
      root: {
        id: ROOT_ID,
        type: "Box",
        props: {},
      },
    });
    const im = importGoldenJson(json);
    expect(im.ok).toBe(true);
    if (im.ok) {
      expect(im.document.layoutVersion).toBe(LAYOUT_VERSION);
    }
  });
});
