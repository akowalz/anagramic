import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import { type Tile, useMoveableLetters } from "../hooks/useMoveableLetters"
import { coordToPosition, positionToStyle } from "../lib/coordinate-plane.ts"
import TileLock from "../TileLock/TileLock"
import { TAP_THRESHOLD } from "../DraggableTile/DraggableTile"
import { rubberBand } from "../lib/rubber-band"
import { moveOnRing, slotAtPoint } from "../lib/ring-reorder"

import { useEffect, useRef, useState } from "react"

import * as motion from "motion/react-client"
import { resistSpringCss, tileSpring } from "../lib/animation"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

/*
 * Near the center of the wheel the pointer's angle jumps about, so dragging
 * there doesn't reorder. A fraction of the wheel's width.
 */
const DEAD_ZONE = 0.15

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

  // A locked tile that was just tapped to swap, shaken to show it can't move
  const [refusedId, setRefusedId] = useState<string | null>(null)

  const [dragId, setDragId] = useState<string | null>(null)
  // Whether the current press turned into a drag, so it isn't also a tap
  const draggedRef = useRef(false)

  // Locked tiles can't be dragged; they give a little under the pointer and
  // spring back instead
  // The pointer pressing on a locked tile. A ref rather than state so every
  // event sees it immediately, without waiting for a re-render.
  const resistPointerRef = useRef<{
    pointerId: number
    id: string
    start: { x: number; y: number }
  } | null>(null)
  const [resisting, setResisting] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)

  function startResisting(tile: Tile, e: React.PointerEvent<HTMLElement>) {
    if (!tile.locked) return
    if (e.button !== 0 || resistPointerRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    resistPointerRef.current = {
      pointerId: e.pointerId,
      id: tile.id,
      start: { x: e.clientX, y: e.clientY },
    }
    setResisting({ id: tile.id, x: 0, y: 0 })
  }

  function resist(tile: Tile, e: React.PointerEvent<HTMLElement>) {
    const pointer = resistPointerRef.current
    if (pointer?.pointerId !== e.pointerId || pointer.id !== tile.id) return

    // The mouse button is up but the pointerup got lost: stop resisting
    if (e.pointerType === "mouse" && e.buttons === 0) {
      stopResisting(e)
      return
    }

    const delta = {
      x: e.clientX - pointer.start.x,
      y: e.clientY - pointer.start.y,
    }
    if (Math.hypot(delta.x, delta.y) >= TAP_THRESHOLD) draggedRef.current = true
    setResisting({ id: tile.id, ...rubberBand(delta) })
  }

  function stopResisting(e: React.PointerEvent<HTMLElement>) {
    if (resistPointerRef.current?.pointerId !== e.pointerId) return
    resistPointerRef.current = null

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setResisting(null)
  }

  /* Move the dragged tile to whichever slot the pointer is over */
  function reorderTowards(id: string, pointer: { x: number; y: number }) {
    const wheel = wheelRef.current
    if (!wheel) return

    const rect = wheel.getBoundingClientRect()
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }

    setTiles((tiles) => {
      const from = tiles.findIndex((tile) => tile.id === id)
      if (from === -1) return tiles

      const to = slotAtPoint(
        pointer,
        center,
        tiles.length,
        from,
        rect.width * DEAD_ZONE,
      )
      return moveOnRing(tiles, from, to, (tile) => tile.locked)
    })
  }

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
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
        <div
          className="wheel-boundary"
          ref={wheelRef}
          style={{ "--resist-spring": resistSpringCss } as React.CSSProperties}
        >
          {tiles.map((tile, index) => {
            const offset =
              resisting?.id === tile.id ? resisting : { x: 0, y: 0 }

            return (
              <motion.li
                className={`tile wheel-tool-tile ${
                  index === activeIndex ? "active" : ""
                } ${tile.locked ? "locked" : ""} ${
                  tile.id === refusedId ? "refused" : ""
                } ${tile.id === dragId ? "dragging" : ""} ${
                  resisting?.id === tile.id ? "resisting" : ""
                }`}
                key={tile.id}
                onAnimationEnd={(e) => {
                  // Ignore animations bubbling up from the lock button
                  if (e.target === e.currentTarget) setRefusedId(null)
                }}
                style={{
                  ...tileStyles[index],
                  translate: `calc(-50% + ${offset.x}px) calc(-50% + ${offset.y}px)`,
                }}
                // Taps are handled by onTap; this just keeps the click from
                // reaching the container, which would deselect
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => startResisting(tile, e)}
                onPointerMove={(e) => resist(tile, e)}
                onPointerUp={stopResisting}
                onPointerCancel={stopResisting}
                onLostPointerCapture={stopResisting}
                onTapStart={() => {
                  draggedRef.current = false
                }}
                onTap={() => {
                  if (draggedRef.current) return
                  onClickTile(index)
                }}
                drag={!tile.locked}
                dragSnapToOrigin
                whileDrag={{ scale: 1.11 }}
                onDragStart={() => {
                  draggedRef.current = true
                  setActiveIndex(null)
                  setDragId(tile.id)
                }}
                onDrag={(e) => {
                  if (!("clientX" in e)) return
                  reorderTowards(tile.id, { x: e.clientX, y: e.clientY })
                }}
                onDragEnd={() => setDragId(null)}
                transition={tileSpring}
                layout
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
