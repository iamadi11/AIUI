import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import {
  getRuntimeScreenRoot,
  safeParseDocumentWithMigration,
} from "@aiui/dsl-schema";
import {
  BOX_TYPE,
  STACK_TYPE,
  layoutDocument,
  type Rect,
} from "@aiui/layout-engine";
import type { ActionEnvironment } from "@aiui/logic";
import { runActions } from "@aiui/logic";
import {
  BADGE_TYPE,
  BUTTON_TYPE,
  CARD_TYPE,
  INPUT_TYPE,
  TABLE_TYPE,
  isRegisteredType,
} from "@aiui/registry";
import {
  defaultDiagnosticsSink,
  type DiagnosticsSink,
} from "./diagnostics";

export type RenderOptions = {
  container: HTMLElement;
  config: unknown;
  /** Root layout width in px; defaults to `container.clientWidth` or `320`. */
  layoutWidth?: number;
  diagnostics?: DiagnosticsSink;
};

export type RuntimeHandle = {
  /** Replace the document and re-mount. */
  update: (config: unknown) => void;
  /** Recompute layout for current document without resetting state. */
  relayout: () => void;
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
    return;
  }
  if (node.type === BUTTON_TYPE) {
    el.style.border = "1px solid rgba(37, 99, 235, 0.45)";
    el.style.background = "rgba(37, 99, 235, 0.12)";
    el.style.borderRadius = "8px";
    return;
  }
  if (node.type === INPUT_TYPE) {
    el.style.border = "1px solid rgba(0, 0, 0, 0.24)";
    el.style.background = "rgba(255, 255, 255, 0.92)";
    el.style.borderRadius = "8px";
    return;
  }
  if (node.type === CARD_TYPE) {
    el.style.border = "1px solid rgba(0, 0, 0, 0.16)";
    el.style.background = "rgba(255, 255, 255, 0.95)";
    el.style.borderRadius = "12px";
    el.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
    return;
  }
  if (node.type === TABLE_TYPE) {
    el.style.border = "1px solid rgba(0, 0, 0, 0.2)";
    el.style.background = "rgba(255, 255, 255, 0.9)";
    el.style.borderRadius = "10px";
    return;
  }
  if (node.type === BADGE_TYPE) {
    el.style.border = "1px solid rgba(0, 0, 0, 0.2)";
    el.style.background = "rgba(0, 0, 0, 0.08)";
    el.style.borderRadius = "999px";
    return;
  }
}

const AIUI_CONTENT_MARK = "data-aiui-content";

function clearPrimitiveContent(el: HTMLElement): void {
  el.querySelectorAll(`[${AIUI_CONTENT_MARK}="1"]`).forEach((n) => n.remove());
}

/**
 * Renders readable labels / sample markup for primitives. Layout children use
 * `data-aiui-id` only; decorative content is marked with `data-aiui-content`.
 */
