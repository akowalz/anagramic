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
    shuffleTiles,
    resetPositions,
  } = useMoveableLetters(letters)

  const [dragId, setDragId] = useState<string | null>(null)

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
        className="line-tool-container"
        style={{ "--tile-count": tiles.length } as React.CSSProperties}
      >
        {tiles.map((tile) => {
          return (
            <Reorder.Item
              as="div"
              value={tile}
              className={`
                  tile
                  line-tool-tile
                  ${tile.id === dragId ? "dragging" : ""}
                `}
              key={tile.id}
              onDragStart={() => setDragId(tile.id)}
              onDragEnd={() => setDragId(null)}
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
