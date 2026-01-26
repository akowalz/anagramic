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

  // wont be in hook
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // maybe will be in hook?
  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  // could be in hook minus drag logic
  function onClickLetter(index: number) {
    if (isDragging) return

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
              value={tile}
              className={`
                  tile
                  line-tool-tile
                  ${index === activeIndex ? "active" : ""}
                `}
              key={tile.id}
              onClick={(e) => {
                e.stopPropagation()
                onClickLetter(index)
              }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              transition={spring}
              layout
            >
              {tile.letter}
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </>
  )
}
