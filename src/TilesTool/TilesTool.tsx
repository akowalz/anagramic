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
  pos: Pos
  letter: string
  zIndex: number
  id: number
}

export default function TileTool({ letters, registerActions }: Props) {
  const initialTileData = (letters: string[]) => {
    return letters.map((letter, index) => ({
      id: index,
      pos: { x: 0, y: 0 },
      zIndex: 0,
      letter,
    }))
  }
  const [tileData, setTileData] = useState<TileData[]>(initialTileData(letters))

  function resetTiles() {
    setTileData(initialTileData(letters))
  }

  function shuffleTiles() {
    setTileData([...shuffle(initialTileData(letters))])
  }

  const handleMoveTile = (id: number, newPos: Pos) => {
    const currentMaxZIndex = Math.max(...tileData.map((t) => t.zIndex))

    setTileData((tiles) =>
      tiles.map((tile) =>
        tile.id === id
          ? { ...tile, pos: newPos, zIndex: currentMaxZIndex + 1 }
          : tile,
      ),
    )
  }

  useEffect(() => {
    registerActions({
      reset: () => resetTiles(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  useLayoutEffect(() => {
    const shadowTiles = Array.from(
      document.querySelectorAll("#shadow-canvas > .tile"),
    )
    if (!shadowTiles) throw "cant find tiles"

    setTileData((oldTiles) => {
      return oldTiles.map((tile, index) => {
        const shadowTileForTile = shadowTiles[index]
        if (!shadowTileForTile) throw "cant find shadow tile for tile"
        console.log({
          top: shadowTileForTile.offsetTop,
          left: shadowTileForTile.offsetLeft,
        })

        return {
          ...tile,
          pos: {
            x: shadowTileForTile.offsetLeft,
            y: shadowTileForTile.offsetTop,
          },
        }
      })
    })
  }, [])

  const tiles = tileData.map((tile) => {
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
  })

  const shadowTiles = tileData.map((tile) => {
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
