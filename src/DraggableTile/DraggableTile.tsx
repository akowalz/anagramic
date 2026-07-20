import "./DraggableTile.css"
import { useState } from "react"

type Pos = { x: number; y: number }

type Props = {
  letter: string
  id: number
  pos: Pos
  zIndex: number
  onMove: (id: number, pos: Pos) => void
  onDrop: (id: number, pos: Pos) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

/* Tile height and width */
export const TILE_SIZE = 40

export default function DraggableTile({
  letter,
  pos,
  id,
  zIndex,
  onMove,
  onDrop,
  containerRef,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Pos>({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = containerRef.current.getBoundingClientRect()

    // Calculate the offset from the tile's current position to where the cursor is
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    const offsetX = cursorX - pos.x
    const offsetY = cursorY - pos.y

    setDragOffset({ x: offsetX, y: offsetY })
    setDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    onMove(id, {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)

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
