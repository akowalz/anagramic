import "./DraggableTile.css"
import { useState } from "react"

type Pos = { x: number; y: number }

type Props = {
  letter: string
  id: number
  relativePos: Pos
  zIndex: number
  onMove: (id: number, pos: Pos) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function DraggableTile({
  letter,
  relativePos,
  id,
  zIndex,
  onMove,
  containerRef,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = containerRef.current.getBoundingClientRect()

    const pixelX = relativePos.x * rect.width
    const pixelY = relativePos.y * rect.height

    setDragging(true)
    setOffset(() => ({
      x: e.clientX - rect.left - pixelX,
      y: e.clientY - rect.top - pixelY,
    }))
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    onMove(id, {
      x: (e.clientX - rect.left - offset.x) / rect.width,
      y: (e.clientY - rect.top - offset.y) / rect.height,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <div
      className={`tile draggable-tile ${dragging ? "dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${relativePos.x * 100}cqw, ${relativePos.y * 100}cqh)`,
        zIndex,
      }}
    >
      {letter}
    </div>
  )
}
