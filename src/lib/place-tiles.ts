import { TILE_FOOTPRINT } from "../DraggableTile/DraggableTile"
import {
  resolveOverlaps,
  TILE_GAP,
  type Bounds,
  type Pos,
} from "./resolve-overlaps"

type Placed = { id: number; pos: Pos; locked?: boolean }

/* The nearest position to `pos` that keeps a tile inside the bounds */
export function clampToBounds(pos: Pos, bounds: Bounds): Pos {
  const maxX = Math.max(bounds.left, bounds.right - TILE_FOOTPRINT)
  const maxY = Math.max(bounds.top, bounds.bottom - TILE_FOOTPRINT)

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

/* How finely to look for a free spot, in px */
const SEARCH_STEP = 4

/*
 * The spot nearest `pos` where a tile fits inside the bounds, at least
 * `clearance` from every other tile along one axis or the other. Null when
 * there's no such spot (or the bounds don't end).
 */
export function nearestFreeSpot(
  others: Pos[],
  pos: Pos,
  bounds: Bounds,
  clearance = TILE_FOOTPRINT + TILE_GAP,
): Pos | null {
  const start = clampToBounds(pos, bounds)
  const maxX = Math.max(bounds.left, bounds.right - TILE_FOOTPRINT)
  const maxY = Math.max(bounds.top, bounds.bottom - TILE_FOOTPRINT)
  if (![bounds.left, bounds.top, maxX, maxY].every(Number.isFinite)) return null

  const isFree = (spot: Pos) =>
    others.every(
      (other) =>
        Math.abs(other.x - spot.x) >= clearance ||
        Math.abs(other.y - spot.y) >= clearance,
    )
  if (isFree(start)) return start

  // Every spot on a grid through the start, nearest first
  const spots: Pos[] = []
  const fromX =
    start.x - Math.floor((start.x - bounds.left) / SEARCH_STEP) * SEARCH_STEP
  const fromY =
    start.y - Math.floor((start.y - bounds.top) / SEARCH_STEP) * SEARCH_STEP
  for (let x = fromX; x <= maxX; x += SEARCH_STEP) {
    for (let y = fromY; y <= maxY; y += SEARCH_STEP) {
      spots.push({ x, y })
    }
  }
  const distance = (spot: Pos) => Math.hypot(spot.x - start.x, spot.y - start.y)
  spots.sort((a, b) => distance(a) - distance(b))

  return spots.find(isFree) ?? null
}

/*
 * Put a new tile at `pos`, or if that's taken, at the nearest free spot. The
 * tiles already there stay put, unlike a dropped tile, which pushes others
 * aside. Prefers a spot with a gap around it, then any spot that doesn't
 * overlap, and if the canvas is too full for either, just nudges the tile off
 * whatever it landed on.
 */
export function placeClearOfTiles<T extends Placed>(
  tiles: T[],
  id: number,
  pos: Pos,
  bounds: Bounds,
): T[] {
  const others = tiles.filter((tile) => tile.id !== id).map((tile) => tile.pos)
  const spot =
    nearestFreeSpot(others, pos, bounds) ??
    nearestFreeSpot(others, pos, bounds, TILE_FOOTPRINT)

  if (spot) {
    return tiles.map((tile) => (tile.id === id ? { ...tile, pos: spot } : tile))
  }

  const placed = tiles.map((tile) => (tile.id === id ? { ...tile, pos } : tile))

  // Treat every other tile as locked so only the new tile gives way
  const pinned = placed.map((tile) =>
    tile.id === id ? tile : { ...tile, locked: true },
  )
  const resolved = resolveOverlaps(pinned, id, bounds)

  return placed.map((tile, index) => ({ ...tile, pos: resolved[index].pos }))
}
