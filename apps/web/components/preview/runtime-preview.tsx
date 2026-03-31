"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { render } from "@aiui/runtime-core";
import { useEffect, useRef } from "react";

/**
 * Mounts the real `@aiui/runtime-core` pipeline (layout + DOM + events) for the
 * same document shape the builder edits.
 */
export function RuntimePreview(props: { document: AiuiDocument }) {
  const { document } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef(document);
  docRef.current = document;

  useEffect(() => {
    const el = containerRef.current;
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

  return (
    <div
      ref={containerRef}
      className="min-h-[140px] w-full rounded-xl border border-border bg-muted/25 p-4"
    />
  );
}
