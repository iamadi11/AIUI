import type { AiuiDocument } from "@aiui/dsl-schema";
import { render } from "@aiui/runtime-core";
import { useEffect, useRef } from "react";

export type AiuiRuntimeProps = {
  document: AiuiDocument;
  className?: string;
};

/**
 * React host for `@aiui/runtime-core`: mounts `render`, keeps layout in sync on
 * resize via `ResizeObserver`, and tears down on unmount.
 */
export function AiuiRuntime(props: AiuiRuntimeProps) {
  const { document, className } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const docRef = useRef(document);
  docRef.current = document;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const rt = render({ container: el, config: document });
    const ro = new ResizeObserver(() => {
      rt.update(docRef.current);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      rt.destroy();
    };
  }, [document]);

  return <div ref={hostRef} className={className} />;
}
