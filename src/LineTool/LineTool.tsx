import "./LineTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { type Tile, useMoveableLetters } from "../hooks/useMoveableLetters"
import TileLock from "../TileLock/TileLock"
import { TAP_THRESHOLD } from "../DraggableTile/DraggableTile"
import { rubberBand } from "../lib/rubber-band"

import { useEffect, useRef, useState } from "react"
import { Reorder } from "motion/react"
import { resistSpringCss, tileSpring } from "../lib/animation"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

export default function LineTool({ letters, registerActions }: Props) {
  const {
    tiles,
    setTiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    toggleLock,
  } = useMoveableLetters(letters)

  const [dragId, setDragId] = useState<string | null>(null)
  // Whether the current press turned into a drag, so it isn't also a tap
  const draggedRef = useRef(false)

  // Locked tiles can't be dragged; they give a little under the pointer and
  // spring back instead
  // The pointer pressing on a locked tile. A ref rather than state so every
  // event sees it immediately, without waiting for a re-render.
  const resistPointerRef = useRef<{
    pointerId: number
    id: string
    startX: number
  } | null>(null)
  const [resisting, setResisting] = useState<{ id: string; x: number } | null>(
    null,
  )

  function startResisting(tile: Tile, e: React.PointerEvent<HTMLElement>) {
    if (!tile.locked) return
    if (e.button !== 0 || resistPointerRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    resistPointerRef.current = {
      pointerId: e.pointerId,
      id: tile.id,
      startX: e.clientX,
    }
    setResisting({ id: tile.id, x: 0 })
  }

  function resist(tile: Tile, e: React.PointerEvent<HTMLElement>) {
    const pointer = resistPointerRef.current
    if (pointer?.pointerId !== e.pointerId || pointer.id !== tile.id) return

    // The mouse button is up but the pointerup got lost: stop resisting
    if (e.pointerType === "mouse" && e.buttons === 0) {
      stopResisting(e)
      return
    }

    const deltaX = e.clientX - pointer.startX
    if (Math.abs(deltaX) >= TAP_THRESHOLD) draggedRef.current = true
    setResisting({ id: tile.id, x: rubberBand({ x: deltaX, y: 0 }).x })
  }

  function stopResisting(e: React.PointerEvent<HTMLElement>) {
    if (resistPointerRef.current?.pointerId !== e.pointerId) return
    resistPointerRef.current = null

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setResisting(null)
  }

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  function onReorder(args: Tile[]) {
    setTiles(args)
  }

  return (
    <>
      <Reorder.Group
        axis="x"
        as="div"
        values={tiles}
        onReorder={onReorder}
        onPointerDown={(e) => {
          // Tapping empty space deselects
          if (e.target === e.currentTarget) setActiveIndex(null)
        }}
        className="line-tool-container"
        style={
          {
            "--tile-count": tiles.length,
            "--resist-spring": resistSpringCss,
          } as React.CSSProperties
        }
      >
        {tiles.map((tile, index) => {
          return (
            <Reorder.Item
              as="div"
              value={tile}
              className={`
                  tile
                  line-tool-tile
                  ${tile.id === dragId ? "dragging" : ""}
                  ${index === activeIndex ? "active" : ""}
                  ${tile.locked ? "locked" : ""}
                  ${resisting?.id === tile.id ? "resisting" : ""}
                `}
              key={tile.id}
              drag={tile.locked ? false : "x"}
              style={{
                translate: `${resisting?.id === tile.id ? resisting.x : 0}px 0`,
              }}
              onPointerDown={(e) => startResisting(tile, e)}
              onPointerMove={(e) => resist(tile, e)}
              onPointerUp={stopResisting}
              onPointerCancel={stopResisting}
              onLostPointerCapture={stopResisting}
              onTapStart={() => {
                draggedRef.current = false
              }}
              onTap={() => {
                if (draggedRef.current) return
                setActiveIndex(index === activeIndex ? null : index)
              }}
              onDragStart={() => {
                draggedRef.current = true
                setActiveIndex(null)
                setDragId(tile.id)
              }}
              onDragEnd={() => setDragId(null)}
              transition={tileSpring}
              layout
            >
              {tile.letter}
              <TileLock
                selected={index === activeIndex}
                locked={tile.locked}
                onToggle={() => toggleLock(tile.id)}
              />
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </>
  )
}
