/**
 * Text / intrinsic measurement hooks for future text nodes and caching.
 * The layout engine does not touch the DOM; hosts pass measured sizes via `intrinsics`.
 */

export type TextMeasureFn = (
  text: string,
  fontSizePx: number,
) => {
  width: number;
  height: number;
};

/** Simple LRU-style cache keyed by font size + text. */
export function createTextMeasureCache(measure: TextMeasureFn) {
  const cache = new Map<string, { width: number; height: number }>();
  return function measureText(
    text: string,
    fontSizePx = 14,
  ): { width: number; height: number } {
    const key = `${fontSizePx}\0${text}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const r = measure(text, fontSizePx);
    cache.set(key, r);
    return r;
  };
}

/** Placeholder until text components exist; does not affect current Box/Stack-only trees. */
export function noopTextMeasure(): { width: number; height: number } {
  return { width: 0, height: 0 };
}
