import { describe, expect, it } from "vitest";
import { DSL_VERSION, LAYOUT_VERSION } from "@aiui/dsl-schema";
import { render } from "./runtime";

const ROOT = "10000000-0000-4000-8000-000000000001";
const CHILD = "20000000-0000-4000-8000-000000000002";

function minimalDoc() {
  return {
    version: DSL_VERSION,
    layoutVersion: LAYOUT_VERSION,
    state: { count: 0 },
    root: {
      id: ROOT,
      type: "Box",
      props: {},
      children: [
        {
          id: CHILD,
          type: "Box",
          props: {},
          events: {
            click: [{ type: "setState" as const, path: "count", value: 1 }],
          },
        },
      ],
    },
  };
}

describe("render", () => {
  it("mounts nodes with layout and binds events", async () => {
    const container = document.createElement("div");
    container.style.width = "400px";
    document.body.appendChild(container);

    const rt = render({ container, config: minimalDoc() });

    const inner = container.querySelector(`[data-aiui-id="${CHILD}"]`);
    expect(inner).not.toBeNull();
    expect(rt.getState()).toEqual({ count: 0 });

    const beforeFlush = container.querySelector(`[data-aiui-id="${CHILD}"]`);
    inner!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();

    expect(rt.getState()).toEqual({ count: 1 });
    expect(container.querySelector(`[data-aiui-id="${CHILD}"]`)).toBe(
      beforeFlush,
    );

    rt.destroy();
    document.body.removeChild(container);
  });

  it("shows validation errors for invalid config", () => {
    const container = document.createElement("div");
    const rt = render({ container, config: { bad: true } });
    expect(container.textContent).toContain("Invalid DSL");
    rt.destroy();
  });

  it("update replaces document", () => {
    const container = document.createElement("div");
    container.style.width = "400px";
    const rt = render({
      container,
      config: minimalDoc(),
    });
    expect(container.querySelector(`[data-aiui-id="${CHILD}"]`)).not.toBeNull();

    rt.update({
      version: DSL_VERSION,
      root: {
        id: ROOT,
        type: "Box",
        props: {},
        children: [],
      },
    });
    expect(container.querySelector(`[data-aiui-id="${CHILD}"]`)).toBeNull();
    rt.destroy();
  });
});
