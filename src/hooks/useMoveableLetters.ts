import { useState } from 'react'
import { shuffleUnlocked } from '../lib/shuffle'
import { toggleLocked } from '../lib/locking'
import { syncRearrangedTiles } from '../lib/sync-tiles'
import type { Letter } from '../lib/letters'

export type Tile = {
  // The id of the tile's letter
  id: number,
  letter: string,
  initialPosition: number,
  // Locked tiles stay where they are when shuffling
  locked: boolean,
}

function createTile(letter: Letter, index: number): Tile {
  return {
    id: letter.id,
    initialPosition: index,
    letter: letter.char,
    locked: false,
  }
}

function initializeLetters(letters: Letter[]): Tile[] {
  return letters.map((letter, index) => createTile(letter, index))
}

export function sortByInitialPosition(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => a.initialPosition - b.initialPosition)
}

export function swapTiles(tiles: Tile[], indexA: number, indexB: number): Tile[] {
  const newTiles = [...tiles]

  newTiles[indexA] = tiles[indexB]
  newTiles[indexB] = tiles[indexA]

  return newTiles
}

/*
 * The selected tile is the app's, since it's shared with the delete key: pass
 * the setter for it as `select`.
 */
export function useMoveableLetters(
  letters: Letter[],
  select: (id: number | null) => void,
) {
  const [tiles, setTiles] = useState<Tile[]>(
    initializeLetters(letters)
  )

  // Letters get typed and deleted, so keep the tiles in step with them.
  // Adjusting state while rendering is React's way of reacting to a changed
  // prop without an extra render with stale tiles.
  const [syncedLetters, setSyncedLetters] = useState(letters)
  if (letters !== syncedLetters) {
    setSyncedLetters(letters)
    setTiles((tiles) => syncRearrangedTiles(tiles, letters, createTile))
  }

  function shuffleTiles() {
    select(null)
    setTiles((tiles) => shuffleUnlocked(tiles, (tile) => tile.locked))
  }

  function resetPositions() {
    select(null)
    setTiles((tiles) =>
      sortByInitialPosition(tiles).map((tile) => ({ ...tile, locked: false }))
    )
  }

  function swap(indexA: number, indexB: number) {
    setTiles(swapTiles(tiles, indexA, indexB))
    select(null)
  }

  function toggleLock(id: number) {
    select(null)
    setTiles((tiles) => toggleLocked(tiles, id))
  }

  return {
    tiles,
    setTiles,
    shuffleTiles,
    resetPositions,
    swapTiles: swap,
    toggleLock,
  }
}
