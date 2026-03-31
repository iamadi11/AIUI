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

function parityDoc(initialCount = 0) {
  const BTN = "30000000-0000-4000-8000-000000000101";
  return {
    version: DSL_VERSION,
    layoutVersion: LAYOUT_VERSION,
    state: { count: initialCount },
    root: {
      id: ROOT,
      type: "Stack",
      props: { direction: "column", gap: 8 },
      children: [
        {
          id: BTN,
          type: "Button",
          props: { label: "Increment" },
          events: {
            click: [
              {
                type: "setState" as const,
                path: "count",
                expression: "(state.count ?? 0) + 1",
              },
            ],
          },
        },
        {
          id: CHILD,
          type: "Box",
          props: {},
        },
      ],
    },
  };
}

function snapshotDom(container: HTMLElement) {
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
    };
  });
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

  it("reuses DOM nodes when update() passes a new config object with same ids", () => {
    const container = document.createElement("div");
    container.style.width = "400px";
    document.body.appendChild(container);

    const rt = render({ container, config: minimalDoc() });
    const inner = container.querySelector(
      `[data-aiui-id="${CHILD}"]`,
    ) as HTMLElement;

    const next = structuredClone(minimalDoc());
    rt.update(next);

    const after = container.querySelector(
      `[data-aiui-id="${CHILD}"]`,
    ) as HTMLElement;
    expect(after).toBe(inner);

    rt.destroy();
    document.body.removeChild(container);
  });

  it("reorders existing children by id without remounting", () => {
    const A = "30000000-0000-4000-8000-000000000001";
    const B = "30000000-0000-4000-8000-000000000002";
    const container = document.createElement("div");
    container.style.width = "400px";
    document.body.appendChild(container);

    const doc = {
      version: DSL_VERSION,
      layoutVersion: LAYOUT_VERSION,
      state: {},
      root: {
        id: ROOT,
        type: "Box",
        props: {},
        children: [
          { id: A, type: "Box", props: {} },
          { id: B, type: "Box", props: {} },
        ],
      },
    };

    const rt = render({ container, config: doc });
    const elA = container.querySelector(`[data-aiui-id="${A}"]`) as HTMLElement;
    const elB = container.querySelector(`[data-aiui-id="${B}"]`) as HTMLElement;

    rt.update({
      ...doc,
      root: {
        ...doc.root,
        children: [
          { id: B, type: "Box", props: {} },
          { id: A, type: "Box", props: {} },
        ],
      },
    });

    const kids = Array.from(container.querySelectorAll("[data-aiui-id]")).filter(
      (n) => n.getAttribute("data-aiui-id") !== ROOT,
    );
    expect(kids.map((n) => n.getAttribute("data-aiui-id"))).toEqual([B, A]);
    expect(container.querySelector(`[data-aiui-id="${A}"]`)).toBe(elA);
    expect(container.querySelector(`[data-aiui-id="${B}"]`)).toBe(elB);

    rt.destroy();
    document.body.removeChild(container);
  });

  it("relayout preserves runtime state", async () => {
    const container = document.createElement("div");
    container.style.width = "400px";
    document.body.appendChild(container);

    const rt = render({ container, config: minimalDoc() });
    const child = container.querySelector(`[data-aiui-id="${CHILD}"]`);
    child!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
    expect(rt.getState()).toEqual({ count: 1 });

    rt.relayout();
    expect(rt.getState()).toEqual({ count: 1 });

    rt.destroy();
    document.body.removeChild(container);
  });

  it("enforces parity matrix: same DSL + viewport + data => same result", async () => {
    const widths = [375, 768, 1280];
    const states = [0, 2];

    for (const width of widths) {
      for (const initialCount of states) {
        const doc = parityDoc(initialCount);

        const a = document.createElement("div");
        a.style.width = `${width}px`;
        document.body.appendChild(a);
        const rtA = render({ container: a, config: doc });

        const b = document.createElement("div");
        b.style.width = `${width}px`;
        document.body.appendChild(b);
        const rtB = render({ container: b, config: structuredClone(doc) });

        // Baseline parity for initial render.
        expect(snapshotDom(a)).toEqual(snapshotDom(b));
        expect(rtA.getState()).toEqual(rtB.getState());

        // Behavior parity after same interaction.
        const btnA = a.querySelector('[data-aiui-type="Button"]');
        const btnB = b.querySelector('[data-aiui-type="Button"]');
        btnA!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        btnB!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();

        expect(snapshotDom(a)).toEqual(snapshotDom(b));
        expect(rtA.getState()).toEqual(rtB.getState());

        rtA.destroy();
        rtB.destroy();
        document.body.removeChild(a);
        document.body.removeChild(b);
      }
    }
  });
});
