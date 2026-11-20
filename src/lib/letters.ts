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

export type Selection = {
  letters: Letter[]
  selectedId: number | null
}

/*
 * Pressing delete never removes a letter you can't see. With nothing selected
 * it selects the last letter typed, so a second press deletes it. With a
 * letter selected it deletes that letter and selects the one typed before it
 * (or after it, if it was the first), so pressing delete repeatedly works
 * backwards through the letters.
 */
export function pressDelete({ letters, selectedId }: Selection): Selection {
  if (letters.length === 0) return { letters, selectedId: null }

  const index = letters.findIndex((letter) => letter.id === selectedId)
  if (index === -1) {
    return { letters, selectedId: letters[letters.length - 1].id }
  }

  const remaining = letters.filter((_, i) => i !== index)
  const next = remaining[index - 1] ?? remaining[index] ?? null

  return { letters: remaining, selectedId: next?.id ?? null }
}
