import { describe, expect, it } from "vitest"
import {
  sortByInitialPosition,
  swapTiles,
  type Tile,
} from "./useMoveableLetters"

function tilesFor(word: string): Tile[] {
  return word.split("").map((letter, index) => ({
    id: `${letter}${index}`,
    letter,
    initialPosition: index,
    locked: false,
  }))
}

function lettersOf(tiles: Tile[]): string {
  return tiles.map((t) => t.letter).join("")
}

describe("sortByInitialPosition", () => {
  it("restores the original letter order", () => {
    const [c, a, t] = tilesFor("CAT")

    expect(lettersOf(sortByInitialPosition([t, c, a]))).toBe("CAT")
  })

  it("does not mutate the array it is given", () => {
    const [c, a, t] = tilesFor("CAT")
    const scrambled = [t, c, a]

    sortByInitialPosition(scrambled)

    expect(lettersOf(scrambled)).toBe("TCA")
  })
})

describe("swapTiles", () => {
  it("swaps the tiles at the two indices", () => {
    expect(lettersOf(swapTiles(tilesFor("CAT"), 0, 2))).toBe("TAC")
  })

  it("leaves tiles unchanged when swapping an index with itself", () => {
    expect(lettersOf(swapTiles(tilesFor("CAT"), 1, 1))).toBe("CAT")
  })

  it("does not mutate the array it is given", () => {
    const tiles = tilesFor("CAT")

    swapTiles(tiles, 0, 2)

    expect(lettersOf(tiles)).toBe("CAT")
  })
})
