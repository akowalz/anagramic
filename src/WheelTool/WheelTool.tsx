import "./WheelTool.css"
import type { ToolActions } from "../Types/ToolActions"
import TileLock from "../TileLock/TileLock"
import { tilesInOrder, type Board } from "../lib/board"
import type { BoardActions } from "../hooks/useBoard"
import { findDropTarget } from "../lib/drop-target"
import type { Pos } from "../lib/resolve-overlaps"
import { TAP_THRESHOLD, TILE_FOOTPRINT } from "../DraggableTile/DraggableTile"
import { tileSpringCss } from "../lib/animation"

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react"

type Props = {
  board: Board
  actions: BoardActions
  ref: Ref<ToolActions>
}

/* How close (px) a dragged tile's center must come to another's to swap */
const DROP_RADIUS = TILE_FOOTPRINT * 0.8

/* How far it can then stray before that tile stops being the target */
const KEEP_RADIUS = DROP_RADIUS * 1.5

/* A tile being dragged, while the pointer is down */
type Gesture = {
  id: number
  pointerId: number
  start: Pos
  // Where every tile's center was when the drag started
  centers: Map<number, Pos>
  // Whether it's moved far enough to be a drag rather than a tap
  moved: boolean
  // The tile it would swap with if dropped now
  targetId: number | null
}

/*
 * What the drag looks like, for rendering. Only changes when the drop target
 * does: the dragged tile itself follows the pointer outside React (see
 * moveDrag), so a drag doesn't re-render the wheel on every move.
 */
type Drag = {
  id: number
  // The tile it would swap with if dropped now
  targetId: number | null
  // How far that tile moves to preview the swap: to the dragged tile's spot
  targetOffset: Pos
}

/*
 * The letters around a circle, in the board's arrangement. Drag a tile onto
 * another to swap them, or tap one and then the other.
 *
 * Tiles are placed with CSS translate, from the middle of the wheel, so every
 * move (a swap, a shuffle, a drag springing back) is a transition the GPU can
 * run on its own.
 */
