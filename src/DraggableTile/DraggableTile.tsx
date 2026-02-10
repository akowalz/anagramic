import "./DraggableTile.css"
import { useState } from "react"

type Pos = { x: number; y: number }

type Props = {
  letter: string
  id: number
  pos: Pos
  zIndex: number
  onMove: (id: number, pos: Pos) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

/* Tile height and width */
const TILE_SIZE = 40
/* When clicking a tile, move the tile to 50%
X position (middle of the tile), and 70% Y position
(shift tile up a bit) */
const DRAG_OFFSET_X = 0.5
const DRAG_OFFSET_Y = 0.7

export default function DraggableTile({
  letter,
  pos,
  id,
  zIndex,
  onMove,
  containerRef,
}: Props) {
  const [dragging, setDragging] = useState(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = containerRef.current.getBoundingClientRect()

    setDragging(true)
    onMove(id, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    onMove(id, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    onMove(id, {
      x: e.clientX - rect.left - Math.round(TILE_SIZE * DRAG_OFFSET_X),
      y: e.clientY - rect.top - Math.round(TILE_SIZE * DRAG_OFFSET_Y),
    })
  }

  const scale = dragging ? 1.11 : 1
  const translateXPct = dragging ? DRAG_OFFSET_X * 100 : 0
  const translateYPct = dragging ? DRAG_OFFSET_Y * 100 : 0
  const transform = `translate(
    calc(${pos.x}px - ${translateXPct}%),
    calc(${pos.y}px - ${translateYPct}%)
  ) translateZ(0) scale(${scale})`

  return (
    <div
      className={`tile draggable-tile ${dragging ? "dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        {
          transform,
          zIndex,
          "--tile-size": `${TILE_SIZE}px`,
        } as React.CSSProperties
      }
    >
      {letter}
    </div>
  )
}
