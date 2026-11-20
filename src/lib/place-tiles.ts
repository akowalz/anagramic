import { TILE_SIZE } from "../DraggableTile/DraggableTile"
import { resolveOverlaps, type Bounds, type Pos } from "./resolve-overlaps"

type Placed = { id: number; pos: Pos; locked?: boolean }

/* The nearest position to `pos` that keeps a tile inside the bounds */
export function clampToBounds(pos: Pos, bounds: Bounds): Pos {
  const maxX = Math.max(bounds.left, bounds.right - TILE_SIZE)
  const maxY = Math.max(bounds.top, bounds.bottom - TILE_SIZE)

  return {
    x: Math.min(Math.max(pos.x, bounds.left), maxX),
    y: Math.min(Math.max(pos.y, bounds.top), maxY),
  }
}

/*
 * Pull every tile back inside the bounds, e.g. after the canvas shrinks, then
 * push apart any tiles that ended up overlapping. Returns the same array when
 * every tile was already where it should be.
 */
export function fitToBounds<T extends Placed>(tiles: T[], bounds: Bounds): T[] {
  const clamped = tiles.map((tile) => ({
    ...tile,
    pos: clampToBounds(tile.pos, bounds),
  }))
  // No tile is being dropped here, so nothing is favoured when pushing apart
  const fitted = resolveOverlaps(clamped, -1, bounds)

  const unchanged = fitted.every(
    (tile, index) =>
      tile.pos.x === tiles[index].pos.x && tile.pos.y === tiles[index].pos.y,
  )
  return unchanged ? tiles : fitted
}

/*
 * Put a new tile at `pos`, moving it clear of any tiles it overlaps. The tiles
 * already there stay put, unlike a dropped tile, which pushes others aside.
 */
export function placeClearOfTiles<T extends Placed>(
  tiles: T[],
  id: number,
  pos: Pos,
  bounds: Bounds,
): T[] {
  const placed = tiles.map((tile) => (tile.id === id ? { ...tile, pos } : tile))

  // Treat every other tile as locked so only the new tile gives way
  const pinned = placed.map((tile) =>
    tile.id === id ? tile : { ...tile, locked: true },
  )
  const resolved = resolveOverlaps(pinned, id, bounds)

  return placed.map((tile, index) => ({ ...tile, pos: resolved[index].pos }))
}
