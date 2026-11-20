import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { flushSync } from "react-dom"
import Tile from "../DraggableTile/DraggableTile"
import "./TilesTool.css"
import { type ToolActions } from "../Types/ToolActions"
import { shuffleUnlocked } from "../lib/shuffle"
import { shuffleTilePositions } from "../lib/shuffle-positions"
import { toggleLocked } from "../lib/locking"
import { resolveOverlaps, type Bounds, type Pos } from "../lib/resolve-overlaps"
import { fitToBounds, placeClearOfTiles } from "../lib/place-tiles"
import { syncSlots, syncTilesInLetterOrder } from "../lib/sync-tiles"
import type { Letter } from "../lib/letters"

type Props = {
  letters: Letter[]
  selectedId: number | null
  select: (id: number | null) => void
  registerActions: (actions: ToolActions) => void
}

type TileData = {
  // The id of the tile's letter
  id: number
  pos: Pos
  letter: string
  zIndex: number
  // Locked tiles stay where they are when shuffling
  locked: boolean
}

/* Tiles stay in the order of their letters */
function createTile(letter: Letter): TileData {
  return {
    letter: letter.char,
    id: letter.id,
    pos: { x: 0, y: 0 },
    zIndex: 0,
    locked: false,
  }
}

function tilesFromLetters(letters: Letter[]): TileData[] {
  return letters.map(createTile)
}

