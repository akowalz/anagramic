import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { useMoveableLetters } from "../hooks/useMoveableLetters"
import { coordToPosition, positionToStyle } from "../lib/coordinate-plane.ts"
import TileLock from "../TileLock/TileLock"

import { useEffect, useState } from "react"

import * as motion from "motion/react-client"
import { tileSpring } from "../lib/animation"
import type { Letter } from "../lib/letters"

type Props = {
  letters: Letter[]
  selectedId: number | null
  select: (id: number | null) => void
  registerActions: (actions: ToolActions) => void
}

export default function WheelTool({
  letters,
  selectedId,
  select,
  registerActions,
}: Props) {
  const { tiles, shuffleTiles, resetPositions, swapTiles, toggleLock } =
    useMoveableLetters(letters, select)

  const selectedIndex = tiles.findIndex((tile) => tile.id === selectedId)
  const activeIndex = selectedIndex === -1 ? null : selectedIndex

  // A locked tile that was just tapped to swap, shaken to show it can't move
  const [refusedId, setRefusedId] = useState<number | null>(null)

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  function onClickTile(index: number) {
    if (activeIndex === index) {
      select(null)
      return
    }

    if (activeIndex !== null) {
      // Locked tiles can't be swapped: shake the locked one and select the
      // tapped tile instead (e.g. to show its unlock button)
      const lockedIndex = [index, activeIndex].find((i) => tiles[i].locked)
      if (lockedIndex !== undefined) {
        setRefusedId(tiles[lockedIndex].id)
        select(tiles[index].id)
        return
      }

      swapTiles(activeIndex, index)
      return
    }

    select(tiles[index].id)
  }

  const tileStyles = tiles.map((_, index) => {
    const TWO_PI = Math.PI * 2
    const theta = TWO_PI / tiles.length

    const y = Math.cos(theta * index)
    const x = Math.sin(theta * index)

    return positionToStyle(coordToPosition({ x, y }))
  })

  return (
    <>
      <div
        className="wheel-tool-container"
        onClick={() => select(null)}
      >
        <div className="wheel-boundary">
          {tiles.map((tile, index) => {
            return (
              <motion.li
                className={`tile wheel-tool-tile ${
                  index === activeIndex ? "active" : ""
                } ${tile.locked ? "locked" : ""} ${
                  tile.id === refusedId ? "refused" : ""
                }`}
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
                {tile.letter}
                <TileLock
                  selected={index === activeIndex}
                  locked={tile.locked}
                  onToggle={() => toggleLock(tile.id)}
                />
              </motion.li>
            )
          })}
        </div>
      </div>
    </>
  )
}
