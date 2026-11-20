import { describe, expect, it } from "vitest"
import {
  syncRearrangedTiles,
  syncSlots,
  syncTilesInLetterOrder,
} from "./sync-tiles"
import { createLetter, lettersFromString, type Letter } from "./letters"

type Tile = { id: number; letter: string; initialPosition: number }

function tile(letter: Letter, initialPosition = 0): Tile {
  return { id: letter.id, letter: letter.char, initialPosition }
}

function tilesFor(letters: Letter[]): Tile[] {
  return letters.map((letter, index) => tile(letter, index))
}

function lettersOf(tiles: Tile[]): string {
  return tiles.map((t) => t.letter).join("")
}

describe("syncTilesInLetterOrder", () => {
  it("keeps the same tiles when the letters haven't changed", () => {
    const letters = lettersFromString("CAT")
    const tiles = tilesFor(letters)

    const synced = syncTilesInLetterOrder(tiles, letters, tile)

    synced.forEach((t, i) => expect(t).toBe(tiles[i]))
  })

  it("adds a tile for a letter typed at the end", () => {
    const letters = lettersFromString("CA")
    const tiles = tilesFor(letters)
    const t = createLetter("T")

    const synced = syncTilesInLetterOrder(tiles, [...letters, t], tile)

    expect(lettersOf(synced)).toBe("CAT")
    expect(synced[0]).toBe(tiles[0])
    expect(synced[1]).toBe(tiles[1])
  })

  it("removes the tile for a letter deleted from the middle", () => {
    const [c, a, t] = lettersFromString("CAT")
    const tiles = tilesFor([c, a, t])

    const synced = syncTilesInLetterOrder(tiles, [c, t], tile)

    expect(synced).toEqual([tiles[0], tiles[2]])
    expect(synced[1]).toBe(tiles[2])
  })

  it("removes the right one of two repeated letters", () => {
    const [c, o1, o2, l] = lettersFromString("COOL")
    const tiles = tilesFor([c, o1, o2, l])

    const synced = syncTilesInLetterOrder(tiles, [c, o1, l], tile)

    expect(synced.map((t) => t.id)).toEqual([c.id, o1.id, l.id])
  })

  it("starts from nothing", () => {
    const letters = lettersFromString("HI")

    expect(lettersOf(syncTilesInLetterOrder([], letters, tile))).toBe("HI")
    expect(syncTilesInLetterOrder(tilesFor(letters), [], tile)).toEqual([])
  })
})

describe("syncRearrangedTiles", () => {
  it("keeps rearranged tiles in their order", () => {
    const letters = lettersFromString("CAT")
    const [c, a, t] = tilesFor(letters)

    const synced = syncRearrangedTiles([t, c, a], letters, tile)

    expect(synced).toEqual([t, c, a])
    expect(synced[0]).toBe(t)
  })

  it("adds a new tile at the end of the rearranged tiles", () => {
    const letters = lettersFromString("CAT")
    const [c, a, t] = tilesFor(letters)
    const s = createLetter("S")

    const synced = syncRearrangedTiles([t, c, a], [...letters, s], tile)

    expect(lettersOf(synced)).toBe("TCAS")
    expect(synced[3]).toEqual(tile(s, 3))
    expect(synced.slice(0, 3)).toEqual([t, c, a])
  })

  it("removes the tile for a deleted letter wherever it is", () => {
    const [cl, al, tl] = lettersFromString("CAT")
    const [c, a, t] = tilesFor([cl, al, tl])

    const synced = syncRearrangedTiles([t, c, a], [cl, al], tile)

    expect(synced).toEqual([c, a])
  })

  it("updates where the letters after a deleted one now are", () => {
    const [cl, al, tl] = lettersFromString("CAT")
    const [c, a, t] = tilesFor([cl, al, tl])

    const synced = syncRearrangedTiles([t, c, a], [cl, tl], tile)

    expect(lettersOf(synced)).toBe("TC")
    expect(synced.map((t) => t.initialPosition)).toEqual([1, 0])
  })

  it("does not mutate the tiles it is given", () => {
    const letters = lettersFromString("CAT")
    const tiles = tilesFor(letters)

    syncRearrangedTiles(tiles, letters.slice(1), tile)

    expect(lettersOf(tiles)).toBe("CAT")
    expect(tiles.map((t) => t.initialPosition)).toEqual([0, 1, 2])
  })
})

describe("syncSlots", () => {
  it("gives a new tile the next slot", () => {
    const [c, a] = tilesFor(lettersFromString("CA"))
    const t = tile(createLetter("T"), 2)

    expect(syncSlots([c, a], [0, 1], [c, a, t])).toEqual([0, 1, 2])
  })

  it("keeps shuffled tiles in their slots when adding a tile", () => {
    const [c, a] = tilesFor(lettersFromString("CA"))
    const t = tile(createLetter("T"), 2)

    expect(syncSlots([c, a], [1, 0], [c, a, t])).toEqual([1, 0, 2])
  })

  it("closes the gap left by a removed tile", () => {
    const [c, a, t] = tilesFor(lettersFromString("CAT"))

    // C is in slot 2, A in slot 0 and T (removed) in slot 1
    expect(syncSlots([c, a, t], [2, 0, 1], [c, a])).toEqual([1, 0])
  })

  it("handles removing and adding together", () => {
    const [c, a, t] = tilesFor(lettersFromString("CAT"))
    const r = tile(createLetter("R"), 2)

    // T (slot 1) is replaced by R: C and A keep their order, R goes last
    expect(syncSlots([c, a, t], [2, 0, 1], [c, a, r])).toEqual([1, 0, 2])
  })

  it("returns no slots when every tile is removed", () => {
    expect(syncSlots(tilesFor(lettersFromString("CAT")), [0, 1, 2], [])).toEqual([])
  })
})
