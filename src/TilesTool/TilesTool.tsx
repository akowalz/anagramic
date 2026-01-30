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
    pos: { x: 0, y: 0 },
    zIndex: 0,
  }))
}

export default function TileTool({ letters, registerActions }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const shadowCanvasRef = useRef<HTMLDivElement>(null)

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
          relativePos: posForTile,
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
  }, [initialPositions])

  useLayoutEffect(() => {
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

    const initialPositionData = shadowTiles.map((t) => ({
      x: t.offsetLeft / containerWidth,
      y: t.offsetTop / containerHeight,
    }))

    setInitialPositions(initialPositionData)

    setTileData(
      letters.map((letter, index) => {
        const shadowTileForTile = shadowTiles[index]
        if (!shadowTileForTile) throw "cant find shadow tile for tile"

        return {
          letter,
          zIndex: 0,
          id: index,
          relativePos: initialPositionData[index],
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
          relativePos={{ ...tile.relativePos }}
          zIndex={tile.zIndex}
          onMove={handleMoveTile}
          containerRef={canvasRef}
        />
      )
    }) || []

  const shadowTiles = shadowTileData.map((tile) => {
    return (
      <Tile
        letter={tile.letter.toUpperCase()}
        id={tile.id}
        key={tile.id}
        relativePos={{ ...tile.relativePos }}
        zIndex={tile.zIndex}
        onMove={() => {}}
        containerRef={shadowCanvasRef}
      />
    )
  })

  return (
    <>
      <div className="tile-canvas-container">
        <div className="tile-canvas" ref={canvasRef}>
          {tiles}
        </div>

        <div
          id="shadow-canvas"
          className="hidden-tile-canvas"
          ref={shadowCanvasRef}
        >
          {shadowTiles}
        </div>
      </div>
    </>
  )
}
