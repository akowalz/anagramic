import "./FloatingTool.css"
import { useEffect, useState } from "react"
import { type Coord } from "../lib/coordinate-plane"

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
  // return [
  //   { letter: "0,0", coords: { x: 0, y: 0 }, xDir: 0, yDir: 0 },
  //   { letter: "1,1", coords: { x: 1, y: 1 }, xDir: 0, yDir: 0 },
  //   { letter: "-1,-1", coords: { x: -1, y: -1 }, xDir: 0, yDir: 0 },
  //   { letter: "1,-1", coords: { x: 1, y: -1 }, xDir: 0, yDir: 0 },
  //   { letter: "-1,1", coords: { x: -1, y: 1 }, xDir: 0, yDir: 0 },
  // ]
  const SPEED = 0.0
  return letters.map((letter) => {
    const angle = Math.random() * Math.PI * 2

    return {
      letter,
      coords: { x: Math.random(), y: Math.random() },
      xDir: Math.cos(angle) * SPEED,
      yDir: Math.sin(angle) * SPEED,
    }
  })
}

function updateTile(tile: FloatingTile): FloatingTile {
  const updatedTile = { ...tile }

  const newX = tile.coords.x + tile.xDir
  const newY = tile.coords.y + tile.yDir

  if (Math.abs(newX) > 1) {
    updatedTile.xDir *= -1
  }

  if (Math.abs(newY) > 1) {
    updatedTile.yDir *= -1
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
    translate: `
      calc((50cqw - 20px) * ${coord.x})
      calc((50cqh - 20px) * ${-1 * coord.y})
    `,
  }
}

export default function FloatingTool({ letters }: Props) {
  const [tiles, setTiles] = useState<FloatingTile[]>(initializeTiles(letters))
  const FRAMERATE = 100

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTiles((prevTiles: FloatingTile[]) => {
        return prevTiles.map((tile) => {
          return updateTile(tile)
        })
      })
    }, FRAMERATE)

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
            style={{
              ...coordToTranslate(tile.coords),
              transition: `translate ${FRAMERATE}ms linear`,
            }}
          >
            {tile.letter}
          </div>
        )
      })}
    </div>
  )
}
