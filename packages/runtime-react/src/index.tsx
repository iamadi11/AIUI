import type { AiuiDocument } from "@aiui/dsl-schema";
import { render, type RuntimeHandle } from "@aiui/runtime-core";
import { useEffect, useLayoutEffect, useRef } from "react";

export type AiuiRuntimeProps = {
  document: AiuiDocument;
  className?: string;
};

/**
 * React host for `@aiui/runtime-core`: one `render()` per mount, `update` on
 * prop changes (synced in `useLayoutEffect` before paint), `ResizeObserver` for
 * width, `destroy` on unmount.
 */
export function AiuiRuntime(props: AiuiRuntimeProps) {
  const { document, className } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<RuntimeHandle | null>(null);
  const docRef = useRef(document);
  docRef.current = document;

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (!runtimeRef.current) {
      runtimeRef.current = render({ container: el, config: document });
    } else {
      runtimeRef.current.update(document);
    }
  }, [document]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let pending = false;
    const ro = new ResizeObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        runtimeRef.current?.relayout();
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className={className} />;
}
