import { describe, expect, it } from "vitest"
import { answerLength, parseClue } from "./clue"

describe("parseClue", () => {
  it("splits a clue into words, with their letters in capitals", () => {
    expect(parseClue("Words rearranged, a nag mars")).toEqual([
      { kind: "word", text: "Words", letters: "WORDS" },
      { kind: "word", text: "rearranged,", letters: "REARRANGED" },
      { kind: "word", text: "a", letters: "A" },
      { kind: "word", text: "nag", letters: "NAG" },
      { kind: "word", text: "mars", letters: "MARS" },
    ])
  })

  it("keeps apostrophes and hyphens out of the letters", () => {
    expect(parseClue("Doctor's re-entry")).toEqual([
      { kind: "word", text: "Doctor's", letters: "DOCTORS" },
      { kind: "word", text: "re-entry", letters: "REENTRY" },
    ])
  })

  it("reads the enumeration", () => {
    const tokens = parseClue("Some clue (5,3)")

    expect(tokens[2]).toEqual({ kind: "enumeration", text: "(5,3)", length: 8 })
    expect(answerLength(tokens)).toBe(8)
    expect(answerLength(parseClue("Some clue (8)"))).toBe(8)
    expect(answerLength(parseClue("Some clue (4-4)"))).toBe(8)
  })

  it("doesn't count anything without letters as a word", () => {
    expect(parseClue("Dash — then")).toEqual([
      { kind: "word", text: "Dash", letters: "DASH" },
      { kind: "other", text: "—" },
      { kind: "word", text: "then", letters: "THEN" },
    ])
  })

  it("has no length without an enumeration", () => {
    expect(answerLength(parseClue("No enumeration here"))).toBeNull()
  })

  it("ignores extra spaces", () => {
    expect(parseClue("  a   b  ").map((token) => token.text)).toEqual([
      "a",
      "b",
    ])
  })
})
