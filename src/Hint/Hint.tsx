import "./Hint.css"
import { useEffect, useState } from "react"

/* How long a hint takes to fade out, or in */
export const HINT_FADE_MS = 400

type Props = {
  // What to show, or nothing
  text: string | null
  // Move up out of the way, e.g. of the lock button over a selected tile
  lifted?: boolean
  className?: string
  style?: React.CSSProperties
}

/*
 * A hint above the letters. When the text changes, the old hint fades out
 * before the new one fades in, so one never just replaces the other.
 */
export default function Hint({
  text,
  lifted = false,
  className,
  style,
}: Props) {
  const [shown, setShown] = useState(text)

  useEffect(() => {
    if (text === shown) return

    const timer = setTimeout(() => setShown(text), HINT_FADE_MS)
    return () => clearTimeout(timer)
  }, [text, shown])

  const out = text !== shown || shown === null

  return (
    <div
      className={`hint ${out ? "out" : ""} ${lifted ? "lifted" : ""} ${
        className ?? ""
      }`}
      aria-hidden={out}
      style={
        {
          ...style,
          "--hint-fade": `${HINT_FADE_MS}ms`,
        } as React.CSSProperties
      }
    >
      {shown}
    </div>
  )
}
