import { useState } from 'react'
import { shuffle } from '../lib/shuffle'

export type Tile = {
  id: string,
  letter: string,
  initialPosition: number,
}

function initializeLetters(letters: string[]): Tile[] {
  return letters.map((letter, index) => {
    return {
      id: Math.random().toString(36).substring(3, 9),
      initialPosition: index,
      letter,
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
    setTiles(shuffle([...tiles]))
  }

  function resetPositions() {
    setActiveIndex(null)
    setTiles(sortByInitialPosition(tiles))
  }

  function swap(indexA: number, indexB: number) {
    setTiles(swapTiles(tiles, indexA, indexB))
    setActiveIndex(null)
  }

  return {
    tiles,
    setTiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles: swap
  }
}
