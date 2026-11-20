import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { coordToPosition, positionToStyle } from "../lib/coordinate-plane.ts"
import TileLock from "../TileLock/TileLock"
import { tilesInOrder, type Board } from "../lib/board"
import type { BoardActions } from "../hooks/useBoard"

import { useImperativeHandle, useState, type Ref } from "react"

import * as motion from "motion/react-client"
import { tileSpring } from "../lib/animation"

type Props = {
  board: Board
  actions: BoardActions
  ref: Ref<ToolActions>
}

/*
 * The letters around a circle, in the board's arrangement. Tap one tile and
 * then another to swap them.
 */
export default function WheelTool({ board, actions, ref }: Props) {
  const tiles = tilesInOrder(board)
  const selectedIndex = tiles.findIndex((tile) => tile.id === board.selectedId)

  useImperativeHandle(
    ref,
    () => ({ reset: actions.reset, shuffle: actions.shuffle }),
    [actions],
  )

  // A locked tile that was just tapped to swap, shaken to show it can't move
  const [refusedId, setRefusedId] = useState<number | null>(null)

  function onClickTile(index: number) {
    const tile = tiles[index]

    if (selectedIndex === index) {
      actions.select(null)
      return
    }

    if (selectedIndex !== -1) {
      const selectedTile = tiles[selectedIndex]

      // Locked tiles can't be swapped: shake the locked one and select the
      // tapped tile instead (e.g. to show its unlock button)
      const lockedTile = [tile, selectedTile].find((t) => t.locked)
      if (lockedTile) {
        setRefusedId(lockedTile.id)
        actions.select(tile.id)
        return
      }

      actions.swap(selectedTile.id, tile.id)
      return
    }

    actions.select(tile.id)
  }

  const tileStyles = tiles.map((_, index) => {
    const TWO_PI = Math.PI * 2
    const theta = TWO_PI / tiles.length

    const y = Math.cos(theta * index)
    const x = Math.sin(theta * index)

    return positionToStyle(coordToPosition({ x, y }))
  })

  return (
    <div
      className="wheel-tool-container"
      onClick={() => actions.select(null)}
    >
      <div className="wheel-boundary">
        {tiles.map((tile, index) => {
          const selected = index === selectedIndex

          return (
            <motion.li
              className={`tile wheel-tool-tile ${selected ? "active" : ""} ${
                tile.locked ? "locked" : ""
              } ${tile.id === refusedId ? "refused" : ""}`}
              key={tile.id}
              onAnimationEnd={(e) => {
                // Ignore animations bubbling up from the lock button
                if (e.target === e.currentTarget) setRefusedId(null)
              }}
              style={tileStyles[index]}
              onClick={(e) => {
                e.stopPropagation()
                onClickTile(index)
              }}
              transition={tileSpring}
              layout
            >
              {tile.char}
              <TileLock
                selected={selected}
                locked={tile.locked}
                onToggle={() => actions.toggleLock(tile.id)}
              />
            </motion.li>
          )
        })}
      </div>
    </div>
  )
}
