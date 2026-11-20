import { useMemo, useState } from "react"
import {
  addLetter,
  pressDelete,
  reorder,
  resetBoard,
  select,
  shuffleBoard,
  swapLetters,
  toggleLock,
  type Board,
} from "../lib/board"
import { createLetter } from "../lib/letters"

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
      pressDelete() {
        setBoard(pressDelete)
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
