import "./FloatingTool.css"
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react"
import { type Coord } from "../lib/coordinate-plane"
import type { ToolActions } from "../Types/ToolActions"
import { tileSpringCss, tileSpringCssMs } from "../lib/animation"
import { syncTilesInLetterOrder } from "../lib/sync-tiles"
import type { Letter } from "../lib/letters"
import type { Board } from "../lib/board"
import type { BoardActions } from "../hooks/useBoard"
import type { Hints } from "../hooks/useHints"
import { currentHint, HINT_TEXT } from "../lib/hints"
import Hint from "../Hint/Hint"

type Props = {
  board: Board
  actions: BoardActions
  hints: Hints
  active: boolean
  ref: Ref<ToolActions>
}

/* Where a letter is drifting, kept by this tool alone */
type Drift = {
  // The id of the letter
  id: number
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

function newDrift(letter: Letter): Drift {
  return {
    id: letter.id,
    coords: randomCoords(),
    ...randomDirection(),
  }
}

function updateDrift(drift: Drift, deltaSeconds: number): Drift {
  const distance = UNITS_PER_SECOND * deltaSeconds

  let newX = drift.coords.x + drift.xDir * distance
  let newY = drift.coords.y + drift.yDir * distance
  let xDir = drift.xDir
  let yDir = drift.yDir

  if (Math.abs(newX) > 1) {
    xDir *= -1
    newX = Math.max(-1, Math.min(1, newX))
  }

  if (Math.abs(newY) > 1) {
    yDir *= -1
    newY = Math.max(-1, Math.min(1, newY))
  }

  return { id: drift.id, coords: { x: newX, y: newY }, xDir, yDir }
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

const SHUFFLE_DURATION_MS = tileSpringCssMs

/*
 * The letters drift around a box. Locks don't apply here: every letter
 * drifts and shuffles, and none shows as locked. Tiles can't be tapped, but
 * the delete key still selects them.
 */
export default function FloatingTool({
  board,
  actions,
  hints,
  active,
  ref,
}: Props) {
  const { letters, selectedId } = board

  // The hint just says to watch, so it's learned once it's been seen for a
  // little while, and then fades away slowly
  const HINT_SEEN_MS = 3000
  const hint = currentHint("Floating", hints.learned)
  const { learn } = hints
  const showingHint = active && letters.length > 0 && hint !== null
  useEffect(() => {
    if (!showingHint) return

    const timer = setTimeout(() => learn("floating-watch"), HINT_SEEN_MS)
    return () => clearTimeout(timer)
  }, [showingHint, learn])
  const [drifts, setDrifts] = useState(() => letters.map(newDrift))

  // Letters get typed and deleted, so keep the drifts in step with them.
  // Adjusting state while rendering is React's way of reacting to a changed
  // prop without an extra render with stale drifts.
  const [syncedLetters, setSyncedLetters] = useState(letters)
  if (letters !== syncedLetters) {
    setSyncedLetters(letters)
    setDrifts((drifts) => syncTilesInLetterOrder(drifts, letters, newDrift))
  }

  const [shuffling, setShuffling] = useState(false)
  const lastFrameTimeRef = useRef<number | null>(null)
  const rafIdRef = useRef<number>(0)
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function shuffle() {
    actions.select(null)
    setShuffling(true)

    setDrifts((drifts) =>
      drifts.map((drift) => ({
        ...drift,
        coords: randomCoords(),
        ...randomDirection(),
      })),
    )

    if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current)

    shuffleTimeoutRef.current = setTimeout(() => {
      setShuffling(false)
    }, SHUFFLE_DURATION_MS)
  }

  useImperativeHandle(ref, () => ({ shuffle }))

  // Don't leave a shuffle timer running after unmounting
  useEffect(() => {
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

        setDrifts((drifts) =>
          drifts.map((drift) => updateDrift(drift, clampedDelta)),
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

  const driftById = new Map(drifts.map((drift) => [drift.id, drift]))

  return (
    <div className="floating-tool-container">
      <div className="floating-tool-box">
        {letters.length > 0 && (
          // Behind the letters, which drift over it
          <Hint
            className="floating-hint"
            text={hint && HINT_TEXT[hint]}
            fadeMs={2500}
          />
        )}
        {letters.map((letter) => {
          const drift = driftById.get(letter.id)
          if (!drift) return null

          return (
            <div
              key={letter.id}
              className={`tile floating-tool-tile ${
                letter.id === selectedId ? "active" : ""
              }`}
              style={{
                ...coordToTranslate(drift.coords),
                ...(shuffling && {
                  transition: `translate ${tileSpringCss}`,
                }),
              }}
            >
              {letter.char}
            </div>
          )
        })}
      </div>
    </div>
  )
}
