import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { useMoveableLetters } from "../hooks/useMoveableLetters"
import { coordToPosition, positionToStyle } from "../lib/coordinate-plane.ts"
import TileLock from "../TileLock/TileLock"

import { useEffect, useState } from "react"

import * as motion from "motion/react-client"
import { tileSpring } from "../lib/animation"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

export default function WheelTool({ letters, registerActions }: Props) {
  const {
    tiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles,
    toggleLock,
  } = useMoveableLetters(letters)

  // A locked tile that was just tapped to swap, shaken to show it can't move
  const [refusedId, setRefusedId] = useState<string | null>(null)

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  function onClickTile(index: number) {
    if (activeIndex === index) {
      setActiveIndex(null)
      return
    }

    if (activeIndex !== null) {
      // Locked tiles can't be swapped: shake the locked one and select the
      // tapped tile instead (e.g. to show its unlock button)
      const lockedIndex = [index, activeIndex].find((i) => tiles[i].locked)
      if (lockedIndex !== undefined) {
        setRefusedId(tiles[lockedIndex].id)
        setActiveIndex(index)
        return
      }

      swapTiles(activeIndex, index)
      return
    }

    setActiveIndex(index)
  }

  const tileStyles = letters.map((_, index) => {
    const TWO_PI = Math.PI * 2
    const theta = TWO_PI / letters.length

    const y = Math.cos(theta * index)
    const x = Math.sin(theta * index)

    return positionToStyle(coordToPosition({ x, y }))
  })

  return (
    <>
      <div
        className="wheel-tool-container"
        onClick={() => setActiveIndex(null)}
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
