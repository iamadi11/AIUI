import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCREEN_ID,
  DSL_VERSION,
  LAYOUT_VERSION,
} from "@aiui/dsl-schema";
import { render } from "./runtime";

const ROOT = "90000000-0000-4000-8000-000000000001";
const BTN = "90000000-0000-4000-8000-000000000002";
const CARD = "90000000-0000-4000-8000-000000000003";
const BADGE = "90000000-0000-4000-8000-000000000004";

function visualDoc() {
  return {
    version: DSL_VERSION,
    layoutVersion: LAYOUT_VERSION,
    state: { count: 1 },
    screens: {
      [DEFAULT_SCREEN_ID]: {
        root: {
          id: ROOT,
          type: "Stack",
          props: { direction: "column", gap: 8 },
          children: [
            { id: BTN, type: "Button", props: { label: "Run" } },
            {
              id: CARD,
              type: "Card",
              props: { label: "Revenue", description: "Last 30 days" },
              children: [
                { id: BADGE, type: "Badge", props: { label: "Up 12%" } },
              ],
            },
          ],
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

function styleSnapshot(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-aiui-id]")).map((node) => {
    const el = node as HTMLElement;
    return {
      id: el.dataset.aiuiId ?? "",
      type: el.dataset.aiuiType ?? "",
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
      border: el.style.border,
      background: el.style.background,
      borderRadius: el.style.borderRadius,
      boxShadow: el.style.boxShadow,
    };
  });
}

describe("runtime visual snapshots", () => {
  it("matches desktop visual baseline", () => {
    const container = document.createElement("div");
    container.style.width = "1280px";
    document.body.appendChild(container);

    const rt = render({ container, config: visualDoc(), layoutWidth: 1280 });
    expect(styleSnapshot(container)).toMatchSnapshot();

    rt.destroy();
    document.body.removeChild(container);
  });

  it("matches mobile visual baseline", () => {
    const container = document.createElement("div");
    container.style.width = "375px";
    document.body.appendChild(container);

    const rt = render({ container, config: visualDoc(), layoutWidth: 375 });
    expect(styleSnapshot(container)).toMatchSnapshot();

    rt.destroy();
    document.body.removeChild(container);
  });
});
