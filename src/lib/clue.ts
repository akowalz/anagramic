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

// "(8)", "(6,4)", "(6, 4)", "(4-4)", "(3 4)": the lengths of the answer's
// words, which can have spaces in it, so it's found before splitting words
const ENUMERATION = /(\(\s*\d+(?:\s*[,\-–‐\s]\s*\d+)*\s*\))/

export function parseClue(clue: string): ClueToken[] {
  return clue
    .trim()
    .split(ENUMERATION)
    .flatMap((part, index): ClueToken[] => {
      // Split's odd parts are the enumerations it matched
      if (index % 2 === 1) {
        const length = (part.match(/\d+/g) ?? [])
          .map(Number)
          .reduce((sum, n) => sum + n, 0)
        return [{ kind: "enumeration", text: part, length }]
      }

      return part
        .split(/\s+/)
        .filter((text) => text.length > 0)
        .map((text): ClueToken => {
          const letters = text.replace(/[^a-z]/gi, "").toUpperCase()
          return letters
            ? { kind: "word", text, letters }
            : { kind: "other", text }
        })
    })
}

/* How many letters the answer has, if the clue says */
export function answerLength(tokens: ClueToken[]): number | null {
  const enumeration = tokens.find((token) => token.kind === "enumeration")
  return enumeration?.kind === "enumeration" ? enumeration.length : null
}
