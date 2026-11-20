import { describe, expect, it } from "vitest"
import {
  lettersFromString,
  lettersToString,
  pressDelete,
  type Letter,
} from "./letters"

function idOf(letters: Letter[], index: number) {
  return letters[index].id
}

describe("lettersFromString", () => {
  it("gives every letter its own id, even repeated ones", () => {
    const letters = lettersFromString("COOL")

    expect(lettersToString(letters)).toBe("COOL")
    expect(new Set(letters.map((l) => l.id)).size).toBe(4)
  })
})

describe("pressDelete", () => {
  it("selects the last letter when nothing is selected", () => {
    const letters = lettersFromString("CAT")

    const result = pressDelete({ letters, selectedId: null })

    expect(result.letters).toBe(letters)
    expect(result.selectedId).toBe(idOf(letters, 2))
  })

  it("deletes the selected letter and selects the one before it", () => {
    const letters = lettersFromString("CAT")

    const result = pressDelete({ letters, selectedId: idOf(letters, 1) })

    expect(lettersToString(result.letters)).toBe("CT")
    expect(result.selectedId).toBe(idOf(letters, 0))
  })

  it("selects the next letter after deleting the first", () => {
    const letters = lettersFromString("CAT")

    const result = pressDelete({ letters, selectedId: idOf(letters, 0) })

    expect(lettersToString(result.letters)).toBe("AT")
    expect(result.selectedId).toBe(idOf(letters, 1))
  })

  it("deletes the right one of two repeated letters", () => {
    const letters = lettersFromString("COOL")

    const result = pressDelete({ letters, selectedId: idOf(letters, 2) })

    expect(result.letters.map((l) => l.id)).toEqual([
      idOf(letters, 0),
      idOf(letters, 1),
      idOf(letters, 3),
    ])
  })

  it("selects nothing after deleting the only letter", () => {
    const letters = lettersFromString("A")

    const result = pressDelete({ letters, selectedId: idOf(letters, 0) })

    expect(result).toEqual({ letters: [], selectedId: null })
  })

  it("does nothing with no letters", () => {
    expect(pressDelete({ letters: [], selectedId: null })).toEqual({
      letters: [],
      selectedId: null,
    })
  })

  it("treats a selection that no longer exists as nothing selected", () => {
    const letters = lettersFromString("CAT")

    const result = pressDelete({ letters, selectedId: -1 })

    expect(result.letters).toBe(letters)
    expect(result.selectedId).toBe(idOf(letters, 2))
  })

  it("works backwards through the letters when pressed repeatedly", () => {
    let state = { letters: lettersFromString("CAT"), selectedId: null as number | null }
    const seen: string[] = []

    for (let i = 0; i < 7; i++) {
      state = pressDelete(state)
      seen.push(lettersToString(state.letters))
    }

    expect(seen).toEqual(["CAT", "CA", "C", "", "", "", ""])
  })
})
