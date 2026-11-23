/*
 * A cryptic clue, entered for reference. Its words can be tapped to use their
 * letters as fodder, and an enumeration like "(8)" or "(5,3)" says how long
 * the answer is.
 */

export type ClueToken =
  | {
      kind: "word"
      // As written, with punctuation
      text: string
      // Just its letters, in capitals, to add as tiles
      letters: string
    }
  | { kind: "enumeration"; text: string; length: number }
  | { kind: "other"; text: string }

const ENUMERATION = /^\((\d+(?:[,\-–\s]+\d+)*)\)$/

export function parseClue(clue: string): ClueToken[] {
  return clue
    .trim()
    .split(/\s+/)
    .filter((text) => text.length > 0)
    .map((text): ClueToken => {
      const enumeration = text.match(ENUMERATION)
      if (enumeration) {
        const length = (enumeration[1].match(/\d+/g) ?? [])
          .map(Number)
          .reduce((sum, n) => sum + n, 0)
        return { kind: "enumeration", text, length }
      }

      const letters = text.replace(/[^a-z]/gi, "").toUpperCase()
      return letters ? { kind: "word", text, letters } : { kind: "other", text }
    })
}

/* How many letters the answer has, if the clue says */
export function answerLength(tokens: ClueToken[]): number | null {
  const enumeration = tokens.find((token) => token.kind === "enumeration")
  return enumeration?.kind === "enumeration" ? enumeration.length : null
}
