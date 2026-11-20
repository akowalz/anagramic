import { describe, expect, it } from "vitest"
import { TILE_SIZE } from "../DraggableTile/DraggableTile"
import { TILE_GAP, type Bounds, type Pos } from "./resolve-overlaps"
import { clampToBounds, fitToBounds, placeClearOfTiles } from "./place-tiles"

type TestTile = { id: number; pos: Pos; locked?: boolean }

const bounds: Bounds = { left: 0, top: 0, right: 400, bottom: 300 }

function tileAt(id: number, x: number, y: number, locked = false): TestTile {
  return { id, pos: { x, y }, locked }
}

function overlaps(a: Pos, b: Pos) {
  return Math.abs(a.x - b.x) < TILE_SIZE && Math.abs(a.y - b.y) < TILE_SIZE
}

describe("clampToBounds", () => {
  it("leaves a position inside the bounds alone", () => {
    expect(clampToBounds({ x: 100, y: 100 }, bounds)).toEqual({
      x: 100,
      y: 100,
    })
  })

  it("keeps the whole tile inside the bounds", () => {
    expect(clampToBounds({ x: 1000, y: 1000 }, bounds)).toEqual({
      x: 400 - TILE_SIZE,
      y: 300 - TILE_SIZE,
    })
    expect(clampToBounds({ x: -50, y: -50 }, bounds)).toEqual({ x: 0, y: 0 })
  })

  it("uses the top left when the bounds are smaller than a tile", () => {
    const tiny: Bounds = { left: 10, top: 20, right: 20, bottom: 30 }

    expect(clampToBounds({ x: 50, y: 50 }, tiny)).toEqual({ x: 10, y: 20 })
  })
})

describe("fitToBounds", () => {
  it("returns the same tiles when they are all inside the bounds", () => {
    const tiles = [tileAt(0, 0, 0), tileAt(1, 100, 100)]

    expect(fitToBounds(tiles, bounds)).toBe(tiles)
  })

  it("pulls tiles back in when the bounds shrink", () => {
    const tiles = [tileAt(0, 300, 250)]
    const smaller: Bounds = { left: 0, top: 0, right: 200, bottom: 150 }

    const [tile] = fitToBounds(tiles, smaller)

    expect(tile.pos).toEqual({ x: 200 - TILE_SIZE, y: 150 - TILE_SIZE })
  })

  it("separates tiles that end up on top of each other", () => {
    // Both were at the bottom of a taller canvas
    const tiles = [tileAt(0, 100, 250), tileAt(1, 100, 290)]
    const smaller: Bounds = { left: 0, top: 0, right: 400, bottom: 150 }

    const fitted = fitToBounds(tiles, smaller)

    expect(overlaps(fitted[0].pos, fitted[1].pos)).toBe(false)
    fitted.forEach((tile) => {
      expect(tile.pos.y).toBeLessThanOrEqual(150 - TILE_SIZE)
    })
  })

  it("does not mutate the tiles it is given", () => {
    const tiles = [tileAt(0, 300, 250)]

    fitToBounds(tiles, { left: 0, top: 0, right: 200, bottom: 150 })

    expect(tiles[0].pos).toEqual({ x: 300, y: 250 })
  })
})

describe("placeClearOfTiles", () => {
  it("puts the tile at the position when nothing is in the way", () => {
    const tiles = [tileAt(0, 0, 0), tileAt(1, 0, 0)]

    const placed = placeClearOfTiles(tiles, 1, { x: 200, y: 100 }, bounds)

    expect(placed[1].pos).toEqual({ x: 200, y: 100 })
  })

  it("leaves the other tiles where they were", () => {
    const tiles = [tileAt(0, 100, 100), tileAt(1, 0, 0)]

    const placed = placeClearOfTiles(tiles, 1, { x: 110, y: 100 }, bounds)

    expect(placed[0].pos).toEqual({ x: 100, y: 100 })
  })

  it("moves the tile off one it would land on", () => {
    const tiles = [tileAt(0, 100, 100), tileAt(1, 0, 0)]

    const placed = placeClearOfTiles(tiles, 1, { x: 110, y: 100 }, bounds)

    expect(overlaps(placed[0].pos, placed[1].pos)).toBe(false)
    expect(
      Math.max(
        Math.abs(placed[1].pos.x - placed[0].pos.x),
        Math.abs(placed[1].pos.y - placed[0].pos.y),
      ),
    ).toBeGreaterThanOrEqual(TILE_SIZE + TILE_GAP)
  })

  it("keeps locked flags as they were", () => {
    const tiles = [tileAt(0, 100, 100, true), tileAt(1, 0, 0)]

    const placed = placeClearOfTiles(tiles, 1, { x: 110, y: 100 }, bounds)

    expect(placed.map((tile) => tile.locked)).toEqual([true, false])
  })
})
