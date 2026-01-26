import "./DraggableTile.css"
import { useMemo, useState } from "react"

type Pos = { x: number; y: number }

type Props = {
  letter: string
  id: number
  pos: Pos
  zIndex: number
  onMove: (id: number, pos: Pos) => void
}

/* When dragging, pull the tile UP a bit for visual clarity */
const VISUAL_DRAG_OFFSET_Y = 8

export default function DraggableTile({
  letter,
  pos,
  id,
  zIndex,
  onMove,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)

    setDragging(true)
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return

    onMove(id, { x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  const translateValue = useMemo(() => {
    const y = dragging ? pos.y - VISUAL_DRAG_OFFSET_Y : pos.y
    return `translate(${pos.x}px, ${y}px)`
  }, [dragging, pos])

  return (
    <div
      className={`tile draggable-tile ${dragging ? "dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: translateValue,
        zIndex,
      }}
    >
      {letter}
    </div>
  )
}
