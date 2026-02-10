import "./FloatingTool.css"
import { useCallback, useEffect, useRef, useState } from "react"
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

const UNITS_PER_SECOND = 0.5 // How fast in normalized coords (0-2 range)

function randomCoords(): Coord {
  return {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  }
}

function randomDirection(): { xDir: number; yDir: number } {
  const angle = Math.random() * Math.PI * 2

  return {
    xDir: Math.cos(angle),
    yDir: Math.sin(angle),
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

function updateTile(tile: FloatingTile, deltaSeconds: number): FloatingTile {
  const distance = UNITS_PER_SECOND * deltaSeconds

  let newX = tile.coords.x + tile.xDir * distance
  let newY = tile.coords.y + tile.yDir * distance
  let xDir = tile.xDir
  let yDir = tile.yDir

  if (Math.abs(newX) > 1) {
    xDir *= -1
    newX = Math.max(-1, Math.min(1, newX))
  }

  if (Math.abs(newY) > 1) {
    yDir *= -1
    newY = Math.max(-1, Math.min(1, newY))
  }

  return {
    letter: tile.letter,
    coords: { x: newX, y: newY },
    xDir,
    yDir,
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

const SHUFFLE_DURATION_MS = 333

export default function FloatingTool({
  letters,
  active,
  registerActions,
}: Props) {
  const [tiles, setTiles] = useState<FloatingTile[]>(initializeTiles(letters))
  const [shuffling, setShuffling] = useState(false)
  const lastFrameTimeRef = useRef<number | null>(null)
  const rafIdRef = useRef<number>(0)
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shuffleTiles = useCallback(() => {
    setShuffling(true)

    setTiles((tiles) =>
      tiles.map((tile) => ({
        ...tile,
        coords: randomCoords(),
        ...randomDirection(),
      })),
    )

    if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current)

    shuffleTimeoutRef.current = setTimeout(() => {
      setShuffling(false)
    }, SHUFFLE_DURATION_MS)
  }, [])

  /* Action Registration */
  useEffect(() => {
    registerActions({
      shuffle: () => shuffleTiles(),
    })
    return () => {
      if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current)
    }
  }, [])

  /* Update positions with requestAnimationFrame */
  useEffect(() => {
    if (!active || shuffling) return

    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current !== null) {
        const deltaSeconds = (timestamp - lastFrameTimeRef.current) / 1000
        // Cap delta to avoid large jumps (e.g. after tab was backgrounded)
        const clampedDelta = Math.min(deltaSeconds, 0.1)

        setTiles((prevTiles) =>
          prevTiles.map((tile) => updateTile(tile, clampedDelta)),
        )
      }

      lastFrameTimeRef.current = timestamp
      rafIdRef.current = requestAnimationFrame(animate)
    }

    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafIdRef.current)
      lastFrameTimeRef.current = null
    }
  }, [active, shuffling])

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
                ...(shuffling && {
                  transition: `translate ${SHUFFLE_DURATION_MS}ms ease-in-out`,
                }),
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
