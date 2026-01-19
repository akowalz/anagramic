import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { useMoveableLetters } from "../hooks/useMoveableLetters"
import { coordToPosition, positionToStyle } from "../lib/coordinate-plane.ts"

import { useEffect } from "react"

import * as motion from "motion/react-client"
import type { Transition } from "motion"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

const spring: Transition = {
  type: "spring",
  damping: 50,
  stiffness: 1000,
}

export default function WheelTool({ letters, registerActions }: Props) {
  const {
    tiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles,
  } = useMoveableLetters(letters)

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  function onClickTile(index: number) {
    if (activeIndex !== null) {
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
                }`}
                key={tile.id}
                style={tileStyles[index]}
                onClick={(e) => {
                  e.stopPropagation()
                  onClickTile(index)
                }}
                transition={spring}
                layout
              >
                {tile.letter}
              </motion.li>
            )
          })}
        </div>
      </div>
    </>
  )
}
