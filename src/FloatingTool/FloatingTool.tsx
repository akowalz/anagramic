import "./FloatingTool.css"
import { useEffect, useState } from "react"
import {
  coordToPosition,
  positionToStyle,
  type Coord,
} from "../lib/coordinate-plane"

type Props = {
  letters: string[]
}

type FloatingTile = {
  letter: string
  coords: Coord
  xDir: number
  yDir: number
}

function initializeTiles(letters: string[]): FloatingTile[] {
  return letters.map((letter) => ({
    letter,
    coords: { x: Math.random(), y: Math.random() },
    xDir: Math.random() * 0.1,
    yDir: Math.random() * 0.1,
  }))
}

function updateTile(tile: FloatingTile): FloatingTile {
  const updatedTile = { ...tile }

  let newX = tile.coords.x + tile.xDir
  let newY = tile.coords.y + tile.yDir

  if (newX > 1.0 || newX < -1.0) {
    newX = tile.coords.x
    updatedTile.xDir = updatedTile.xDir * -1
  }

  if (newY > 1.0 || newY < -1.0) {
    newY = tile.coords.y
    updatedTile.yDir = updatedTile.yDir * -1
  }

  return {
    letter: updatedTile.letter,
    coords: { x: newX, y: newY },
    xDir: updatedTile.xDir,
    yDir: updatedTile.yDir,
  }
}

export default function FloatingTool({ letters }: Props) {
  const [tiles, setTiles] = useState<FloatingTile[]>(initializeTiles(letters))

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTiles((prevTiles: FloatingTile[]) => {
        return prevTiles.map((tile) => {
          return updateTile(tile)
        })
      })
    }, 200)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="floating-tool-container">
      {tiles.map((tile: FloatingTile, index: number) => {
        return (
          <div
            key={index}
            className="tile floating-tool-tile"
            style={positionToStyle(coordToPosition(tile.coords))}
          >
            {tile.letter}
          </div>
        )
      })}
    </div>
  )
}
