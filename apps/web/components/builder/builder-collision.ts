import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { CanvasDropData } from "./dnd-types";

/**
 * Prefer the innermost droppable when nested canvas nodes overlap, so drops
 * target the intended parent.
 */
export const canvasPointerCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  if (collisions.length === 0) {
    return closestCorners(args);
  }
  if (collisions.length === 1) return collisions;

  let best = collisions[0];
  let bestDepth = -1;
  for (const c of collisions) {
    const container = args.droppableContainers.find((d) => d.id === c.id);
    const depth = (container?.data.current as CanvasDropData | undefined)?.depth;
    const d = typeof depth === "number" ? depth : 0;
    if (d > bestDepth) {
      bestDepth = d;
      best = c;
    }
  }
  return [best];
};
