import { afterEach, describe, expect, it, vi } from "vitest"
import { shuffleTilePositions } from "./shuffle-positions"

const tiles = [
  { id: 0, letter: "C", pos: { x: 10, y: 200 } },
  { id: 1, letter: "A", pos: { x: 55, y: 30 } },
  { id: 2, letter: "T", pos: { x: 300, y: 120 } },
]

describe("shuffleTilePositions", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("reuses exactly the tiles' existing positions", () => {
    const result = shuffleTilePositions(tiles)

    const byX = (a: { x: number }, b: { x: number }) => a.x - b.x
    expect(result.map((t) => t.pos).sort(byX)).toEqual(
      tiles.map((t) => t.pos).sort(byX),
    )
  })

  it("keeps each tile's other fields and order", () => {
    const result = shuffleTilePositions(tiles)

    expect(result.map(({ id, letter }) => ({ id, letter }))).toEqual(
      tiles.map(({ id, letter }) => ({ id, letter })),
    )
  })

  it("moves letters between positions for a given random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)

    expect(shuffleTilePositions(tiles).map((t) => t.pos)).toEqual([
      { x: 55, y: 30 },
      { x: 300, y: 120 },
      { x: 10, y: 200 },
    ])
  })

  it("does not mutate the input tiles", () => {
    const before = structuredClone(tiles)

    shuffleTilePositions(tiles)

    expect(tiles).toEqual(before)
  })

  it("leaves locked tiles where they are", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)

    const result = shuffleTilePositions(tiles, (tile) => tile.id === 0)

    expect(result.map((t) => t.pos)).toEqual([
      { x: 10, y: 200 },
      { x: 300, y: 120 },
      { x: 55, y: 30 },
    ])
  })

  it("handles empty input", () => {
    expect(shuffleTilePositions([])).toEqual([])
  })
})
