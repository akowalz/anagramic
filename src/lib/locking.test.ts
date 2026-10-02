import { describe, expect, it } from "vitest"
import { toggleLocked } from "./locking"

const tiles = [
  { id: "a", letter: "C", locked: false },
  { id: "b", letter: "A", locked: true },
]

describe("toggleLocked", () => {
  it("locks an unlocked tile", () => {
    expect(toggleLocked(tiles, "a").map((t) => t.locked)).toEqual([true, true])
  })

  it("unlocks a locked tile", () => {
    expect(toggleLocked(tiles, "b").map((t) => t.locked)).toEqual([
      false,
      false,
    ])
  })

  it("does not mutate the tiles it is given", () => {
    const before = structuredClone(tiles)

    toggleLocked(tiles, "a")

    expect(tiles).toEqual(before)
  })
})
