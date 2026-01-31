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
  }

  const scale = dragging ? 1.11 : 1
  const translateY = dragging ? 70 : 50
  const transform = `translate(
    calc(${pos.x}px - 50%),
    calc(${pos.y}px - ${translateY}%)
  ) scale(${scale})`

  return (
    <div
      className={`tile draggable-tile ${dragging ? "dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ transform, zIndex }}
    >
      {letter}
    </div>
  )
}
