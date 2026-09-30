import { afterEach, describe, expect, it, vi } from "vitest"
import { shuffle, shuffleUnlocked } from "./shuffle"

describe("shuffle", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("keeps exactly the same letters", () => {
    const letters = "CRYPTIC".split("")

    const result = shuffle([...letters])

    expect([...result].sort()).toEqual([...letters].sort())
  })

  it("shuffles in place and returns the same array", () => {
    const letters = ["A", "B", "C"]

    expect(shuffle(letters)).toBe(letters)
  })

  it("produces a predictable order for a given random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)

    expect(shuffle(["A", "B", "C"])).toEqual(["B", "C", "A"])
  })

  it("handles empty and single-letter input", () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle(["A"])).toEqual(["A"])
  })
})

describe("shuffleUnlocked", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const isLowerCase = (letter: string) => letter === letter.toLowerCase()

  it("leaves locked items at their index", () => {
    for (let run = 0; run < 20; run++) {
      const result = shuffleUnlocked("aBCdEF".split(""), isLowerCase)

      expect(result[0]).toBe("a")
      expect(result[3]).toBe("d")
    }
  })

  it("keeps exactly the same items", () => {
    const letters = "CrYPtIC".split("")

    const result = shuffleUnlocked(letters, isLowerCase)

    expect([...result].sort()).toEqual([...letters].sort())
  })

  it("shuffles the unlocked items among the unlocked indices", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)

    // The unlocked A, B, C shuffle to B, C, A as in the test above
    expect(shuffleUnlocked(["A", "x", "B", "C"], isLowerCase)).toEqual([
      "B",
      "x",
      "C",
      "A",
    ])
  })

  it("passes each item's index to isLocked", () => {
    const result = shuffleUnlocked(["A", "B", "C"], (_, index) => index !== 1)

    expect(result).toEqual(["A", "B", "C"])
  })

  it("does not mutate the array it is given", () => {
    const letters = ["A", "b", "C", "D"]

    shuffleUnlocked(letters, isLowerCase)

    expect(letters).toEqual(["A", "b", "C", "D"])
  })
})
