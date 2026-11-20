import { describe, expect, it } from "vitest"
import { lettersFromString, lettersToString } from "./letters"

describe("lettersFromString", () => {
  it("gives every letter its own id, even repeated ones", () => {
    const letters = lettersFromString("COOL")

    expect(lettersToString(letters)).toBe("COOL")
    expect(new Set(letters.map((l) => l.id)).size).toBe(4)
  })
})
