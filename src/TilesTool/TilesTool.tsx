import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
  relativePos: Pos
  letter: string
  zIndex: number
}

function tilesFromLetters(letters: string[]): TileData[] {
  return letters.map((letter, index) => ({
    letter,
    id: index,
    relativePos: { x: 0, y: 0 },
    zIndex: 0,
  }))
}

export default function TileTool({ letters, registerActions }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const shadowCanvasRef = useRef<HTMLDivElement>(null)

  const [showTiles, setShowTiles] = useState<boolean>(false)
  const [tileData, setTileData] = useState<TileData[]>(
    tilesFromLetters(letters),
  )

  /* Get position of tiles if they had be positioned using flexbox */
  function getFlexPositions(): Pos[] {
    if (!shadowCanvasRef.current || !canvasRef.current)
      throw "cant find canvas refs"

    const { containerHeight, containerWidth } = {
      containerHeight: canvasRef.current.clientHeight,
      containerWidth: canvasRef.current.clientWidth,
    }

    const shadowTiles = Array.from(
      shadowCanvasRef.current.querySelectorAll<HTMLElement>(".tile"),
    )
    if (!shadowTiles) throw "cant find tiles"

    return shadowTiles.map((t) => ({
      x: t.offsetLeft / containerWidth,
      y: t.offsetTop / containerHeight,
    }))
  }

  function resetTiles() {
    const flexPositions = getFlexPositions()

    setTileData((tileData) =>
      tileData.map((tile, index) => {
        const posForTile = flexPositions[index]
        if (!posForTile) throw "no initial position found"

        return {
          ...tile,
          relativePos: posForTile,
        }
      }),
    )
  }

  function shuffleTiles() {
    const flexPositions = getFlexPositions()
    const shuffledPositions = shuffle(flexPositions)

    setTileData((tileData) =>
      tileData.map((tile, index) => {
        const posForTile = shuffledPositions[index]
        if (!posForTile) throw "no shuffled position found"

        return {
          ...tile,
          relativePos: posForTile,
        }
      }),
    )
  }

  const handleMoveTile = (id: number, newPos: Pos) => {
    setTileData((tiles) => {
      const maxZ = Math.max(...tiles.map((t) => t.zIndex))

      return tiles.map((tile) =>
        tile.id === id
          ? { ...tile, relativePos: newPos, zIndex: maxZ + 1 }
          : tile,
      )
    })
  }

  useEffect(() => {
    registerActions({
      reset: () => resetTiles(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  useLayoutEffect(() => {
    const flexPositions = getFlexPositions()

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTileData(
      letters.map((letter, index) => {
        return {
          letter,
          zIndex: 0,
          id: index,
          relativePos: flexPositions[index],
        }
      }),
    )

    setShowTiles(true)
  }, [])

  const tiles = tileData.map((tile) => {
    return (
      <Tile
        letter={tile.letter}
        id={tile.id}
        key={tile.id}
        relativePos={{ ...tile.relativePos }}
        zIndex={tile.zIndex}
        onMove={handleMoveTile}
        containerRef={canvasRef}
      />
    )
  })

  return (
    <>
      <div className="tile-canvas-container">
        <div className="tile-canvas" ref={canvasRef}>
          {showTiles && tiles}
        </div>

        <div
          id="shadow-canvas"
          className="hidden-tile-canvas"
          ref={shadowCanvasRef}
        >
          {tiles}
        </div>
      </div>
    </>
  )
}