export default function TileTool({
  letters,
  selectedId,
  select,
  registerActions,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const shadowCanvasRef = useRef<HTMLDivElement>(null)

  const [showTiles, setShowTiles] = useState<boolean>(false)
  const [tileData, setTileData] = useState<TileData[]>(
    tilesFromLetters(letters),
  )

  // The actions registered with the app are created once, so they read the
  // latest tiles (e.g. which are locked) from here
  const tileDataRef = useRef(tileData)
  useLayoutEffect(() => {
    tileDataRef.current = tileData
  })

  /* Get position of tiles if they had be positioned using flexbox */
  const getFlexPositions = useCallback((): Pos[] => {
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
  }, [])

  /*
   * Slot (index into the flex positions) each tile occupies while the tiles are
   * still laid out in the flex arrangement, i.e. after mount, reset or shuffle.
   * Null once the user drags a tile. While set, tiles follow the layout when
   * the canvas resizes, e.g. when the footer buttons appear after mount.
   */
  const slotsRef = useRef<number[] | null>(null)

  const placeInSlots = useCallback(
    (slots: number[]) => {
      const flexPositions = getFlexPositions()
      slotsRef.current = slots

      setTileData((tileData) =>
        tileData.map((tile, index) => {
          const posForTile = flexPositions[slots[index]]
          if (!posForTile) throw "no flex position found"

          return {
            ...tile,
            pos: posForTile,
          }
        }),
      )
    },
    [getFlexPositions],
  )

  function resetTiles() {
    select(null)
    setTileData((tiles) => tiles.map((tile) => ({ ...tile, locked: false })))
    // The actions registered with the app are created once, so use the latest
    // tiles rather than the letters from when they were created
    placeInSlots(tileDataRef.current.map((_, index) => index))
  }

  function shuffleTiles() {
    select(null)

    // Still in the flex layout: shuffle slots so tiles keep following it
    const slots = slotsRef.current
    if (slots) {
      const tiles = tileDataRef.current
      placeInSlots(shuffleUnlocked(slots, (_, index) => tiles[index].locked))
    } else {
      setTileData((tiles) => shuffleTilePositions(tiles, (tile) => tile.locked))
    }
  }

  const handleTapTile = (id: number) => {
    select(selectedId === id ? null : id)
  }

  const handleToggleLock = (id: number) => {
    select(null)
    setTileData((tiles) => toggleLocked(tiles, id))
  }

  const handleMoveTile = (id: number, newPos: Pos) => {
    slotsRef.current = null
    select(null)

    setTileData((tiles) => {
      const maxZ = Math.max(...tiles.map((t) => t.zIndex))

      return tiles.map((tile) =>
        tile.id === id ? { ...tile, pos: newPos, zIndex: maxZ + 1 } : tile,
      )
    })
  }

  /*
   * Area tiles must stay within, in canvas coordinates. The canvas is narrower
   * than the screen on wide displays (#root has a max-width), so tiles can use
   * the full viewport width. Vertically they stay within the canvas so they
   * can't cover the header or footer buttons.
   */
  const getBounds = useCallback((): Bounds => {
    const canvas = canvasRef.current
    if (!canvas) {
      return {
        left: -Infinity,
        top: -Infinity,
        right: Infinity,
        bottom: Infinity,
      }
    }

    const rect = canvas.getBoundingClientRect()
    return {
      left: -rect.left,
      top: 0,
      right: document.documentElement.clientWidth - rect.left,
      bottom: canvas.offsetHeight,
    }
  }, [])

  const handleDropTile = (id: number, newPos: Pos) => {
    const bounds = getBounds()

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetTiles()
    setShowTiles(true)
  }, [])

  // Keep the tiles in step with the letters as they're typed and deleted. A
  // layout effect because it measures the layout, which already has the new
  // letters, and the tiles should be in place before the next paint. It does
  // nothing when the tiles already match the letters, so it's fine that it can
  // run again for other reasons.
  useLayoutEffect(() => {
    const oldTiles = tileDataRef.current
    const tiles = syncTilesInLetterOrder(oldTiles, letters, createTile)

    const unchanged =
      tiles.length === oldTiles.length &&
      tiles.every((tile, index) => tile === oldTiles[index])
    if (unchanged) return

    const oldSlots = slotsRef.current

    // Where the tiles go depends on the measured layout, so they can only be
    // updated once it has rendered, here
    setTileData(tiles)

    if (oldSlots) {
      // Still in the flex layout: the tiles stay in it, with new ones last
      placeInSlots(syncSlots(oldTiles, oldSlots, tiles))
      return
    }

    // Tiles were moved by hand: leave them where they are, and put new tiles
    // where the layout would, moved clear of whatever is already there
    const flexPositions = getFlexPositions()
    const bounds = getBounds()
    // The layout has a position for each letter, in letter order, which is
    // the order of the tiles
    setTileData((tiles) =>
      tiles.reduce(
        (placed, tile, index) =>
          oldTiles.includes(tile)
            ? placed
            : placeClearOfTiles(placed, tile.id, flexPositions[index], bounds),
        tiles,
      ),
    )
  }, [letters, placeInSlots, getFlexPositions, getBounds])

  // A layout effect so the observer is attached before the first paint and
  // catches the footer buttons appearing, which happens before that paint too
  useLayoutEffect(() => {
    const shadowCanvas = shadowCanvasRef.current
    if (!shadowCanvas) return

    let frame = 0
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current
      const slots = slotsRef.current
      // Skip while hidden (another tool is active); nothing to lay out
      if (!canvas || shadowCanvas.offsetWidth === 0) return

      // Tiles that were moved by hand keep their positions, but any the canvas
      // no longer has room for (e.g. when the keyboard opens) are pulled back in
      if (!slots) {
        setTileData((tiles) => fitToBounds(tiles, getBounds()))
        return
      }

      // Move the tiles in the same frame as the layout change, without the
      // transform transition, so they stay put relative to the layout rather
      // than visibly sliding (e.g. when the footer buttons appear on load).
      canvas.classList.add("snapping")
      flushSync(() => placeInSlots(slots))
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => canvas.classList.remove("snapping"))
    })
    observer.observe(shadowCanvas)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const tiles = tileData.map((tile) => {
    return (
      <Tile
        letter={tile.letter}
        id={tile.id}
        key={tile.id}
        pos={{ ...tile.pos }}
        zIndex={tile.zIndex}
        selected={tile.id === selectedId}
        locked={tile.locked}
        onMove={handleMoveTile}
        onDrop={handleDropTile}
        onTap={handleTapTile}
        onToggleLock={handleToggleLock}
        containerRef={canvasRef}
      />
    )
  })

  return (
    <>
      <div className="tile-canvas-container">
        <div
          className="tile-canvas"
          ref={canvasRef}
          onPointerDown={(e) => {
            // Tapping empty space deselects
            if (e.target === e.currentTarget) select(null)
          }}
        >
          {showTiles && tiles}
        </div>

        <div
          id="shadow-canvas"
          className="hidden-tile-canvas"
          ref={shadowCanvasRef}
        >
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="tile"
              style={{ height: "40px", width: "40px" }}
            >
              {letter.char}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
