import { describe, expect, it } from "vitest"
import {
  addLetter,
  boardFromString,
  pressDelete,
  reorder,
  resetBoard,
  select,
  shuffleBoard,
  swapLetters,
  tilesInOrder,
  toggleLock,
  type Board,
} from "./board"
import { createLetter, lettersToString } from "./letters"

function arranged(board: Board): string {
  return tilesInOrder(board)
    .map((tile) => tile.char)
    .join("")
}

function idOf(board: Board, index: number) {
  return board.letters[index].id
}

describe("boardFromString", () => {
  it("arranges the letters in the order they were typed, unlocked", () => {
    const board = boardFromString("CAT")

    expect(arranged(board)).toBe("CAT")
    expect(board.locked.size).toBe(0)
    expect(board.selectedId).toBeNull()
  })
})

describe("tilesInOrder", () => {
  it("follows the arrangement and shows which letters are locked", () => {
    const board = boardFromString("CAT")
    const [c, a, t] = board.order

    const tiles = tilesInOrder({
      ...board,
      order: [t, c, a],
      locked: new Set([c]),
    })

    expect(tiles).toEqual([
      { id: t, char: "T", locked: false },
      { id: c, char: "C", locked: true },
      { id: a, char: "A", locked: false },
    ])
  })
})

describe("addLetter", () => {
  it("adds the letter at the end of the arrangement and deselects", () => {
    const board = boardFromString("CA")
    const t = createLetter("T")

    const result = addLetter(
      { ...board, order: [...board.order].reverse(), selectedId: idOf(board, 0) },
      t,
    )

    expect(lettersToString(result.letters)).toBe("CAT")
    expect(arranged(result)).toBe("ACT")
    expect(result.selectedId).toBeNull()
  })
})

describe("pressDelete", () => {
  it("selects the last letter typed when nothing is selected", () => {
    const board = boardFromString("CAT")

    const result = pressDelete(board)

    expect(result.letters).toBe(board.letters)
    expect(result.selectedId).toBe(idOf(board, 2))
  })

  it("deletes the selected letter and selects the one typed before it", () => {
    const board = boardFromString("CAT")

    const result = pressDelete(select(board, idOf(board, 1)))

    expect(lettersToString(result.letters)).toBe("CT")
    expect(arranged(result)).toBe("CT")
    expect(result.selectedId).toBe(idOf(board, 0))
  })

  it("selects the next letter after deleting the first", () => {
    const board = boardFromString("CAT")

    const result = pressDelete(select(board, idOf(board, 0)))

    expect(lettersToString(result.letters)).toBe("AT")
    expect(result.selectedId).toBe(idOf(board, 1))
  })

  it("takes the letter out of a rearranged order, keeping the rest", () => {
    const board = boardFromString("CAT")
    const [c, a, t] = board.order
    const shuffled = reorder(board, [t, a, c])

    const result = pressDelete(select(shuffled, a))

    expect(result.order).toEqual([t, c])
  })

  it("forgets the deleted letter's lock", () => {
    const board = boardFromString("CAT")
    const id = idOf(board, 0)

    const result = pressDelete(select(toggleLock(board, id), id))

    expect(result.locked.has(id)).toBe(false)
  })

  it("deletes the right one of two repeated letters", () => {
    const board = boardFromString("COOL")

    const result = pressDelete(select(board, idOf(board, 2)))

    expect(result.order).toEqual([
      idOf(board, 0),
      idOf(board, 1),
      idOf(board, 3),
    ])
  })

  it("selects nothing after deleting the only letter", () => {
    const board = boardFromString("A")

    const result = pressDelete(select(board, idOf(board, 0)))

    expect(result.letters).toEqual([])
    expect(result.order).toEqual([])
    expect(result.selectedId).toBeNull()
  })

  it("does nothing with no letters", () => {
    const board = boardFromString("")

    expect(pressDelete(board)).toBe(board)
  })

  it("treats a selection that no longer exists as nothing selected", () => {
    const board = boardFromString("CAT")

    const result = pressDelete(select(board, -1))

    expect(result.letters).toBe(board.letters)
    expect(result.selectedId).toBe(idOf(board, 2))
  })

  it("works backwards through the letters when pressed repeatedly", () => {
    let board = boardFromString("CAT")
    const seen: string[] = []

    for (let i = 0; i < 7; i++) {
      board = pressDelete(board)
      seen.push(lettersToString(board.letters))
    }

    expect(seen).toEqual(["CAT", "CA", "C", "", "", "", ""])
  })
})

describe("select", () => {
  it("returns the same board when the selection doesn't change", () => {
    const board = boardFromString("CAT")

    expect(select(board, null)).toBe(board)
  })
})

describe("toggleLock", () => {
  it("locks and unlocks a letter, deselecting", () => {
    const board = select(boardFromString("CAT"), null)
    const id = idOf(board, 1)

    const locked = toggleLock(select(board, id), id)
    expect(locked.locked.has(id)).toBe(true)
    expect(locked.selectedId).toBeNull()

    expect(toggleLock(locked, id).locked.has(id)).toBe(false)
  })

  it("doesn't change the board it was given", () => {
    const board = boardFromString("CAT")

    toggleLock(board, idOf(board, 0))

    expect(board.locked.size).toBe(0)
  })
})

describe("shuffleBoard", () => {
  it("keeps the same letters and leaves locked ones in place", () => {
    let board = boardFromString("ABCDEFGHIJ")
    board = toggleLock(board, idOf(board, 0))
    board = toggleLock(board, idOf(board, 5))

    for (let i = 0; i < 20; i++) {
      const shuffled = shuffleBoard(board)

      expect([...shuffled.order].sort()).toEqual([...board.order].sort())
      expect(shuffled.order[0]).toBe(idOf(board, 0))
      expect(shuffled.order[5]).toBe(idOf(board, 5))
    }
  })

  it("deselects", () => {
    const board = boardFromString("CAT")

    expect(shuffleBoard(select(board, idOf(board, 0))).selectedId).toBeNull()
  })
})

describe("resetBoard", () => {
  it("restores the typed order and unlocks everything", () => {
    const board = boardFromString("CAT")
    const [c, a, t] = board.order
    const messy = select(toggleLock(reorder(board, [t, c, a]), c), a)

    const result = resetBoard(messy)

    expect(arranged(result)).toBe("CAT")
    expect(result.locked.size).toBe(0)
    expect(result.selectedId).toBeNull()
  })
})

describe("swapLetters", () => {
  it("swaps two letters in the arrangement and deselects", () => {
    const board = boardFromString("CAT")
    const [c, , t] = board.order

    const result = swapLetters(select(board, c), c, t)

    expect(arranged(result)).toBe("TAC")
    expect(result.selectedId).toBeNull()
  })
})
