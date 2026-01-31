import "./FloatingTool.css"
import { useEffect, useState } from "react"
import { type Coord } from "../lib/coordinate-plane"
import type { ToolActions } from "../Types/ToolActions"

type Props = {
  letters: string[]
  active: boolean
  registerActions: (actions: ToolActions) => void
}

type FloatingTile = {
  letter: string
  coords: Coord
  xDir: number
  yDir: number
}

/**
 * Constants
 */
const UNITS_PER_SECOND = 0.5 // How fast in normalized coords (0-2 range)
const UPDATE_INTERVAL_MS = 50 // How often to update (20 fps)

// Calculate distance per frame
const UNITS_PER_FRAME = (UNITS_PER_SECOND / 1000) * UPDATE_INTERVAL_MS

function randomCoords(): Coord {
  return {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  }
}

function randomDirection(): { xDir: number; yDir: number } {
  const angle = Math.random() * Math.PI * 2

  return {
    xDir: Math.cos(angle) * UNITS_PER_FRAME,
    yDir: Math.sin(angle) * UNITS_PER_FRAME,
  }
}

function initializeTile(letter: string): FloatingTile {
  return {
    letter,
    coords: randomCoords(),
    ...randomDirection(),
  }
}

function initializeTiles(letters: string[]): FloatingTile[] {
  return letters.map((letter) => initializeTile(letter))
}

function updateTile(tile: FloatingTile): FloatingTile {
  const updatedTile = { ...tile }

  let newX = tile.coords.x + tile.xDir
  let newY = tile.coords.y + tile.yDir

  if (Math.abs(newX) > 1) {
    updatedTile.xDir *= -1
    newX = Math.round(newX)
  }

  if (Math.abs(newY) > 1) {
    updatedTile.yDir *= -1
    newY = Math.round(newY)
  }

  return {
    letter: updatedTile.letter,
    coords: { x: newX, y: newY },
    xDir: updatedTile.xDir,
    yDir: updatedTile.yDir,
  }
}

function coordToTranslate(coord: Coord) {
  return {
    // Slightly more extra space at the bottom to account for the drop shadow
    translate: `
      calc((50cqw - 20px) * ${coord.x})
      calc((50cqh - 25px) * ${-1 * coord.y})
    `,
  }
}

export default function FloatingTool({
  letters,
  active,
  registerActions,
}: Props) {
  const [tiles, setTiles] = useState<FloatingTile[]>(initializeTiles(letters))

  const shuffleTiles = () => {
    setTiles((tiles) => [
      ...tiles.map((tile) => {
        return {
          ...tile,
          coords: randomCoords(),
          ...randomDirection(),
        }
      }),
    ])
  }

  /* Action Registration */
  useEffect(() => {
    registerActions({
      shuffle: () => shuffleTiles(),
    })
  }, [])

  /* Update positions at interval */
  useEffect(() => {
    if (!active) return

    const intervalId = setInterval(() => {
      setTiles((prevTiles: FloatingTile[]) => {
        return prevTiles.map((tile) => {
          return updateTile(tile)
        })
      })
    }, UPDATE_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [active])

  return (
    <div className="floating-tool-container">
      <div className="floating-tool-box">
        {tiles.map((tile: FloatingTile, index: number) => {
          return (
            <div
              key={index}
              className="tile floating-tool-tile"
              style={{
                ...coordToTranslate(tile.coords),
                transition: `translate ${UPDATE_INTERVAL_MS}ms linear`,
              }}
            >
              {tile.letter}
            </div>
          )
        })}
      </div>
    </div>
  )
}
