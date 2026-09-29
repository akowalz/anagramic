import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Tile from "../DraggableTile/DraggableTile"
import "./TilesTool.css"
import { type ToolActions } from "../Types/ToolActions"
import { shuffle } from "../lib/shuffle"
import { resolveOverlaps, type Bounds, type Pos } from "../lib/resolve-overlaps"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

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

    const shadowTiles = Array.from(
      shadowCanvasRef.current.querySelectorAll<HTMLElement>(".tile"),
    )
    if (!shadowTiles) throw "cant find tiles"

    return shadowTiles.map((t) => ({
      x: t.offsetLeft,
      y: t.offsetTop,
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
          pos: posForTile,
        }
      }),
    )
  }

  /* Swap letters between the tiles' current positions, keeping the layout */
  function shuffleTiles() {
    setTileData((tileData) => {
      const shuffledPositions = shuffle(tileData.map((tile) => tile.pos))

      return tileData.map((tile, index) => {
        const posForTile = shuffledPositions[index]
        if (!posForTile) throw "no shuffled position found"

        return {
          ...tile,
          pos: posForTile,
        }
      })
    })
  }

  const handleMoveTile = (id: number, newPos: Pos) => {
    setTileData((tiles) => {
      const maxZ = Math.max(...tiles.map((t) => t.zIndex))

      return tiles.map((tile) =>
        tile.id === id ? { ...tile, pos: newPos, zIndex: maxZ + 1 } : tile,
      )
    })
  }

  const handleDropTile = (id: number, newPos: Pos) => {
    const canvas = canvasRef.current
    // The canvas is narrower than the screen on wide displays (#root has a
    // max-width), so let tiles use the full viewport width. Vertically they
    // stay within the canvas so they can't cover the header or footer buttons.
    let bounds: Bounds = {
      left: -Infinity,
      top: -Infinity,
      right: Infinity,
      bottom: Infinity,
    }
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      bounds = {
        left: -rect.left,
        top: 0,
        right: document.documentElement.clientWidth - rect.left,
        bottom: canvas.offsetHeight,
      }
    }

    setTileData((tiles) => {
      const maxZ = Math.max(...tiles.map((t) => t.zIndex))

      const placed = tiles.map((tile) =>
        tile.id === id ? { ...tile, pos: newPos, zIndex: maxZ + 1 } : tile,
      )

      return resolveOverlaps(placed, id, bounds)
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
          pos: flexPositions[index],
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
        pos={{ ...tile.pos }}
        zIndex={tile.zIndex}
        onMove={handleMoveTile}
        onDrop={handleDropTile}
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
          {letters.map((letter, index) => (
            <div
              key={index}
              className="tile"
              style={{ height: "40px", width: "40px" }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
