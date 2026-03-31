import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { safeParseDocument } from "@aiui/dsl-schema";
import {
  BOX_TYPE,
  STACK_TYPE,
  layoutDocument,
  type Rect,
} from "@aiui/layout-engine";
import type { ActionEnvironment } from "@aiui/logic";
import { runActions } from "@aiui/logic";
import { isRegisteredType } from "@aiui/registry";

export type RenderOptions = {
  container: HTMLElement;
  config: unknown;
  /** Root layout width in px; defaults to `container.clientWidth` or `320`. */
  layoutWidth?: number;
};

export type RuntimeHandle = {
  /** Replace the document and re-mount. */
  update: (config: unknown) => void;
  /** Remove listeners and clear the container. */
  destroy: () => void;
  /** Current logic state (mutable by actions). */
  getState: () => Record<string, unknown>;
};

const DEFAULT_WIDTH = 320;

function cloneState(
  s: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!s || Object.keys(s).length === 0) return {};
  return JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
}

function rootLayoutWidth(container: HTMLElement, override?: number): number {
  if (override !== undefined && Number.isFinite(override) && override > 0) {
    return override;
  }
  const w = container.clientWidth;
  return w > 0 ? w : DEFAULT_WIDTH;
}

function applyPrimitiveStyle(el: HTMLElement, node: UiNode): void {
  if (!isRegisteredType(node.type)) {
    el.style.border = "1px solid #c62828";
    el.style.background = "rgba(198, 40, 40, 0.06)";
    return;
  }
  if (node.type === BOX_TYPE) {
    el.style.border = "1px dashed rgba(0, 0, 0, 0.28)";
    el.style.background = "rgba(255, 255, 255, 0.65)";
    return;
  }
  if (node.type === STACK_TYPE) {
    el.style.border = "1px solid rgba(0, 0, 0, 0.18)";
    el.style.background = "rgba(0, 0, 0, 0.04)";
  }
}

function mountSubtree(
  node: UiNode,
  parentEl: HTMLElement,
  parentRect: Rect,
  rects: Map<string, Rect>,
  bindEvents: (el: HTMLElement, n: UiNode) => void,
  onNodeError: (node: UiNode, err: unknown) => HTMLElement,
): void {
  let rect: Rect | undefined;
  try {
    rect = rects.get(node.id);
    if (!rect) throw new Error(`missing layout rect for node ${node.id}`);
  } catch (e) {
    parentEl.appendChild(onNodeError(node, e));
    return;
  }

  let el: HTMLElement;
  try {
    el = document.createElement("div");
    el.dataset.aiuiId = node.id;
    el.dataset.aiuiType = node.type;
    el.style.position = "absolute";
    el.style.boxSizing = "border-box";
    el.style.left = `${rect.x - parentRect.x}px`;
    el.style.top = `${rect.y - parentRect.y}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    applyPrimitiveStyle(el, node);
    bindEvents(el, node);
    parentEl.appendChild(el);
  } catch (e) {
    parentEl.appendChild(onNodeError(node, e));
    return;
  }

  for (const child of node.children ?? []) {
    try {
      mountSubtree(child, el, rect, rects, bindEvents, onNodeError);
    } catch (e) {
      el.appendChild(onNodeError(child, e));
    }
  }
}

function showParseError(container: HTMLElement, message: string): void {
  container.replaceChildren();
  const wrap = document.createElement("div");
  wrap.style.boxSizing = "border-box";
  wrap.style.padding = "12px";
  wrap.style.fontFamily = "ui-monospace, monospace";
  wrap.style.fontSize = "12px";
  wrap.style.color = "#7f1d1d";
  wrap.style.background = "rgba(127, 29, 29, 0.08)";
  wrap.style.border = "1px solid rgba(127, 29, 29, 0.35)";
  wrap.style.borderRadius = "6px";
  wrap.textContent = message;
  container.appendChild(wrap);
}

export function render(options: RenderOptions): RuntimeHandle {
  const { container, layoutWidth: layoutWidthOpt } = options;
  let config: unknown = options.config;

  let disposed = false;
  let state: Record<string, unknown> = {};
  const listenerDisposers: (() => void)[] = [];

  let flushPending = false;
  function scheduleFlush(): void {
    if (disposed || flushPending) return;
    flushPending = true;
    queueMicrotask(() => {
      flushPending = false;
      if (disposed) return;
      rebuild();
    });
  }

  const env: ActionEnvironment = {
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    navigate: (href) => {
      window.location.assign(href);
    },
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  };

  function bindEvents(el: HTMLElement, node: UiNode): void {
    for (const [eventName, actions] of Object.entries(node.events ?? {})) {
      if (!actions?.length) continue;
      const handler = (): void => {
        void (async () => {
          try {
            await runActions(actions, env);
          } catch (err) {
            console.error(`[aiui] action error on ${node.id}`, err);
          }
          scheduleFlush();
        })();
      };
      el.addEventListener(eventName, handler);
      listenerDisposers.push(() =>
        el.removeEventListener(eventName, handler),
      );
    }
  }

  function onNodeError(node: UiNode, err: unknown): HTMLElement {
    const msg = err instanceof Error ? err.message : String(err);
    const box = document.createElement("div");
    box.dataset.aiuiError = node.id;
    box.style.boxSizing = "border-box";
    box.style.position = "absolute";
    box.style.left = "0";
    box.style.top = "0";
    box.style.right = "0";
    box.style.padding = "4px";
    box.style.fontSize = "11px";
    box.style.fontFamily = "ui-monospace, monospace";
    box.style.color = "#7f1d1d";
    box.style.background = "rgba(127, 29, 29, 0.1)";
    box.style.border = "1px dashed rgba(127, 29, 29, 0.4)";
    box.textContent = `Node ${node.type}: ${msg}`;
    return box;
  }

  function rebuild(): void {
    for (const d of listenerDisposers) d();
    listenerDisposers.length = 0;
    container.replaceChildren();

    const parsed = safeParseDocument(config);
    if (!parsed.success) {
      showParseError(
        container,
        `Invalid DSL: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
      return;
    }

    const doc: AiuiDocument = parsed.data;
    state = cloneState(doc.state);

    const lw = rootLayoutWidth(container, layoutWidthOpt);
    const rects = layoutDocument(doc.root, { width: lw });
    const rootRect = rects.get(doc.root.id);
    if (!rootRect) {
      showParseError(container, "Layout failed: missing root rect.");
      return;
    }

    container.style.position = "relative";
    container.style.boxSizing = "border-box";
    container.style.minHeight = `${rootRect.height}px`;
    container.style.width = "100%";

    const origin: Rect = { x: 0, y: 0, width: 0, height: 0 };
    try {
      mountSubtree(
        doc.root,
        container,
        origin,
        rects,
        bindEvents,
        onNodeError,
      );
    } catch (e) {
      showParseError(
        container,
        `Render failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  function update(next: unknown): void {
    if (disposed) return;
    config = next;
    rebuild();
  }

  function destroy(): void {
    if (disposed) return;
    disposed = true;
    for (const d of listenerDisposers) d();
    listenerDisposers.length = 0;
    container.replaceChildren();
  }

  function getState(): Record<string, unknown> {
    return state;
  }

  rebuild();

  return { update, destroy, getState };
}
