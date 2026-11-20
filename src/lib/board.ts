import { lettersFromString, type Letter } from "./letters"
import { shuffleUnlocked } from "./shuffle"

/*
 * Everything about the letters that the tools share. Every tool shows the same
 * letters, in the same arrangement, with the same locks and selection: shuffle
 * in the wheel and the line shows that order too. What's left to each tool is
 * only how it lays the letters out (e.g. where Freeform's tiles are after being
 * dragged by hand).
 */
export type Board = {
  // In the order they were typed
  letters: Letter[]
  // The letters' ids in their current arrangement, e.g. after a shuffle
  order: number[]
  // Locked letters keep their place in the arrangement when shuffling
  locked: ReadonlySet<number>
  selectedId: number | null
}

/* A letter as the tools show it */
export type BoardTile = {
  id: number
  char: string
  locked: boolean
}

export function boardFromLetters(letters: Letter[]): Board {
  return {
    letters,
    order: letters.map((letter) => letter.id),
    locked: new Set(),
    selectedId: null,
  }
}

export function boardFromString(word: string): Board {
  return boardFromLetters(lettersFromString(word))
}

/* The letters in their current arrangement */
export function tilesInOrder(board: Board): BoardTile[] {
  const byId = new Map(board.letters.map((letter) => [letter.id, letter]))

  return board.order.flatMap((id) => {
    const letter = byId.get(id)
    return letter
      ? [{ id, char: letter.char, locked: board.locked.has(id) }]
      : []
  })
}

/* A newly typed letter goes at the end, and clears the selection */
export function addLetter(board: Board, letter: Letter): Board {
  return {
    ...board,
    letters: [...board.letters, letter],
    order: [...board.order, letter.id],
    selectedId: null,
  }
}

/*
 * Pressing delete never removes a letter you can't see. With nothing selected
 * it selects the last letter typed, so a second press deletes it. With a
 * letter selected it deletes that letter and selects the one typed before it
 * (or after it, if it was the first), so pressing delete repeatedly works
 * backwards through the letters.
 */
export function pressDelete(board: Board): Board {
  const { letters, selectedId } = board
  if (letters.length === 0) return board

  const index = letters.findIndex((letter) => letter.id === selectedId)
  if (index === -1) {
    return { ...board, selectedId: letters[letters.length - 1].id }
  }

  const deletedId = letters[index].id
  const remaining = letters.filter((_, i) => i !== index)
  const next = remaining[index - 1] ?? remaining[index] ?? null

  const locked = new Set(board.locked)
  locked.delete(deletedId)

  return {
    letters: remaining,
    order: board.order.filter((id) => id !== deletedId),
    locked,
    selectedId: next?.id ?? null,
  }
}

export function select(board: Board, id: number | null): Board {
  return board.selectedId === id ? board : { ...board, selectedId: id }
}

export function toggleLock(board: Board, id: number): Board {
  const locked = new Set(board.locked)
  if (locked.has(id)) {
    locked.delete(id)
  } else {
    locked.add(id)
  }

  return { ...board, locked, selectedId: null }
}

/* Shuffle the arrangement, leaving locked letters where they are */
export function shuffleBoard(board: Board): Board {
  return {
    ...board,
    order: shuffleUnlocked(board.order, (id) => board.locked.has(id)),
    selectedId: null,
  }
}

/* Back to the order the letters were typed in, with nothing locked */
export function resetBoard(board: Board): Board {
  return boardFromLetters(board.letters)
}

/* Swap two letters' places in the arrangement */
export function swapLetters(board: Board, idA: number, idB: number): Board {
  const order = board.order.map((id) =>
    id === idA ? idB : id === idB ? idA : id,
  )
  return { ...board, order, selectedId: null }
}

/* A new arrangement of the same letters, e.g. from dragging in the line */
export function reorder(board: Board, order: number[]): Board {
  return { ...board, order }
}