export default function WheelTool({ board, actions, ref }: Props) {
  const tiles = tilesInOrder(board)
  const slotOf = new Map(tiles.map((tile, index) => [tile.id, index]))
  const selectedIndex = tiles.findIndex((tile) => tile.id === board.selectedId)

  useImperativeHandle(
    ref,
    () => ({ reset: actions.reset, shuffle: actions.shuffle }),
    [actions],
  )

  // A locked tile that was just tapped to swap, shaken to show it can't move
  const [refusedId, setRefusedId] = useState<number | null>(null)

  const gestureRef = useRef<Gesture | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  // The tile just let go of, easing into its place. A new object for every
  // release, so letting go of the same tile again still counts.
  const [released, setReleased] = useState<{ id: number } | null>(null)
  const settlingId = released?.id ?? null
  const wheelRef = useRef<HTMLDivElement>(null)

  // Only now, with its new place rendered, drop the tile's drag offset. Taking
  // it off any sooner let the browser see the tile back home for a moment
  // (motion measures the page whenever the board changes), and it eased in
  // from there instead of from the finger.
  useLayoutEffect(() => {
    if (!released) return
    const tile = wheelRef.current?.querySelector<HTMLElement>(
      `[data-id="${released.id}"]`,
    )
    tile?.style.removeProperty("--drag-x")
    tile?.style.removeProperty("--drag-y")
  }, [released])
  // The click that ends a drag isn't a tap
  const draggedRef = useRef(false)

  function onClickTile(index: number) {
    const tile = tiles[index]

    if (selectedIndex === index) {
      actions.select(null)
      return
    }

    if (selectedIndex !== -1) {
      const selectedTile = tiles[selectedIndex]

      // Locked tiles can't be swapped: shake the locked one and select the
      // tapped tile instead (e.g. to show its unlock button)
      const lockedTile = [tile, selectedTile].find((t) => t.locked)
      if (lockedTile) {
        setRefusedId(lockedTile.id)
        actions.select(tile.id)
        return
      }

      actions.swap(selectedTile.id, tile.id)
      return
    }

    actions.select(tile.id)
  }

  function startDrag(
    tileId: number,
    locked: boolean,
    e: React.PointerEvent<HTMLElement>,
  ) {
    // Locked tiles stay put; a tap on one still works
    if (locked || e.button !== 0 || gestureRef.current) return

    const wheel = e.currentTarget.parentElement
    const centers = new Map<number, Pos>()
    wheel?.querySelectorAll<HTMLElement>(".wheel-tool-tile").forEach((el) => {
      const rect = el.getBoundingClientRect()
      centers.set(Number(el.dataset.id), {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    })

    e.currentTarget.setPointerCapture(e.pointerId)
    gestureRef.current = {
      id: tileId,
      pointerId: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      centers,
      moved: false,
      targetId: null,
    }
  }

  function moveDrag(e: React.PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current
    if (gesture?.pointerId !== e.pointerId) return

    const offset = {
      x: e.clientX - gesture.start.x,
      y: e.clientY - gesture.start.y,
    }
    if (!gesture.moved) {
      if (Math.hypot(offset.x, offset.y) < TAP_THRESHOLD) return
      gesture.moved = true
      actions.select(null)
    }

    const home = gesture.centers.get(gesture.id)
    if (!home) return
    const lockedIds = new Set(tiles.filter((t) => t.locked).map((t) => t.id))
    const candidates = [...gesture.centers]
      .filter(([id]) => id !== gesture.id && !lockedIds.has(id))
      .map(([id, center]) => ({ id, center }))

    const targetId = findDropTarget(
      { x: home.x + offset.x, y: home.y + offset.y },
      candidates,
      DROP_RADIUS,
      gesture.targetId === null
        ? undefined
        : { id: gesture.targetId, keepRadius: KEEP_RADIUS },
    )

    // Follow the pointer by setting the tile's offset directly: no re-render,
    // and translate changes are cheap for the GPU
    const tile = e.currentTarget
    tile.style.setProperty("--drag-x", `${offset.x}px`)
    tile.style.setProperty("--drag-y", `${offset.y}px`)

    // Re-render only to lift the tile at the start, and when the target changes
    if (drag && targetId === gesture.targetId) return
    gesture.targetId = targetId

    const target = targetId === null ? null : gesture.centers.get(targetId)
    setDrag({
      id: gesture.id,
      targetId,
      targetOffset: target
        ? { x: home.x - target.x, y: home.y - target.y }
        : { x: 0, y: 0 },
    })
  }

  /*
   * Swap with the tile it's showing the swap with. That's so even when the
   * pointer is cancelled rather than released (iOS can do that as a finger
   * lifts): what was on screen as it ended is what happens.
   */
  function endDrag(e: React.PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current
    if (gesture?.pointerId !== e.pointerId) return
    gestureRef.current = null

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (!gesture.moved) return

    // Back to its place in the wheel (its new one, if swapped), easing there
    // from where it was let go (see the layout effect above)
    setReleased({ id: gesture.id })

    draggedRef.current = true
    if (gesture.targetId !== null) {
      actions.swap(gesture.id, gesture.targetId)
    }
    setDrag(null)
  }

  return (
    <div className="wheel-tool-container" onClick={() => actions.select(null)}>
      <div
        ref={wheelRef}
        className="wheel-boundary"
        style={{ "--tile-spring": tileSpringCss } as React.CSSProperties}
      >
        {/*
         * Rendered in the order typed, not the arrangement, so tiles keep
         * their place in the page. Moving an element in the page loses its
         * animation, and a dropped tile would jump instead of easing from
         * the finger. data-slot is its place on the wheel.
         */}
        {board.letters.map((letter) => {
          const index = slotOf.get(letter.id)
          if (index === undefined) return null
          const tile = tiles[index]
          const selected = index === selectedIndex
          const dragging = drag?.id === tile.id
          // While hovering over a tile, it slides to the dragged tile's spot,
          // to show what the swap would do. It only happens on release.
          const preview = drag?.targetId === tile.id
          const offset = preview ? drag.targetOffset : { x: 0, y: 0 }

          // Clockwise from the top
          const angle = (Math.PI * 2 * index) / tiles.length

          return (
            <li
              key={tile.id}
              data-id={tile.id}
              data-slot={index}
              className={`tile wheel-tool-tile ${selected ? "active" : ""} ${
                tile.locked ? "locked" : ""
              } ${tile.id === refusedId ? "refused" : ""} ${
                dragging ? "dragging" : ""
              } ${preview ? "drop-target" : ""} ${
                tile.id === settlingId ? "settling" : ""
              }`}
              onTransitionEnd={(e) => {
                if (
                  e.target === e.currentTarget &&
                  e.propertyName === "translate" &&
                  tile.id === settlingId
                ) {
                  setReleased(null)
                }
              }}
              style={
                {
                  "--x": Math.sin(angle),
                  "--y": -Math.cos(angle),
                  "--dx": `${offset.x}px`,
                  "--dy": `${offset.y}px`,
                } as React.CSSProperties
              }
              onAnimationEnd={(e) => {
                // Ignore animations bubbling up from the lock button
                if (e.target === e.currentTarget) setRefusedId(null)
              }}
              onPointerDown={(e) => startDrag(tile.id, tile.locked, e)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
              onClick={(e) => {
                e.stopPropagation()
                if (draggedRef.current) {
                  draggedRef.current = false
                  return
                }
                onClickTile(index)
              }}
            >
              {tile.char}
              <TileLock
                selected={selected}
                locked={tile.locked}
                onToggle={() => actions.toggleLock(tile.id)}
              />
            </li>
          )
        })}
      </div>
    </div>
  )
}