function applyPrimitiveContent(el: HTMLElement, node: UiNode): void {
  if (!isRegisteredType(node.type)) return;
  clearPrimitiveContent(el);
  const props = node.props as Record<string, unknown>;
  const hasKids = (node.children?.length ?? 0) > 0;

  if (node.type === BUTTON_TYPE) {
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.padding = "0 12px";
    el.style.fontSize = "13px";
    el.style.fontWeight = "500";
    el.style.color = "rgba(30, 58, 138, 0.95)";
    const span = document.createElement("span");
    span.setAttribute(AIUI_CONTENT_MARK, "1");
    span.style.pointerEvents = "none";
    span.textContent = String(props.label ?? "Button");
    el.appendChild(span);
    return;
  }

  if (node.type === INPUT_TYPE) {
    el.style.display = "flex";
    el.style.alignItems = "center";
    const wrap = document.createElement("div");
    wrap.setAttribute(AIUI_CONTENT_MARK, "1");
    wrap.style.flex = "1";
    wrap.style.minWidth = "0";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.padding = "0 10px";
    const hint = document.createElement("span");
    hint.style.opacity = "0.45";
    hint.style.fontSize = "13px";
    hint.style.whiteSpace = "nowrap";
    hint.style.overflow = "hidden";
    hint.style.textOverflow = "ellipsis";
    hint.textContent = String(props.placeholder ?? props.label ?? "Input");
    wrap.appendChild(hint);
    el.appendChild(wrap);
    return;
  }

  if (node.type === BADGE_TYPE) {
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.padding = "0 10px";
    const span = document.createElement("span");
    span.setAttribute(AIUI_CONTENT_MARK, "1");
    span.style.fontSize = "12px";
    span.style.fontWeight = "500";
    span.textContent = String(props.label ?? "Badge");
    el.appendChild(span);
    return;
  }

  if (node.type === CARD_TYPE) {
    if (hasKids) return;
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.padding = "12px";
    el.style.gap = "4px";
    el.style.boxSizing = "border-box";
    el.style.justifyContent = "center";
    const wrap = document.createElement("div");
    wrap.setAttribute(AIUI_CONTENT_MARK, "1");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "4px";
    wrap.style.minHeight = "0";
    const title = document.createElement("div");
    title.style.fontSize = "14px";
    title.style.fontWeight = "600";
    title.textContent = String(props.label ?? "Card");
    const desc = document.createElement("div");
    desc.style.fontSize = "12px";
    desc.style.opacity = "0.7";
    desc.textContent = String(props.description ?? "");
    wrap.appendChild(title);
    wrap.appendChild(desc);
    el.appendChild(wrap);
    return;
  }

  if (node.type === TABLE_TYPE) {
    el.style.overflow = "hidden";
    if (hasKids) {
      const cap = document.createElement("div");
      cap.setAttribute(AIUI_CONTENT_MARK, "1");
      cap.style.position = "absolute";
      cap.style.left = "8px";
      cap.style.top = "6px";
      cap.style.fontSize = "11px";
      cap.style.fontWeight = "600";
      cap.style.color = "rgba(15, 23, 42, 0.85)";
      cap.style.pointerEvents = "none";
      cap.textContent = String(props.label ?? "Table");
      el.appendChild(cap);
      return;
    }
    const wrap = document.createElement("div");
    wrap.setAttribute(AIUI_CONTENT_MARK, "1");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.flex = "1";
    wrap.style.minHeight = "0";
    wrap.style.gap = "0";
    wrap.style.padding = "8px";
    wrap.style.boxSizing = "border-box";
    wrap.style.height = "100%";
    const labelEl = document.createElement("div");
    labelEl.style.fontSize = "11px";
    labelEl.style.fontWeight = "600";
    labelEl.style.marginBottom = "6px";
    labelEl.textContent = String(props.label ?? "Table");
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "11px";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    trh.style.background = "rgba(0,0,0,0.04)";
    for (const h of ["Name", "Status", "Value"]) {
      const th = document.createElement("th");
      th.style.textAlign = "left";
      th.style.padding = "6px 8px";
      th.style.borderBottom = "1px solid rgba(0,0,0,0.12)";
      th.textContent = h;
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    const tbody = document.createElement("tbody");
    for (const row of [
      ["Acme", "Ok", "42"],
      ["Globex", "Pending", "—"],
    ]) {
      const tr = document.createElement("tr");
      for (const cell of row) {
        const td = document.createElement("td");
        td.style.padding = "6px 8px";
        td.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
        td.textContent = cell;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    const foot = document.createElement("div");
    foot.style.display = "flex";
    foot.style.justifyContent = "space-between";
    foot.style.alignItems = "center";
    foot.style.marginTop = "6px";
    foot.style.paddingTop = "6px";
    foot.style.borderTop = "1px solid rgba(0,0,0,0.1)";
    foot.style.fontSize = "10px";
    foot.style.color = "rgba(0,0,0,0.55)";
    const emptyText = document.createElement("span");
    emptyText.textContent = String(props.emptyState ?? "No rows yet");
    const pager = document.createElement("span");
    pager.textContent = "Prev · Next";
    foot.appendChild(emptyText);
    foot.appendChild(pager);
    wrap.appendChild(labelEl);
    wrap.appendChild(table);
    wrap.appendChild(foot);
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.appendChild(wrap);
  }
}

function findDirectChildByAiuiId(
  parent: HTMLElement,
  id: string,
): HTMLElement | null {
  const kids = parent.children;
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i];
    if (c instanceof HTMLElement && c.dataset.aiuiId === id) {
      return c;
    }
  }
  return null;
}

function getDirectAiuiChildren(parent: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const kids = parent.children;
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i];
    if (c instanceof HTMLElement && c.dataset.aiuiId) out.push(c);
  }
  return out;
}

