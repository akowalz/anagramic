import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { useMoveableLetters } from "../hooks/useMoveableLetters"

import { useEffect } from "react"

import * as motion from "motion/react-client"
import type { Transition } from "motion"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

type Coord = {
  x: number
  y: number
}

type Position = {
  top: number
  left: number
}

const spring: Transition = {
  type: "spring",
  damping: 50,
  stiffness: 1000,
}

function coordToPosition(coord: Coord) {
  const { x, y } = coord

  if (x < -1.0 || x > 1.0) throw "x out of range"
  if (y < -1.0 || y > 1.0) throw "x out of range"

  return {
    left: x * 0.5 + 0.5,
    top: y * -0.5 + 0.5,
  }
}

function positionToStyle(position: Position) {
  return {
    top: `${position.top * 100}%`,
    left: `${position.left * 100}%`,
  }
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
