export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type IntrinsicSize = {
  width: number;
  height: number;
};

export type LayoutConstraints = {
  /** Available width for the document root. */
  width: number;
  /** Optional max height for the root (clips row stacks). */
  maxHeight?: number;
};

export type LayoutOptions = {
  /** Per-node intrinsic sizes (e.g. measured text); defaults apply when missing. */
  intrinsics?: Map<string, IntrinsicSize>;
};
