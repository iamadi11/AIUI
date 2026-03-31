import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCREEN_ID,
  DSL_VERSION,
  LAYOUT_VERSION,
  exportGoldenJson,
  inspectGoldenJsonImport,
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
    screens: {
      [DEFAULT_SCREEN_ID]: {
        root: {
          id: ROOT_ID,
          type: "Box",
          props: {},
        },
      },
    },
    initialScreenId: DEFAULT_SCREEN_ID,
    flowLayout: {
      positions: { [DEFAULT_SCREEN_ID]: { x: 0, y: 0 } },
      edges: [],
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

  it("migrates version 0.1.0 to current DSL_VERSION", () => {
    const raw = {
      version: "0.1.0",
      layoutVersion: LAYOUT_VERSION,
      root: {
        id: ROOT_ID,
        type: "Box",
        props: {},
      },
    };
    const r = safeParseDocumentWithMigration(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.version).toBe(DSL_VERSION);
    }
  });

  it("leaves unknown version without migrator unchanged (parse may fail)", () => {
    const raw = {
      version: "0.0.1-unknown",
      layoutVersion: LAYOUT_VERSION,
      root: {
        id: ROOT_ID,
        type: "Box",
        props: {},
      },
    };
    const m = migrateDocument(raw) as { version: string };
    expect(m.version).toBe("0.0.1-unknown");
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

  it("reports migration guidance for older DSL versions", () => {
    const json = JSON.stringify({
      version: "0.1.0",
      layoutVersion: LAYOUT_VERSION,
      root: {
        id: ROOT_ID,
        type: "Box",
        props: {},
      },
    });
    const im = inspectGoldenJsonImport(json);
    expect(im.ok).toBe(true);
    if (!im.ok) return;
    expect(im.requiresMigration).toBe(true);
    expect(im.originalVersion).toBe("0.1.0");
    expect(im.migratedVersion).toBe(DSL_VERSION);
    expect(im.warnings.length).toBeGreaterThan(0);
  });

  it("reports missing metadata defaults in migration assistant", () => {
    const json = JSON.stringify({
      root: {
        id: ROOT_ID,
        type: "Box",
        props: {},
      },
    });
    const im = inspectGoldenJsonImport(json);
    expect(im.ok).toBe(true);
    if (!im.ok) return;
    expect(im.requiresMigration).toBe(true);
    expect(im.originalVersion).toBeNull();
    expect(im.warnings.some((w) => w.includes("did not include a DSL version"))).toBe(
      true,
    );
    expect(
      im.warnings.some((w) => w.includes("did not include layoutVersion")),
    ).toBe(true);
  });
});
