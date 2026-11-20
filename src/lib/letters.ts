/*
 * The letters the user has typed, in the order they typed them. Each has an id
 * so the tools can tell letters apart, e.g. when one of two Os is deleted.
 */
export type Letter = {
  id: number
  char: string
}

let lastId = 0

export function createLetter(char: string): Letter {
  lastId += 1
  return { id: lastId, char }
}

export function lettersFromString(word: string): Letter[] {
  return word.split("").map(createLetter)
}

export function lettersToString(letters: Letter[]): string {
  return letters.map((letter) => letter.char).join("")
}
