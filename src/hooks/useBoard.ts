import { useMemo, useState } from "react"
import {
  addLetter,
  pressDelete,
  removeLetters,
  reorder,
  resetBoard,
  select,
  shuffleBoard,
  swapLetters,
  toggleLock,
  type Board,
  type DeleteOrder,
} from "../lib/board"
import { createLetter, type Letter } from "../lib/letters"

/*
 * The board every tool shares (see lib/board), and the actions that change
 * it. The actions never change, so they can be handed to the tools freely.
 */
export function useBoard(initialBoard: () => Board) {
  const [board, setBoard] = useState(initialBoard)

  const actions = useMemo(
    () => ({
      typeLetter(char: string) {
        const letter = createLetter(char)
        setBoard((board) => addLetter(board, letter))
      },
      // Several letters at once, e.g. a clue word's. Made by the caller, who
      // can then keep track of them by their ids.
      addLetters(letters: Letter[]) {
        setBoard((board) => letters.reduce(addLetter, board))
      },
      removeLetters(ids: number[]) {
        setBoard((board) => removeLetters(board, ids))
      },
      pressDelete(by: DeleteOrder = "typed") {
        setBoard((board) => pressDelete(board, by))
      },
      select(id: number | null) {
        setBoard((board) => select(board, id))
      },
      toggleLock(id: number) {
        setBoard((board) => toggleLock(board, id))
      },
      shuffle() {
        setBoard(shuffleBoard)
      },
      reset() {
        setBoard(resetBoard)
      },
      swap(idA: number, idB: number) {
        setBoard((board) => swapLetters(board, idA, idB))
      },
      reorder(order: number[]) {
        setBoard((board) => reorder(board, order))
      },
    }),
    [],
  )

  return [board, actions] as const
}

export type BoardActions = ReturnType<typeof useBoard>[1]