function walkUiNodes(node: UiNode, visit: (n: UiNode) => void): void {
  visit(node);
  for (const c of node.children ?? []) walkUiNodes(c, visit);
}

function eventsEqual(
  a: UiNode["events"] | undefined,
  b: UiNode["events"] | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!(key in b)) return false;
    const aEvent = a[key];
    const bEvent = b[key];
    if (!aEvent || !bEvent) {
      if (aEvent !== bEvent) return false;
      continue;
    }
    if (aEvent.length !== bEvent.length) return false;
    for (let i = 0; i < aEvent.length; i++) {
      if (JSON.stringify(aEvent[i]) !== JSON.stringify(bEvent[i])) return false;
    }
  }
  return true;
}

function ensureAiuiChildOrder(
  parentEl: HTMLElement,
  orderedIds: string[],
): void {
  for (let i = 0; i < orderedIds.length; i++) {
    const el = findDirectChildByAiuiId(parentEl, orderedIds[i]);
    if (!el) continue;
    const uiKids = getDirectAiuiChildren(parentEl);
    if (uiKids[i] === el) continue;
    parentEl.insertBefore(el, uiKids[i] ?? null);
  }
}

function patchSubtree(
  node: UiNode,
  parentEl: HTMLElement,
  parentRect: Rect,
  rects: Map<string, Rect>,
): void {
  const rect = rects.get(node.id);
  if (!rect) return;
  const el = findDirectChildByAiuiId(parentEl, node.id);
  if (!el) return;
  el.style.left = `${rect.x - parentRect.x}px`;
  el.style.top = `${rect.y - parentRect.y}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  for (const child of node.children ?? []) {
    patchSubtree(child, el, rect, rects);
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
    applyPrimitiveContent(el, node);
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
  const {
    container,
    layoutWidth: layoutWidthOpt,
    diagnostics = defaultDiagnosticsSink,
  } = options;
  let config: unknown = options.config;

  let disposed = false;
  let state: Record<string, unknown> = {};
  /** Reset `state` from `doc.state` only after `update()` or initial mount. */
  let shouldResetStateFromDoc = true;
  /** Same `config` reference as last successful full mount → layout-only fast path. */
  let prevConfigRef: unknown;
  /** Last successfully rendered document (for structural sync on new `config` references). */
  let prevDoc: AiuiDocument | undefined;
  const disposersByNodeId = new Map<string, (() => void)[]>();

  /** Latest parsed document (for `navigateScreen` / modal closure). */
  let latestDoc: AiuiDocument | undefined;
  /** In-app router: which screen is rendered when multiple screens exist. */
  let currentScreenId = "";
  /** Modal stack of screen ids (`modal` action targets). */
  let modalStack: string[] = [];

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

  function clearListenersForNodeId(nodeId: string): void {
    const list = disposersByNodeId.get(nodeId);
    if (!list) return;
    for (const d of list) d();
    disposersByNodeId.delete(nodeId);
  }

  function disposeListenersForSubtree(node: UiNode): void {
    walkUiNodes(node, (n) => clearListenersForNodeId(n.id));
  }

  function clearListenersAndDom(): void {
    for (const list of disposersByNodeId.values()) {
      for (const d of list) d();
    }
    disposersByNodeId.clear();
    container.replaceChildren();
  }

  const env: ActionEnvironment = {
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    navigate: (href) => {
      window.location.assign(href);
    },
    navigateScreen: (screenId) => {
      const doc = latestDoc;
      if (!doc?.screens[screenId]) return;
      currentScreenId = screenId;
      scheduleFlush();
    },
    modal: (target, action) => {
      if (action === "open") {
        modalStack.push(target);
      } else {
        const idx = modalStack.lastIndexOf(target);
        if (idx >= 0) modalStack.splice(idx, 1);
      }
      scheduleFlush();
    },
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  };

  function bindEvents(el: HTMLElement, node: UiNode): void {
    clearListenersForNodeId(node.id);
    const list: (() => void)[] = [];
    for (const [eventName, actions] of Object.entries(node.events ?? {})) {
      if (!actions?.length) continue;
      const handler = (): void => {
        void (async () => {
          try {
            await runActions(actions, env);
          } catch (err) {
            diagnostics({
              code: "ACTION_EXECUTION_FAILED",
              source: "logic",
              severity: "error",
              nodeId: node.id,
              summary: "Action execution failed",
              details: {
                eventName,
                message: err instanceof Error ? err.message : String(err),
              },
            });
          }
          scheduleFlush();
        })();
      };
      el.addEventListener(eventName, handler);
      list.push(() => el.removeEventListener(eventName, handler));
    }
    if (list.length) disposersByNodeId.set(node.id, list);
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

  function syncChildren(
    oldChildren: UiNode[] | undefined,
    newChildren: UiNode[] | undefined,
    parentEl: HTMLElement,
    parentRect: Rect,
    rects: Map<string, Rect>,
  ): void {
    const oldList = oldChildren ?? [];
    const newList = newChildren ?? [];
    const oldById = new Map(oldList.map((c) => [c.id, c]));
    const newIds = new Set(newList.map((c) => c.id));

    for (const old of oldList) {
      if (!newIds.has(old.id)) {
        const el = findDirectChildByAiuiId(parentEl, old.id);
        if (el) {
          disposeListenersForSubtree(old);
          el.remove();
        }
      }
    }

    for (const newChild of newList) {
      const oldChild = oldById.get(newChild.id);
      if (oldChild) {
        syncNode(oldChild, newChild, parentEl, parentRect, rects);
      } else {
        mountSubtree(newChild, parentEl, parentRect, rects, bindEvents, onNodeError);
      }
    }

    ensureAiuiChildOrder(parentEl, newList.map((c) => c.id));
  }

  function syncNode(
    oldNode: UiNode | null,
    newNode: UiNode,
    parentEl: HTMLElement,
    parentRect: Rect,
    rects: Map<string, Rect>,
  ): void {
    if (oldNode === null) {
      mountSubtree(newNode, parentEl, parentRect, rects, bindEvents, onNodeError);
      return;
    }
    if (oldNode.id !== newNode.id) {
      const oldEl = findDirectChildByAiuiId(parentEl, oldNode.id);
      if (oldEl) {
        disposeListenersForSubtree(oldNode);
        oldEl.remove();
      }
      mountSubtree(newNode, parentEl, parentRect, rects, bindEvents, onNodeError);
      return;
    }

    const rect = rects.get(newNode.id);
    if (!rect) return;
    const el = findDirectChildByAiuiId(parentEl, newNode.id);
    if (!el) {
      mountSubtree(newNode, parentEl, parentRect, rects, bindEvents, onNodeError);
      return;
    }

    el.style.left = `${rect.x - parentRect.x}px`;
    el.style.top = `${rect.y - parentRect.y}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    el.dataset.aiuiType = newNode.type;
    applyPrimitiveStyle(el, newNode);
    applyPrimitiveContent(el, newNode);
    if (!eventsEqual(oldNode.events, newNode.events)) {
      bindEvents(el, newNode);
    }
    syncChildren(oldNode.children, newNode.children, el, rect, rects);
  }

  function rebuild(): void {
    const parsed = safeParseDocumentWithMigration(config);
    if (!parsed.success) {
      clearListenersAndDom();
      prevConfigRef = undefined;
      prevDoc = undefined;
      diagnostics({
        code: "DSL_PARSE_FAILED",
        source: "schema",
        severity: "error",
        summary: "Invalid DSL payload",
        details: { issues: parsed.error.issues.map((i) => i.message) },
      });
      showParseError(
        container,
        `Invalid DSL: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
      return;
    }

    const doc: AiuiDocument = parsed.data;
    latestDoc = doc;

    if (shouldResetStateFromDoc) {
      state = cloneState(doc.state);
      currentScreenId = doc.initialScreenId;
      modalStack = [];
      shouldResetStateFromDoc = false;
    }

    if (!currentScreenId || !doc.screens[currentScreenId]) {
      currentScreenId = doc.initialScreenId;
    }

    const mainRoot =
      doc.screens[currentScreenId]?.root ?? getRuntimeScreenRoot(doc);

    const multiScreen =
      Object.keys(doc.screens).length > 1 ||
      currentScreenId !== doc.initialScreenId ||
      modalStack.length > 0;

    const lw = rootLayoutWidth(container, layoutWidthOpt);
    const rects = layoutDocument(mainRoot, { width: lw });
    const rootRect = rects.get(mainRoot.id);
    if (!rootRect) {
      clearListenersAndDom();
      prevConfigRef = undefined;
      prevDoc = undefined;
      diagnostics({
        code: "LAYOUT_ROOT_MISSING",
        source: "layout",
        severity: "critical",
        summary: "Layout failed due to missing root rect",
      });
      showParseError(container, "Layout failed: missing root rect.");
      return;
    }

    const origin: Rect = { x: 0, y: 0, width: 0, height: 0 };
    const canLayoutOnly =
      !multiScreen &&
      prevConfigRef === config &&
      prevDoc !== undefined;

    if (canLayoutOnly) {
      container.style.minHeight = `${rootRect.height}px`;
      patchSubtree(mainRoot, container, origin, rects);
      return;
    }

    const prevMain =
      prevDoc !== undefined
        ? (prevDoc.screens[currentScreenId]?.root ?? getRuntimeScreenRoot(prevDoc))
        : undefined;

    const canSync =
      !multiScreen &&
      prevDoc !== undefined &&
      prevMain !== undefined &&
      prevMain.id === mainRoot.id &&
      findDirectChildByAiuiId(container, mainRoot.id) !== null;

    if (canSync && prevDoc) {
      try {
        container.style.position = "relative";
        container.style.boxSizing = "border-box";
        container.style.minHeight = `${rootRect.height}px`;
        container.style.width = "100%";
        syncNode(prevMain, mainRoot, container, origin, rects);
        prevDoc = doc;
        prevConfigRef = config;
        return;
      } catch {
        // fall through to full remount
      }
    }

    clearListenersAndDom();
    prevDoc = undefined;
    prevConfigRef = undefined;

    container.style.position = "relative";
    container.style.boxSizing = "border-box";
    container.style.minHeight = `${rootRect.height}px`;
    container.style.width = "100%";

    try {
      mountSubtree(
        mainRoot,
        container,
        origin,
        rects,
        bindEvents,
        onNodeError,
      );

      const topModalId = modalStack[modalStack.length - 1];
      const modalRoot =
        topModalId !== undefined ? doc.screens[topModalId]?.root : undefined;
      if (modalRoot) {
        const overlay = document.createElement("div");
        overlay.dataset.aiuiModalOverlay = "1";
        overlay.style.position = "absolute";
        overlay.style.inset = "0";
        overlay.style.zIndex = "999";
        overlay.style.background = "rgba(0, 0, 0, 0.45)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.pointerEvents = "auto";
        overlay.style.boxSizing = "border-box";
        container.appendChild(overlay);

        const modalRects = layoutDocument(modalRoot, { width: lw });
        const modalHost = document.createElement("div");
        modalHost.style.position = "relative";
        modalHost.style.maxWidth = "min(96vw, 720px)";
        modalHost.style.maxHeight = "90vh";
        modalHost.style.overflow = "auto";
        overlay.appendChild(modalHost);
        const modalOrigin: Rect = { x: 0, y: 0, width: 0, height: 0 };
        mountSubtree(
          modalRoot,
          modalHost,
          modalOrigin,
          modalRects,
          bindEvents,
          onNodeError,
        );
      }

      prevDoc = doc;
      prevConfigRef = config;
    } catch (e) {
      diagnostics({
        code: "RUNTIME_MOUNT_FAILED",
        source: "runtime",
        severity: "critical",
        summary: "Runtime mount failed",
        details: { message: e instanceof Error ? e.message : String(e) },
      });
      clearListenersAndDom();
      prevConfigRef = undefined;
      prevDoc = undefined;
      showParseError(
        container,
        `Render failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  function update(next: unknown): void {
    if (disposed) return;
    config = next;
    shouldResetStateFromDoc = true;
    rebuild();
  }

  function relayout(): void {
    if (disposed) return;
    shouldResetStateFromDoc = false;
    rebuild();
  }

  function destroy(): void {
    if (disposed) return;
    disposed = true;
    clearListenersAndDom();
    prevConfigRef = undefined;
    prevDoc = undefined;
  }

  function getState(): Record<string, unknown> {
    return state;
  }

  rebuild();

  return { update, relayout, destroy, getState };
}
