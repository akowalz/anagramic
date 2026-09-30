import "./DraggableTile.css"
import { useRef, useState } from "react"
import { tileSpringCss } from "../lib/animation"
import TileLock from "../TileLock/TileLock"

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
const TAP_THRESHOLD = 5

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

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
    if (!dragging) return
    if (!containerRef.current) return

    if (!movedRef.current) {
      const start = pointerStartRef.current
      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y)
      if (distance < TAP_THRESHOLD) return
      movedRef.current = true
    }

    const rect = containerRef.current.getBoundingClientRect()

    onMove(id, {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)

    if (!movedRef.current) {
      if (e.type === "pointerup") onTap(id)
      return
    }

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    onDrop(id, {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y,
    })
  }

  const scale = dragging ? 1.11 : 1
  const transform = `translate(${pos.x}px, ${pos.y}px) translateZ(0) scale(${scale})`

  return (
    <div
      className={`tile draggable-tile ${dragging ? "dragging" : ""} ${
        selected ? "active" : ""
      } ${locked ? "locked" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        {
          transform,
          zIndex,
          "--tile-size": `${TILE_SIZE}px`,
          "--tile-spring": tileSpringCss,
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
