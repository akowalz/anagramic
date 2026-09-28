import { describe, expect, it } from "vitest"
import { resolveOverlaps, TILE_GAP } from "./resolve-overlaps"
import { TILE_SIZE } from "../DraggableTile/DraggableTile"

const BIG_BOUNDS = { width: 1000, height: 1000 }
const SETTLED = TILE_SIZE + TILE_GAP

function tile(id: number, x: number, y: number) {
  return { id, pos: { x, y } }
}

function overlaps(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) < TILE_SIZE && Math.abs(a.y - b.y) < TILE_SIZE
}

describe("resolveOverlaps", () => {
  it("leaves non-overlapping tiles where they are", () => {
    const tiles = [tile(0, 0, 0), tile(1, 100, 0), tile(2, 0, 100)]

    const result = resolveOverlaps(tiles, 0, BIG_BOUNDS)

    expect(result.map((t) => t.pos)).toEqual(tiles.map((t) => t.pos))
  })

  it("treats tiles that exactly touch as not overlapping", () => {
    const tiles = [tile(0, 0, 0), tile(1, TILE_SIZE, 0)]

    const result = resolveOverlaps(tiles, 0, BIG_BOUNDS)

    expect(result[1].pos).toEqual({ x: TILE_SIZE, y: 0 })
  })

  it("pulls a tile dropped past the canvas edge back inside", () => {
    const bounds = { width: 200, height: 300 }
    const tiles = [tile(0, -25, 400), tile(1, 500, -10)]

    const [first] = resolveOverlaps(tiles, 0, bounds)
    const [, second] = resolveOverlaps(tiles, 1, bounds)

    expect(first.pos).toEqual({ x: 0, y: 300 - TILE_SIZE })
    expect(second.pos).toEqual({ x: 200 - TILE_SIZE, y: 0 })
  })

  it("pushes tiles away from where the dropped tile lands after clamping", () => {
    const bounds = { width: 200, height: 200 }
    // Released far off the left edge, landing on top of tile 1
    const tiles = [tile(0, -300, 50), tile(1, 5, 50)]

    const result = resolveOverlaps(tiles, 0, bounds)

    expect(result[0].pos).toEqual({ x: 0, y: 50 })
    expect(overlaps(result[0].pos, result[1].pos)).toBe(false)
  })

  it("never moves the dropped tile", () => {
    const tiles = [tile(0, 100, 100), tile(1, 110, 110), tile(2, 90, 95)]

    const result = resolveOverlaps(tiles, 1, BIG_BOUNDS)

    expect(result[1].pos).toEqual({ x: 110, y: 110 })
  })

  it("pushes an overlapped tile along the axis needing the smaller shift", () => {
    // Mostly below the dropped tile, so a vertical push is shortest
    const tiles = [tile(0, 100, 100), tile(1, 110, 130)]

    const result = resolveOverlaps(tiles, 0, BIG_BOUNDS)

    expect(result[1].pos).toEqual({ x: 110, y: 100 + SETTLED })
  })

  it("pushes tiles that come before the dropped tile in the array", () => {
    // Mostly left of the dropped tile, so it should be pushed further left
    const tiles = [tile(0, 100, 100), tile(1, 110, 100)]

    const result = resolveOverlaps(tiles, 1, BIG_BOUNDS)

    expect(result[0].pos).toEqual({ x: 110 - SETTLED, y: 100 })
    expect(result[1].pos).toEqual({ x: 110, y: 100 })
  })

  it("cascades pushes so no tiles are left overlapping", () => {
    const tiles = [
      tile(0, 200, 200),
      tile(1, 220, 200),
      tile(2, 250, 205),
      tile(3, 280, 210),
    ]

    const result = resolveOverlaps(tiles, 0, BIG_BOUNDS)

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        expect(overlaps(result[i].pos, result[j].pos)).toBe(false)
      }
    }
  })

  it("keeps pushed tiles inside the canvas", () => {
    const bounds = { width: 120, height: 120 }
    // Dropped in the bottom-right corner, pushing the other tile toward the edge
    const tiles = [tile(0, 70, 70), tile(1, 75, 78)]

    const result = resolveOverlaps(tiles, 0, bounds)

    for (const { pos } of result) {
      expect(pos.x).toBeGreaterThanOrEqual(0)
      expect(pos.y).toBeGreaterThanOrEqual(0)
      expect(pos.x).toBeLessThanOrEqual(bounds.width - TILE_SIZE)
      expect(pos.y).toBeLessThanOrEqual(bounds.height - TILE_SIZE)
    }
  })

  it("preserves other tile fields and does not mutate its input", () => {
    const tiles = [
      { ...tile(0, 0, 0), letter: "A", zIndex: 2 },
      { ...tile(1, 10, 10), letter: "B", zIndex: 1 },
    ]
    const snapshot = structuredClone(tiles)

    const result = resolveOverlaps(tiles, 0, BIG_BOUNDS)

    expect(tiles).toEqual(snapshot)
    expect(result.map(({ letter, zIndex }) => ({ letter, zIndex }))).toEqual([
      { letter: "A", zIndex: 2 },
      { letter: "B", zIndex: 1 },
    ])
  })
})
