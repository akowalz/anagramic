import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { useMoveableLetters } from "../hooks/useMoveableLetters"
import TileLock from "../TileLock/TileLock"
import { TAP_THRESHOLD } from "../DraggableTile/DraggableTile"
import { rubberBand } from "../lib/rubber-band"
import {
  angleOfPoint,
  angleOfSlot,
  moveOnRing,
  pointOnRing,
  slotAtAngle,
} from "../lib/ring-reorder"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

import * as motion from "motion/react-client"
import { resistSpringCss, tileSpring } from "../lib/animation"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

type Point = { x: number; y: number }

/*
 * Near the center of the wheel the pointer's angle jumps about, so a dragged
 * tile stays put while the pointer is there. A fraction of the wheel's width.
 */
const DEAD_ZONE = 0.15

const instant = { duration: 0 }

export default function WheelTool({ letters, registerActions }: Props) {
  const {
    tiles,
    setTiles,
    activeIndex,
    setActiveIndex,
    shuffleTiles,
    resetPositions,
    swapTiles,
    toggleLock,
  } = useMoveableLetters(letters)

  const wheelRef = useRef<HTMLDivElement>(null)

  // Radius (px) of the ring the tiles sit on, i.e. half the wheel's width
  const [radius, setRadius] = useState(0)
  // While set, tiles jump to their places rather than animating, e.g. when the
  // wheel is resized or shown
  const [snapping, setSnapping] = useState(false)

  // A locked tile that was just tapped to swap, shaken to show it can't move
  const [refusedId, setRefusedId] = useState<string | null>(null)

  // The pointer pressing on a tile. A ref rather than state so every event sees
  // it immediately, without waiting for a re-render.
  const pressRef = useRef<{
    pointerId: number
    id: string
    start: Point
    // Whether the press turned into a drag, so it isn't also a tap
    moved: boolean
    // The tile's angle minus the pointer's, so the tile doesn't jump to sit
    // right under the pointer when the drag starts
    angleOffset: number
  } | null>(null)

  // The tile being dragged, held at `angle` on the ring under the pointer
  const [drag, setDrag] = useState<{ id: string; angle: number } | null>(null)

  // Locked tiles can't be dragged; they give a little under the pointer and
  // spring back instead
  const [resisting, setResisting] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)

  function wheelCenter(wheel: HTMLElement): Point {
    const rect = wheel.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  function startPress(index: number, e: React.PointerEvent<HTMLElement>) {
    const wheel = wheelRef.current
    if (!wheel) return
    // Only the main button drags, and only one pointer at a time
    if (e.button !== 0 || pressRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    const pointer = { x: e.clientX, y: e.clientY }

    pressRef.current = {
      pointerId: e.pointerId,
      id: tiles[index].id,
      start: pointer,
      moved: false,
      angleOffset:
        angleOfSlot(index, tiles.length) -
        angleOfPoint(pointer, wheelCenter(wheel)),
    }
  }

  function movePress(e: React.PointerEvent<HTMLElement>) {
    const press = pressRef.current
    const wheel = wheelRef.current
    if (press?.pointerId !== e.pointerId || !wheel) return

    // The mouse button is up but the pointerup got lost: end the press here
    // instead of leaving the tile stuck to the cursor
    if (e.pointerType === "mouse" && e.buttons === 0) {
      endPress(e, { canTap: false })
      return
    }

    const pointer = { x: e.clientX, y: e.clientY }
    const delta = { x: pointer.x - press.start.x, y: pointer.y - press.start.y }
    if (!press.moved && Math.hypot(delta.x, delta.y) >= TAP_THRESHOLD) {
      press.moved = true
    }

    const tile = tiles.find((tile) => tile.id === press.id)
    if (tile?.locked) {
      setResisting({ id: press.id, ...rubberBand(delta) })
      return
    }

    if (!press.moved) return
    setActiveIndex(null)

    const center = wheelCenter(wheel)
    const fromCenter = Math.hypot(pointer.x - center.x, pointer.y - center.y)
    if (fromCenter < wheel.offsetWidth * DEAD_ZONE) return

    // The tile follows the pointer's angle but stays on the ring
    const angle = angleOfPoint(pointer, center) + press.angleOffset
    setDrag({ id: press.id, angle })

    // Move it to whichever slot it's over, making room for it there
    setTiles((tiles) => {
      const from = tiles.findIndex((tile) => tile.id === press.id)
      if (from === -1) return tiles

      const to = slotAtAngle(angle, tiles.length, from)
      return moveOnRing(tiles, from, to, (tile) => tile.locked)
    })
  }

  /*
   * Finish the press on pointerup, or whenever the pointer is lost (cancel,
   * lost capture, released unnoticed). Only a real pointerup can be a tap.
   */
  function endPress(
    e: React.PointerEvent<HTMLElement>,
    { canTap }: { canTap: boolean },
  ) {
    const press = pressRef.current
    if (press?.pointerId !== e.pointerId) return
    pressRef.current = null

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setResisting(null)
    setDrag(null)

    if (press.moved || !canTap) return
    const index = tiles.findIndex((tile) => tile.id === press.id)
    if (index !== -1) onClickTile(index)
  }

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  // A layout effect so the tiles are placed on the ring before the first paint
  useLayoutEffect(() => {
    const wheel = wheelRef.current
    if (!wheel) return

    let frame = 0
    const observer = new ResizeObserver(() => {
      flushSync(() => {
        setSnapping(true)
        setRadius(wheel.offsetWidth / 2)
      })
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setSnapping(false))
    })
    observer.observe(wheel)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  function onClickTile(index: number) {
    if (activeIndex === index) {
      setActiveIndex(null)
      return
    }

    if (activeIndex !== null) {
      // Locked tiles can't be swapped: shake the locked one and select the
      // tapped tile instead (e.g. to show its unlock button)
      const lockedIndex = [index, activeIndex].find((i) => tiles[i].locked)
      if (lockedIndex !== undefined) {
        setRefusedId(tiles[lockedIndex].id)
        setActiveIndex(index)
        return
      }

      swapTiles(activeIndex, index)
      return
    }

    setActiveIndex(index)
  }

  return (
    <>
      <div
        className="wheel-tool-container"
        onClick={() => setActiveIndex(null)}
      >
        <div
          className="wheel-boundary"
          ref={wheelRef}
          style={{ "--resist-spring": resistSpringCss } as React.CSSProperties}
        >
          {tiles.map((tile, index) => {
            const dragging = drag?.id === tile.id
            const angle = dragging
              ? drag.angle
              : angleOfSlot(index, tiles.length)
            const pos = pointOnRing(angle, radius)
            const offset =
              resisting?.id === tile.id ? resisting : { x: 0, y: 0 }

            return (
              <motion.li
                className={`tile wheel-tool-tile ${
                  index === activeIndex ? "active" : ""
                } ${tile.locked ? "locked" : ""} ${
                  tile.id === refusedId ? "refused" : ""
                } ${dragging ? "dragging" : ""} ${
                  resisting?.id === tile.id ? "resisting" : ""
                }`}
                key={tile.id}
                onAnimationEnd={(e) => {
                  // Ignore animations bubbling up from the lock button
                  if (e.target === e.currentTarget) setRefusedId(null)
                }}
                style={{
                  translate: `calc(-50% + ${offset.x}px) calc(-50% + ${offset.y}px)`,
                }}
                initial={false}
                animate={{ x: pos.x, y: pos.y, scale: dragging ? 1.11 : 1 }}
                // The dragged tile sticks to the pointer; the rest spring
                transition={
                  snapping
                    ? instant
                    : dragging
                      ? { ...tileSpring, x: instant, y: instant }
                      : tileSpring
                }
                // Taps are handled on pointerup; this just keeps the click
                // from reaching the container, which would deselect
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => startPress(index, e)}
                onPointerMove={movePress}
                onPointerUp={(e) => endPress(e, { canTap: true })}
                onPointerCancel={(e) => endPress(e, { canTap: false })}
                onLostPointerCapture={(e) => endPress(e, { canTap: false })}
              >
                {tile.letter}
                <TileLock
                  selected={index === activeIndex}
                  locked={tile.locked}
                  onToggle={() => toggleLock(tile.id)}
                />
              </motion.li>
            )
          })}
        </div>
      </div>
    </>
  )
}
