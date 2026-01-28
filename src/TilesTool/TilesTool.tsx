import { useEffect, useLayoutEffect, useState } from "react"
import Tile from "../DraggableTile/DraggableTile"
import "./TilesTool.css"
import { type ToolActions } from "../Types/ToolActions"
import { shuffle } from "../lib/shuffle"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

type Pos = { x: number; y: number }

type TileData = {
  id: number
  pos: Pos
  letter: string
  zIndex: number
}

function tilesFromLetters(letters: string[]): TileData[] {
  return letters.map((letter, index) => ({
    letter,
    id: index,
    pos: { x: 0, y: 0 },
    zIndex: 0,
  }))
}

export default function TileTool({ letters, registerActions }: Props) {
  const shadowTileData: TileData[] = tilesFromLetters(letters)

  const [initialPositions, setInitialPositions] = useState<Pos[] | null>(null)
  const [tileData, setTileData] = useState<TileData[]>([])

  function resetTiles() {
    if (!initialPositions) throw "error: inital positions not never set"

    setTileData((tileData) =>
      tileData.map((tile, index) => {
        const posForTile = initialPositions[index]
        if (!posForTile) throw "no initial position found"

        return {
          ...tile,
          pos: posForTile,
        }
      }),
    )
  }

  function shuffleTiles() {
    if (!initialPositions) return
    const shuffledPositions = shuffle(initialPositions)

    setTileData((tileData) =>
      tileData.map((tile, index) => {
        const posForTile = shuffledPositions[index]
        if (!posForTile) throw "no shuffled position found"

        return {
          ...tile,
          pos: posForTile,
        }
      }),
    )
  }

  const handleMoveTile = (id: number, newPos: Pos) => {
    if (!tileData) return
    const currentMaxZIndex = Math.max(...tileData.map((t) => t.zIndex))

    setTileData(
      (tiles) =>
        tiles?.map((tile) =>
          tile.id === id
            ? { ...tile, pos: newPos, zIndex: currentMaxZIndex + 1 }
            : tile,
        ) || [],
    )
  }

  useEffect(() => {
    registerActions({
      reset: () => resetTiles(),
      shuffle: () => shuffleTiles(),
    })
  }, [initialPositions])

  useLayoutEffect(() => {
    const shadowTiles = Array.from(
      document.querySelectorAll("#shadow-canvas > .tile"),
    )
    if (!shadowTiles) throw "cant find tiles"
    console.log(shadowTiles)

    setInitialPositions((pos) => {
      return shadowTiles.map((t) => ({ x: t.offsetLeft, y: t.offsetTop }))
    })

    setTileData(
      letters.map((letter, index) => {
        const shadowTileForTile = shadowTiles[index]
        if (!shadowTileForTile) throw "cant find shadow tile for tile"

        return {
          letter,
          zIndex: 0,
          id: index,
          pos: {
            x: shadowTileForTile.offsetLeft,
            y: shadowTileForTile.offsetTop,
          },
        }
      }),
    )
  }, [])

  const tiles =
    tileData?.map((tile) => {
      return (
        <Tile
          letter={tile.letter.toUpperCase()}
          id={tile.id}
          key={tile.id}
          pos={{ ...tile.pos }}
          zIndex={tile.zIndex}
          onMove={handleMoveTile}
        />
      )
    }) || []

  const shadowTiles = shadowTileData.map((tile) => {
    return (
      <Tile
        letter={tile.letter.toUpperCase()}
        id={tile.id}
        key={tile.id}
        pos={{ x: 0, y: 0 }}
        zIndex={tile.zIndex}
        onMove={handleMoveTile}
      />
    )
  })

  return (
    <>
      <div className="tile-canvas-container">
        <div className="tile-canvas">{tiles}</div>

        <div id="shadow-canvas" className="hidden-tile-canvas">
          {shadowTiles}
        </div>
      </div>
    </>
  )
}
