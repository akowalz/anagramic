import { useState } from 'react'
import { shuffleUnlocked } from '../lib/shuffle'
import { toggleLocked } from '../lib/locking'

export type Tile = {
  id: string,
  letter: string,
  initialPosition: number,
  // Locked tiles stay where they are when shuffling
  locked: boolean,
}

function initializeLetters(letters: string[]): Tile[] {
  return letters.map((letter, index) => {
    return {
      id: Math.random().toString(36).substring(3, 9),
      initialPosition: index,
      letter,
      locked: false,
    }
  })
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

export function useMoveableLetters(letters: string[]) {
  const [tiles, setTiles] = useState<Tile[]>(
    initializeLetters(letters)
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  function shuffleTiles() {
    setActiveIndex(null)
    setTiles((tiles) => shuffleUnlocked(tiles, (tile) => tile.locked))
  }

  function resetPositions() {
    setActiveIndex(null)
    setTiles((tiles) =>
      sortByInitialPosition(tiles).map((tile) => ({ ...tile, locked: false }))
    )
  }

  function swap(indexA: number, indexB: number) {
    setTiles(swapTiles(tiles, indexA, indexB))
    setActiveIndex(null)
  }

  function toggleLock(id: string) {
    setActiveIndex(null)
    setTiles((tiles) => toggleLocked(tiles, id))
  }

  return {
    tiles,
    setTiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles: swap,
    toggleLock,
  }
}
