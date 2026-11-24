import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react"
import { flushSync } from "react-dom"
import DraggableTile from "../DraggableTile/DraggableTile"
import "./TilesTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { shuffleTilePositions } from "../lib/shuffle-positions"
import { resolveOverlaps, type Bounds, type Pos } from "../lib/resolve-overlaps"
import { fitToBounds, placeClearOfTiles } from "../lib/place-tiles"
import type { Board } from "../lib/board"
import type { BoardActions } from "../hooks/useBoard"
import type { Hints } from "../hooks/useHints"
import Hint from "../Hint/Hint"

type Props = {
  board: Board
  actions: BoardActions
  hints: Hints
  ref: Ref<ToolActions>
}

/*
 * Where the tiles are once any has been dragged by hand. Until then, and
 * again after a reset, the tiles are tidy: laid out like text, wrapping onto
 * new rows, in the board's arrangement.
 */
type Placement = {
  positions: Record<number, Pos>
  zIndex: Record<number, number>
}

type PlacedTile = {
  id: number
  char: string
  locked: boolean
  pos: Pos
  zIndex: number
}

function samePositions(a: Pos[], b: Pos[]): boolean {
  return (
    a.length === b.length &&
    a.every((pos, index) => pos.x === b[index].x && pos.y === b[index].y)
  )
}

function positionsOf(tiles: { id: number; pos: Pos }[]): Record<number, Pos> {
  return Object.fromEntries(tiles.map((tile) => [tile.id, tile.pos]))
}

/*
 * Freeform: drag the tiles anywhere. Until a tile is dragged they're tidy and
 * follow the board's arrangement, so shuffling here shuffles it for the other
 * tools too. Once moved by hand, the tiles' positions are this tool's own.
 */
