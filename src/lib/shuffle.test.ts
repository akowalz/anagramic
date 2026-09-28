import { afterEach, describe, expect, it, vi } from "vitest"
import { shuffle } from "./shuffle"

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
