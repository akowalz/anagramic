import "./LineTool.css"
import type { ToolActions } from "../Types/ToolActions"
import TileLock from "../TileLock/TileLock"
import { TAP_THRESHOLD } from "../DraggableTile/DraggableTile"
import { rubberBand } from "../lib/rubber-band"
import { tilesInOrder, type Board, type BoardTile } from "../lib/board"
import type { BoardActions } from "../hooks/useBoard"

import { useImperativeHandle, useRef, useState, type Ref } from "react"
import { Reorder } from "motion/react"
import { resistSpringCss, tileSpring } from "../lib/animation"

type Props = {
  board: Board
  actions: BoardActions
  ref: Ref<ToolActions>
}

/* The letters in a row, in the board's arrangement. Drag to reorder them. */
export default function LineTool({ board, actions, ref }: Props) {
  const tiles = tilesInOrder(board)

  useImperativeHandle(
    ref,
    () => ({ reset: actions.reset, shuffle: actions.shuffle }),
    [actions],
  )

  const [dragId, setDragId] = useState<number | null>(null)
  // Whether the current press turned into a drag, so it isn't also a tap
  const draggedRef = useRef(false)

  // Locked tiles can't be dragged; they give a little under the pointer and
  // spring back instead
  // The pointer pressing on a locked tile. A ref rather than state so every
  // event sees it immediately, without waiting for a re-render.
  const resistPointerRef = useRef<{
    pointerId: number
    id: number
    startX: number
  } | null>(null)
  const [resisting, setResisting] = useState<{ id: number; x: number } | null>(
    null,
  )

  function startResisting(tile: BoardTile, e: React.PointerEvent<HTMLElement>) {
    if (!tile.locked) return
    if (e.button !== 0 || resistPointerRef.current) return

    e.currentTarget.setPointerCapture(e.pointerId)
    resistPointerRef.current = {
      pointerId: e.pointerId,
      id: tile.id,
      startX: e.clientX,
    }
    setResisting({ id: tile.id, x: 0 })
  }

  function resist(tile: BoardTile, e: React.PointerEvent<HTMLElement>) {
    const pointer = resistPointerRef.current
    if (pointer?.pointerId !== e.pointerId || pointer.id !== tile.id) return

    // The mouse button is up but the pointerup got lost: stop resisting
    if (e.pointerType === "mouse" && e.buttons === 0) {
      stopResisting(e)
      return
    }

    const deltaX = e.clientX - pointer.startX
    if (Math.abs(deltaX) >= TAP_THRESHOLD) draggedRef.current = true
    setResisting({ id: tile.id, x: rubberBand({ x: deltaX, y: 0 }).x })
  }

  function stopResisting(e: React.PointerEvent<HTMLElement>) {
    if (resistPointerRef.current?.pointerId !== e.pointerId) return
    resistPointerRef.current = null

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setResisting(null)
  }

  return (
    <div
      className="line-tool-container"
      onPointerDown={(e) => {
        // Tapping empty space deselects
        if (e.target === e.currentTarget) actions.select(null)
      }}
      style={
        {
          "--tile-count": tiles.length,
          "--resist-spring": resistSpringCss,
        } as React.CSSProperties
      }
    >
      {/* No shelf until there are letters: empty, it looked like a text box */}
      {tiles.length > 0 && (
        <div className="line-rack">
          <Reorder.Group
            axis="x"
            as="div"
            values={board.order}
            onReorder={actions.reorder}
            className="line-rack-tiles"
          >
            {tiles.map((tile) => {
              const selected = tile.id === board.selectedId

              return (
                <Reorder.Item
                  as="div"
                  value={tile.id}
                  className={`
                tile
                line-tool-tile
                ${tile.id === dragId ? "dragging" : ""}
                ${selected ? "active" : ""}
                ${tile.locked ? "locked" : ""}
                ${resisting?.id === tile.id ? "resisting" : ""}
              `}
                  key={tile.id}
                  drag={tile.locked ? false : "x"}
                  // Lift the tile while dragging. Through motion, so its layout
                  // measurements allow for it (a CSS scale threw them off), and
                  // with a target either way (whileDrag could get stuck part way)
                  animate={{ scale: tile.id === dragId ? 1.12 : 1 }}
                  style={{
                    translate: `${resisting?.id === tile.id ? resisting.x : 0}px 0`,
                  }}
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
                    actions.select(selected ? null : tile.id)
                  }}
                  onDragStart={() => {
                    draggedRef.current = true
                    actions.select(null)
                    setDragId(tile.id)
                  }}
                  onDragEnd={() => setDragId(null)}
                  transition={tileSpring}
                  layout
                >
                  {tile.char}
                  <TileLock
                    selected={selected}
                    locked={tile.locked}
                    onToggle={() => actions.toggleLock(tile.id)}
                  />
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        </div>
      )}
    </div>
  )
}
