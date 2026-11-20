import { describe, expect, it } from "vitest"
import { syncTilesInLetterOrder } from "./sync-tiles"
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
