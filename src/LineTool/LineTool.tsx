import "./LineTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { type Tile, useMoveableLetters } from "../hooks/useMoveableLetters"
import TileLock from "../TileLock/TileLock"

import { useEffect, useRef, useState } from "react"
import { Reorder } from "motion/react"
import { tileSpring } from "../lib/animation"

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
        style={{ "--tile-count": tiles.length } as React.CSSProperties}
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
                `}
              key={tile.id}
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
