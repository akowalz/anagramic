import { spring, type Transition } from "motion"

/*
 * One spring shared by every tool so tiles move with the same feel whether
 * they're animated by motion (Line, Wheel) or by CSS (Freeform, Floating).
 */
const VISUAL_DURATION_SECONDS = 0.28
const BOUNCE = 0.2

export const tileSpring: Transition = {
  type: "spring",
  visualDuration: VISUAL_DURATION_SECONDS,
  bounce: BOUNCE,
}

/* The same spring as a CSS `<duration> linear(...)` pair, for `transition` */
export const tileSpringCss = String(spring(VISUAL_DURATION_SECONDS, BOUNCE))

/* Total time the CSS spring takes to settle, including its bounce */
export const tileSpringCssMs = parseInt(tileSpringCss, 10)

/*
 * A bouncier CSS spring for a locked tile snapping back after resisting a
 * drag, so it overshoots and bounces into place
 */
export const resistSpringCss = String(spring(0.45, 0.6))
