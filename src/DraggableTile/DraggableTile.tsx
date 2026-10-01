import "./DraggableTile.css"
import { useRef, useState } from "react"
import { resistSpringCss, tileSpringCss } from "../lib/animation"
import TileLock from "../TileLock/TileLock"
import { rubberBand } from "../lib/rubber-band"

type Pos = { x: number; y: number }

type Props = {
  letter: string
  id: number
  pos: Pos
  zIndex: number
  selected: boolean
  locked: boolean
  onMove: (id: number, pos: Pos) => void
  onDrop: (id: number, pos: Pos) => void
  onTap: (id: number) => void
  onToggleLock: (id: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

/* Tile height and width */
export const TILE_SIZE = 40

/* How far (px) the pointer can move and still count as a tap, not a drag */
export const TAP_THRESHOLD = 5

export default function DraggableTile({
  letter,
  pos,
  id,
  zIndex,
  selected,
  locked,
  onMove,
  onDrop,
  onTap,
  onToggleLock,
  containerRef,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Pos>({ x: 0, y: 0 })
  const pointerStartRef = useRef<Pos>({ x: 0, y: 0 })
  const movedRef = useRef(false)
  const [resistOffset, setResistOffset] = useState<Pos>({ x: 0, y: 0 })
  // The pointer driving the current drag. A ref rather than state so every
  // event sees it immediately, without waiting for a re-render.
  const activePointerRef = useRef<number | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    // Only the main button drags, and only one pointer at a time
    if (e.button !== 0 || activePointerRef.current !== null) return

    activePointerRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = containerRef.current.getBoundingClientRect()

    // Calculate the offset from the tile's current position to where the cursor is
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    const offsetX = cursorX - pos.x
    const offsetY = cursorY - pos.y

    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    setDragOffset({ x: offsetX, y: offsetY })
    setDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return
    if (!containerRef.current) return

    // The mouse button is up but we never got a pointerup (it can get lost,
    // e.g. on a quick grab): end the drag here instead of leaving the tile
    // stuck to the cursor
    if (e.pointerType === "mouse" && e.buttons === 0) {
      endDrag(e, { canTap: false })
      return
    }

    const start = pointerStartRef.current
    const delta = { x: e.clientX - start.x, y: e.clientY - start.y }
    if (Math.hypot(delta.x, delta.y) >= TAP_THRESHOLD) movedRef.current = true

    // Locked tiles resist being dragged rather than following the pointer
    if (locked) {
      setResistOffset(rubberBand(delta))
      return
    }

    if (!movedRef.current) return

    const rect = containerRef.current.getBoundingClientRect()

    onMove(id, {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y,
    })
  }

  /*
   * Finish the drag on pointerup, or whenever the pointer is lost (cancel,
   * lost capture, released unnoticed). Only a real pointerup can be a tap.
   */
  function endDrag(
    e: React.PointerEvent<HTMLDivElement>,
    { canTap }: { canTap: boolean },
  ) {
    if (activePointerRef.current !== e.pointerId) return
    activePointerRef.current = null

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDragging(false)
    setResistOffset({ x: 0, y: 0 })

    if (locked && movedRef.current) return

    if (!movedRef.current) {
      if (canTap) onTap(id)
      return
    }

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    onDrop(id, {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y,
    })
  }

  // Locked tiles stay rigid (no lift) and spring back when released
  const resisting = dragging && locked
  const scale = dragging && !locked ? 1.11 : 1
  const x = pos.x + resistOffset.x
  const y = pos.y + resistOffset.y
  const transform = `translate(${x}px, ${y}px) translateZ(0) scale(${scale})`

  return (
    <div
      className={`tile draggable-tile ${
        dragging && !locked ? "dragging" : ""
      } ${resisting ? "resisting" : ""} ${selected ? "active" : ""} ${
        locked ? "locked" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => endDrag(e, { canTap: true })}
      onPointerCancel={(e) => endDrag(e, { canTap: false })}
      onLostPointerCapture={(e) => endDrag(e, { canTap: false })}
      style={
        {
          transform,
          zIndex,
          "--tile-size": `${TILE_SIZE}px`,
          "--tile-spring": tileSpringCss,
          "--resist-spring": resistSpringCss,
        } as React.CSSProperties
      }
    >
      {letter}
      <TileLock
        selected={selected}
        locked={locked}
        onToggle={() => onToggleLock(id)}
      />
    </div>
  )
}
