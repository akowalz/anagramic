import "./TileLock.css"
import { useEffect, useRef } from "react"
import LockIcon from "../Icons/LockIcon"
import UnlockIcon from "../Icons/UnlockIcon"

type Props = {
  selected: boolean
  locked: boolean
  onToggle: () => void
}

/*
 * Rendered inside a tile: a button above the tile to lock or unlock it while
 * the tile is selected, otherwise a small badge if the tile is locked.
 */
export default function TileLock({ selected, locked, onToggle }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Tiles handle drags and taps with native pointer listeners (motion) or
  // React's root-delegated ones, so stop pointer events natively before they
  // reach the tile. React's stopPropagation would be too late for motion.
  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const stop = (e: PointerEvent) => e.stopPropagation()
    button.addEventListener("pointerdown", stop)
    button.addEventListener("pointerup", stop)
    return () => {
      button.removeEventListener("pointerdown", stop)
      button.removeEventListener("pointerup", stop)
    }
  }, [selected])

  if (selected) {
    return (
      <button
        ref={buttonRef}
        className="tile-lock-button"
        aria-label={locked ? "Unlock tile" : "Lock tile"}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        {locked ? <UnlockIcon /> : <LockIcon />}
      </button>
    )
  }

  if (locked) {
    return (
      <span className="tile-lock-badge" aria-label="Locked">
        <LockIcon />
      </span>
    )
  }

  return null
}
