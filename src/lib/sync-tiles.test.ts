import { describe, expect, it } from "vitest"
import {
  syncRearrangedTiles,
  syncSlots,
  syncTilesByPosition,
} from "./sync-tiles"

type Tile = { letter: string; initialPosition: number }

function tile(letter: string, initialPosition: number): Tile {
  return { letter, initialPosition }
}

function tilesFor(word: string): Tile[] {
  return word.split("").map((letter, index) => tile(letter, index))
}

function lettersOf(tiles: Tile[]): string {
  return tiles.map((t) => t.letter).join("")
}

const lettersFor = (word: string) => word.split("")

describe("syncTilesByPosition", () => {
  it("keeps the same tiles when the letters haven't changed", () => {
    const tiles = tilesFor("CAT")

    const synced = syncTilesByPosition(tiles, lettersFor("CAT"), tile)

    expect(synced).toEqual(tiles)
    synced.forEach((t, i) => expect(t).toBe(tiles[i]))
  })

  it("adds a tile for a letter typed at the end", () => {
    const tiles = tilesFor("CA")

    const synced = syncTilesByPosition(tiles, lettersFor("CAT"), tile)

    expect(lettersOf(synced)).toBe("CAT")
    expect(synced[0]).toBe(tiles[0])
    expect(synced[1]).toBe(tiles[1])
  })

  it("removes the tile for a deleted letter", () => {
    const tiles = tilesFor("CAT")

    const synced = syncTilesByPosition(tiles, lettersFor("CA"), tile)

    expect(synced).toEqual([tiles[0], tiles[1]])
  })

  it("replaces a tile whose letter changed", () => {
    const tiles = tilesFor("CAT")

    const synced = syncTilesByPosition(tiles, lettersFor("CAR"), tile)

    expect(lettersOf(synced)).toBe("CAR")
    expect(synced[2]).not.toBe(tiles[2])
  })

  it("starts from nothing", () => {
    expect(lettersOf(syncTilesByPosition([], lettersFor("HI"), tile))).toBe(
      "HI",
    )
    expect(syncTilesByPosition(tilesFor("HI"), [], tile)).toEqual([])
  })
})

describe("syncRearrangedTiles", () => {
  it("keeps rearranged tiles in their order", () => {
    const [c, a, t] = tilesFor("CAT")

    const synced = syncRearrangedTiles([t, c, a], lettersFor("CAT"), tile)

    expect(lettersOf(synced)).toBe("TCA")
  })

  it("adds a new tile at the end of the rearranged tiles", () => {
    const [c, a, t] = tilesFor("CAT")

    const synced = syncRearrangedTiles([t, c, a], lettersFor("CATS"), tile)

    expect(lettersOf(synced)).toBe("TCAS")
    expect(synced[3]).toEqual(tile("S", 3))
    expect(synced.slice(0, 3)).toEqual([t, c, a])
  })

  it("removes the tile for the deleted letter wherever it is", () => {
    const [c, a, t] = tilesFor("CAT")

    const synced = syncRearrangedTiles([t, c, a], lettersFor("CA"), tile)

    expect(synced).toEqual([c, a])
  })

  it("gives a retyped letter a new tile", () => {
    const [c, a, t] = tilesFor("CAT")

    const synced = syncRearrangedTiles([t, c, a], lettersFor("CAR"), tile)

    expect(lettersOf(synced)).toBe("CAR")
    expect(synced).toEqual([c, a, tile("R", 2)])
  })

  it("does not mutate the tiles it is given", () => {
    const tiles = tilesFor("CAT")

    syncRearrangedTiles(tiles, lettersFor("C"), tile)

    expect(lettersOf(tiles)).toBe("CAT")
  })
})

describe("syncSlots", () => {
  it("gives a new tile the next slot", () => {
    const [c, a] = tilesFor("CA")
    const t = tile("T", 2)

    expect(syncSlots([c, a], [0, 1], [c, a, t])).toEqual([0, 1, 2])
  })

  it("keeps shuffled tiles in their slots when adding a tile", () => {
    const [c, a] = tilesFor("CA")
    const t = tile("T", 2)

    expect(syncSlots([c, a], [1, 0], [c, a, t])).toEqual([1, 0, 2])
  })

  it("closes the gap left by a removed tile", () => {
    const [c, a, t] = tilesFor("CAT")

    // C is in slot 2, A in slot 0 and T (removed) in slot 1
    expect(syncSlots([c, a, t], [2, 0, 1], [c, a])).toEqual([1, 0])
  })

  it("handles removing and adding together", () => {
    const [c, a, t] = tilesFor("CAT")
    const r = tile("R", 2)

    // T (slot 1) is replaced by R: C and A keep their order, R goes last
    expect(syncSlots([c, a, t], [2, 0, 1], [c, a, r])).toEqual([1, 0, 2])
  })

  it("returns no slots when every tile is removed", () => {
    expect(syncSlots(tilesFor("CAT"), [0, 1, 2], [])).toEqual([])
  })
})
