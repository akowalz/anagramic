import "./LineTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { type Tile, useMoveableLetters } from "../hooks/useMoveableLetters"

import { useEffect, useState } from "react"
import { Reorder, type Transition } from "motion/react"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

const spring: Transition = {
  type: "spring",
  damping: 50,
  stiffness: 1000,
}

export default function LineTool({ letters, registerActions }: Props) {
  const {
    tiles,
    setTiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles,
  } = useMoveableLetters(letters)

  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  function onClickLetter(index: number) {
    if (dragId !== null) return

    if (activeIndex !== null) {
      swapTiles(activeIndex, index)
      return
    }

    setActiveIndex(index)
  }

  function onReorder(args: Tile[]) {
    setTiles(args)
    setActiveIndex(null)
  }

  return (
    <>
      <Reorder.Group
        axis="x"
        as="div"
        onClick={() => setActiveIndex(null)}
        values={tiles}
        onReorder={onReorder}
        className="line-tool-container"
        style={{ "--tile-count": tiles.length } as React.CSSProperties}
      >
        {tiles.map((tile, index) => {
          return (
            <Reorder.Item
              as="div"
              className="line-tool-tile"
              value={tile}
              key={tile.id}
              onDragStart={() => setDragId(tile.id)}
              onDragEnd={() => setDragId(null)}
              transition={spring}
              layout
            >
              <div
                className={`
                    tile
                    ${index === activeIndex ? "active" : ""}
                    ${dragId === tile.id ? "dragging" : ""}
                  `}
                onClick={(e) => {
                  e.stopPropagation()
                  onClickLetter(index)
                }}
              >
                {tile.letter}
              </div>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </>
  )
}
