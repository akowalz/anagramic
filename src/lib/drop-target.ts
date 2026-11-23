import type { Pos } from "./resolve-overlaps"

/*
 * Dragging a tile onto another swaps them. Each tile has a round drop zone
 * around it: while the dragged tile's center is within `radius` of a tile's
 * center, that tile is the one it would swap with (the nearest, if several).
 *
 * Once a tile is the target it's sticky: it stays the target until the point
 * is more than `keepRadius` from it, or is in another tile's zone and nearer
 * to that tile. Otherwise the last little movement as a finger lifts off the
 * screen could move it just outside the zone, and the swap it was showing
 * wouldn't happen.
 */
export function findDropTarget(
  point: Pos,
  candidates: { id: number; center: Pos }[],
  radius: number,
  current?: { id: number; keepRadius: number },
): number | null {
  const distanceTo = (center: Pos) =>
    Math.hypot(point.x - center.x, point.y - center.y)

  let best: { id: number; distance: number } | null = null
  for (const { id, center } of candidates) {
    const distance = distanceTo(center)
    if (distance <= radius && (!best || distance < best.distance)) {
      best = { id, distance }
    }
  }

  const kept = current && candidates.find(({ id }) => id === current.id)
  if (kept) {
    const distance = distanceTo(kept.center)
    if (
      distance <= current.keepRadius &&
      (!best || best.distance >= distance)
    ) {
      return kept.id
    }
  }

  return best?.id ?? null
}
