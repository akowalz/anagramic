import type { Pos } from "./resolve-overlaps"

/*
 * Dragging a tile onto another swaps them. Each tile has a round drop zone
 * around it: while the dragged tile's center is within `radius` of a tile's
 * center, that tile is the one it would swap with (the nearest, if several).
 */
export function findDropTarget(
  point: Pos,
  candidates: { id: number; center: Pos }[],
  radius: number,
): number | null {
  let best: { id: number; distance: number } | null = null

  for (const { id, center } of candidates) {
    const distance = Math.hypot(point.x - center.x, point.y - center.y)
    if (distance <= radius && (!best || distance < best.distance)) {
      best = { id, distance }
    }
  }

  return best?.id ?? null
}
