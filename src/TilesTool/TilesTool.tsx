import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Tile, { TILE_SIZE } from "../DraggableTile/DraggableTile"
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

/* Breathing room left between tiles once repulsion has separated them */
const TILE_GAP = 6

/* Cap on repulsion cascades, in case a crowded canvas can't fully settle */
const MAX_PUSH_PASSES = 20

/*
 * After a tile is dropped, push any tiles it overlaps out of the way.
 * The dropped tile never moves; every other tile can be pushed, including
 * by tiles that were themselves pushed. Runs repeated passes until no
 * overlaps remain (or the pass cap is hit).
 */
function resolveOverlaps(
  tiles: TileData[],
  droppedId: number,
  bounds: { width: number; height: number },
): TileData[] {
  const positions = tiles.map((tile) => ({ ...tile.pos }))
  const settledDist = TILE_SIZE + TILE_GAP

  const clamp = (pos: Pos): Pos => ({
    x: Math.min(Math.max(pos.x, 0), Math.max(0, bounds.width - TILE_SIZE)),
    y: Math.min(Math.max(pos.y, 0), Math.max(0, bounds.height - TILE_SIZE)),
  })

  for (let pass = 0; pass < MAX_PUSH_PASSES; pass++) {
    let anyPushed = false

    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const posA = positions[i]
        const posB = positions[j]

        const dx = posB.x - posA.x
        const dy = posB.y - posA.y

        // Tiles are axis-aligned squares: no overlap unless both axes overlap
        if (Math.abs(dx) >= TILE_SIZE || Math.abs(dy) >= TILE_SIZE) continue

        // Separate along the axis that needs the smallest shift
        const pushX = (dx >= 0 ? 1 : -1) * (settledDist - Math.abs(dx))
        const pushY = (dy >= 0 ? 1 : -1) * (settledDist - Math.abs(dy))
        const push =
          Math.abs(pushX) < Math.abs(pushY)
            ? { x: pushX, y: 0 }
            : { x: 0, y: pushY }

        if (tiles[i].id === droppedId) {
          positions[j] = clamp({ x: posB.x + push.x, y: posB.y + push.y })
        } else if (tiles[j].id === droppedId) {
          positions[i] = clamp({ x: posA.x - push.x, y: posA.y - push.y })
        } else {
          positions[i] = clamp({ x: posA.x - push.x / 2, y: posA.y - push.y / 2 })
          positions[j] = clamp({ x: posB.x + push.x / 2, y: posB.y + push.y / 2 })
        }
        anyPushed = true
      }
    }

    if (!anyPushed) break
  }

  return tiles.map((tile, index) => ({ ...tile, pos: positions[index] }))
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

  function shuffleTiles() {
    const flexPositions = getFlexPositions()
    const shuffledPositions = shuffle(flexPositions)

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
    setTileData((tiles) => {
      const maxZ = Math.max(...tiles.map((t) => t.zIndex))

      return tiles.map((tile) =>
        tile.id === id ? { ...tile, pos: newPos, zIndex: maxZ + 1 } : tile,
      )
    })
  }

  const handleDropTile = (id: number, newPos: Pos) => {
    const canvas = canvasRef.current
    const bounds = canvas
      ? { width: canvas.offsetWidth, height: canvas.offsetHeight }
      : { width: Infinity, height: Infinity }

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
