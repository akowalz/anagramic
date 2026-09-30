import "./LineTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { type Tile, useMoveableLetters } from "../hooks/useMoveableLetters"
import TileLock from "../TileLock/TileLock"
import { TAP_THRESHOLD } from "../DraggableTile/DraggableTile"
import { rubberBand } from "../lib/rubber-band"

import { useEffect, useRef, useState } from "react"
import { Reorder } from "motion/react"
import { tileSpring, tileSpringCss } from "../lib/animation"

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
  const resistStartRef = useRef(0)
  const [resisting, setResisting] = useState<{ id: string; x: number } | null>(
    null,
  )

  function startResisting(tile: Tile, e: React.PointerEvent<HTMLElement>) {
    if (!tile.locked) return
    e.currentTarget.setPointerCapture(e.pointerId)
    resistStartRef.current = e.clientX
    setResisting({ id: tile.id, x: 0 })
  }

  function resist(tile: Tile, e: React.PointerEvent<HTMLElement>) {
    if (resisting?.id !== tile.id) return
    const deltaX = e.clientX - resistStartRef.current
    if (Math.abs(deltaX) >= TAP_THRESHOLD) draggedRef.current = true
    setResisting({ id: tile.id, x: rubberBand({ x: deltaX, y: 0 }).x })
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
            "--tile-spring": tileSpringCss,
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
              onPointerUp={() => setResisting(null)}
              onPointerCancel={() => setResisting(null)}
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
