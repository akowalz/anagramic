import { TILE_SIZE } from "../DraggableTile/DraggableTile"

export type Pos = { x: number; y: number }

/*
 * Area tiles must stay within, in canvas coordinates. It can extend past the
 * canvas (e.g. a negative left) since tiles may sit in the margins around it.
 */
export type Bounds = { left: number; top: number; right: number; bottom: number }

/* Breathing room left between tiles once repulsion has separated them */
export const TILE_GAP = 6

/* Cap on repulsion cascades, in case a crowded canvas can't fully settle */
const MAX_PUSH_PASSES = 20

/*
 * After a tile is dropped, push any tiles it overlaps out of the way.
 * The dropped tile is first pulled back inside the bounds (it may have been
 * released past the edge), then never moves; every other tile can be pushed,
 * including by tiles that were themselves pushed. Runs repeated passes until
 * no overlaps remain (or the pass cap is hit).
 */
export function resolveOverlaps<T extends { id: number; pos: Pos }>(
  tiles: T[],
  droppedId: number,
  bounds: Bounds,
): T[] {
  const positions = tiles.map((tile) => ({ ...tile.pos }))
  const settledDist = TILE_SIZE + TILE_GAP

  const maxX = Math.max(bounds.left, bounds.right - TILE_SIZE)
  const maxY = Math.max(bounds.top, bounds.bottom - TILE_SIZE)
  const clamp = (pos: Pos): Pos => ({
    x: Math.min(Math.max(pos.x, bounds.left), maxX),
    y: Math.min(Math.max(pos.y, bounds.top), maxY),
  })

  const droppedIndex = tiles.findIndex((tile) => tile.id === droppedId)
  if (droppedIndex !== -1) {
    positions[droppedIndex] = clamp(positions[droppedIndex])
  }

  for (let pass = 0; pass < MAX_PUSH_PASSES; pass++) {
    let anyPushed = false

    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const posA = positions[i]
        const posB = positions[j]

        const dx = posB.x - posA.x
        const dy = posB.y - posA.y

        // Tiles are axis-aligned squares: no overlap unless both axes overlap
        if (Math.abs(dx) >= TILE_SIZE || Math.abs(dy) >= TILE_SIZE) continue

        // Separate along the axis that needs the smallest shift
        const pushX = (dx >= 0 ? 1 : -1) * (settledDist - Math.abs(dx))
        const pushY = (dy >= 0 ? 1 : -1) * (settledDist - Math.abs(dy))
        const push =
          Math.abs(pushX) < Math.abs(pushY)
            ? { x: pushX, y: 0 }
            : { x: 0, y: pushY }

        if (tiles[i].id === droppedId) {
          positions[j] = clamp({ x: posB.x + push.x, y: posB.y + push.y })
        } else if (tiles[j].id === droppedId) {
          positions[i] = clamp({ x: posA.x - push.x, y: posA.y - push.y })
        } else {
          positions[i] = clamp({ x: posA.x - push.x / 2, y: posA.y - push.y / 2 })
          positions[j] = clamp({ x: posB.x + push.x / 2, y: posB.y + push.y / 2 })
        }
        anyPushed = true
      }
    }

    if (!anyPushed) break
  }

  return tiles.map((tile, index) => ({ ...tile, pos: positions[index] }))
}