export default function TilesTool({ board, actions, hints, ref }: Props) {
  // Moving is learned once tiles have been dragged a couple of times
  const MOVE_LEARNED_AFTER = 2
  const [drags, setDrags] = useState(0)
  const hint = hints.nearLetters("Tiles")

  const canvasRef = useRef<HTMLDivElement>(null)
  const shadowCanvasRef = useRef<HTMLDivElement>(null)

  // Where each place in the tidy layout is, measured from a hidden copy of it
  const [slots, setSlots] = useState<Pos[]>([])
  // Null while the tiles are tidy
  const [placement, setPlacement] = useState<Placement | null>(null)

  const slotOf = new Map(board.order.map((id, index) => [id, index]))

  // Tiles are rendered in the order typed, not the arrangement, so they keep
  // their place in the DOM and animate to their new positions on a shuffle. A
  // tile isn't shown until it has a position.
  const tiles: PlacedTile[] = board.letters.flatMap((letter) => {
    const slot = slotOf.get(letter.id) ?? -1
    const pos = placement ? placement.positions[letter.id] : slots[slot]
    if (!pos) return []

    return [
      {
        id: letter.id,
        char: letter.char,
        locked: board.locked.has(letter.id),
        pos,
        zIndex: placement?.zIndex[letter.id] ?? 0,
      },
    ]
  })

  /* Measure the tidy layout, unless the tool is hidden and has no layout */
  const measureSlots = useCallback(() => {
    const shadowCanvas = shadowCanvasRef.current
    if (!shadowCanvas || shadowCanvas.offsetWidth === 0) return

    const measured = Array.from(
      shadowCanvas.querySelectorAll<HTMLElement>(".tile"),
      (tile) => ({ x: tile.offsetLeft, y: tile.offsetTop }),
    )
    setSlots((slots) => (samePositions(slots, measured) ? slots : measured))
  }, [])

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

  // The tidy layout changes with the number of letters. A layout effect so
  // tiles are in place before the next paint.
  const letterCount = board.letters.length
  useLayoutEffect(() => {
    measureSlots()
  }, [letterCount, measureSlots])

  // Follow the layout when the canvas changes size, e.g. while the keyboard
  // opens, or when this tool is shown after being hidden
  const tidy = placement === null
  const locked = board.locked
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const shadowCanvas = shadowCanvasRef.current
    if (!canvas || !shadowCanvas) return

    // An observer reports once when it starts watching, and this one starts
    // again whenever the tiles go from tidy to placed by hand, e.g. at the start
    // of a drag. Only act on real changes of size.
    const sizeOf = () =>
      `${shadowCanvas.offsetWidth}x${shadowCanvas.offsetHeight}`
    let lastSize = sizeOf()

    let frame = 0
    const observer = new ResizeObserver(() => {
      const size = sizeOf()
      if (size === lastSize) return
      lastSize = size
      if (shadowCanvas.offsetWidth === 0) return

      if (tidy) {
        // Move the tiles in the same frame as the layout, without the
        // transition, so they stay put relative to it rather than sliding
        canvas.classList.add("snapping")
        flushSync(measureSlots)
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => canvas.classList.remove("snapping"))
        return
      }

      // Tiles placed by hand stay put, but any the canvas no longer has room
      // for are pulled back in
      measureSlots()
      const bounds = getBounds()
      setPlacement((placement) => {
        if (!placement) return placement

        const placed = Object.entries(placement.positions).map(([id, pos]) => ({
          id: Number(id),
          pos,
          locked: locked.has(Number(id)),
        }))
        const fitted = fitToBounds(placed, bounds)
        return fitted === placed
          ? placement
          : { ...placement, positions: positionsOf(fitted) }
      })
    })
    observer.observe(shadowCanvas)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [tidy, locked, measureSlots, getBounds])

  // Once tiles have been placed by hand, a newly typed letter goes where the
  // tidy layout would put it, moved clear of the tiles already there
  useLayoutEffect(() => {
    if (!placement) return
    if (canvasRef.current?.offsetWidth === 0) return

    const unplaced = board.order.flatMap((id, slot) =>
      placement.positions[id] || !slots[slot] ? [] : [{ id, pos: slots[slot] }],
    )
    if (unplaced.length === 0) return

    const bounds = getBounds()
    const present = new Set(board.order)
    const placed = Object.entries(placement.positions).flatMap(([id, pos]) =>
      present.has(Number(id))
        ? [{ id: Number(id), pos, locked: board.locked.has(Number(id)) }]
        : [],
    )
    const withNew = unplaced.reduce(
      (tiles, tile) =>
        placeClearOfTiles(
          [...tiles, { ...tile, locked: false }],
          tile.id,
          tile.pos,
          bounds,
        ),
      placed,
    )

    // Where tiles go depends on the measured layout, so they can only be
    // placed once it has rendered, here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlacement({ ...placement, positions: positionsOf(withNew) })
  }, [placement, board, slots, getBounds])

  useImperativeHandle(ref, () => ({
    reset() {
      setPlacement(null)
      actions.reset()
    },
    shuffle() {
      if (!placement) {
        actions.shuffle()
        return
      }

      // Placed by hand: swap the tiles' spots, leaving locked ones put
      actions.select(null)
      setPlacement({
        ...placement,
        positions: positionsOf(shuffleTilePositions(tiles, (t) => t.locked)),
      })
    },
  }))

  function handleTap(id: number) {
    actions.select(board.selectedId === id ? null : id)
  }

  // Dragging a tile places every tile by hand, starting from where they are
  function handleMove(id: number, pos: Pos) {
    actions.select(null)

    setPlacement((placement) => {
      const current = placement ?? {
        positions: positionsOf(tiles),
        zIndex: {},
      }
      const top = Math.max(0, ...Object.values(current.zIndex))
      const zIndex = current.zIndex[id] === top && top > 0 ? top : top + 1

      return {
        positions: { ...current.positions, [id]: pos },
        zIndex: { ...current.zIndex, [id]: zIndex },
      }
    })
  }

  // A dropped tile pushes aside any it lands on
  function handleDrop(id: number, pos: Pos) {
    setDrags(drags + 1)
    if (drags + 1 >= MOVE_LEARNED_AFTER) hints.learn("freeform-move")

    const bounds = getBounds()

    setPlacement((placement) => {
      const current = placement ?? { positions: positionsOf(tiles), zIndex: {} }
      const dropped = tiles.map((tile) => ({
        id: tile.id,
        locked: tile.locked,
        pos: tile.id === id ? pos : (current.positions[tile.id] ?? tile.pos),
      }))

      return {
        ...current,
        positions: positionsOf(resolveOverlaps(dropped, id, bounds)),
      }
    })
  }

  return (
    <div className="tile-canvas-container">
      <div
        className="tile-canvas"
        ref={canvasRef}
        onPointerDown={(e) => {
          // Tapping empty space deselects
          if (e.target === e.currentTarget) actions.select(null)
        }}
      >
        {tiles.length > 0 && slots.length > 0 && (
          <Hint
            className="freeform-hint"
            text={hint}
            // Just above where the tiles start out, and it stays there: tiles
            // can be dragged right over it
            style={{ top: slots[0].y }}
          />
        )}
        {tiles.map((tile) => (
          <DraggableTile
            key={tile.id}
            id={tile.id}
            letter={tile.char}
            pos={tile.pos}
            zIndex={tile.zIndex}
            selected={tile.id === board.selectedId}
            locked={tile.locked}
            onMove={handleMove}
            onDrop={handleDrop}
            onTap={handleTap}
            onToggleLock={actions.toggleLock}
            containerRef={canvasRef}
          />
        ))}
      </div>

      {/* The tidy layout, laid out by the browser and measured for slots */}
      <div id="shadow-canvas" ref={shadowCanvasRef}>
        {board.letters.map((letter) => (
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
  )
}
