import { useState } from 'react'

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

export function useMoveableLetters(letters: string[]) {
  const [tiles, setTiles] = useState<Tile[]>(
    initializeLetters(letters)
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  function shuffleTiles() {
    setActiveIndex(null)
    setTiles([...tiles.sort(() => Math.random() - 0.5)])
  }

  function resetPositions() {
    setActiveIndex(null)
    setTiles([
      ...tiles.sort((a, b) => a.initialPosition - b.initialPosition),
    ])
  }

  function swapTiles(indexA: number, indexB: number) {
    const newTiles = [...tiles]

    const letterA = tiles[indexA]
    const letterB = tiles[indexB]

    newTiles[indexB] = letterA
    newTiles[indexA] = letterB

    setTiles([...newTiles])
    setActiveIndex(null)
  }

  return {
    tiles,
    setTiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles
  }
}
