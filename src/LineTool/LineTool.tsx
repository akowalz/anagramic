import { Reorder, type Transition } from "motion/react"

import { useEffect, useState } from "react"
import "./LineTool.css"
import type { ToolActions } from "../Types/ToolActions"

type Props = {
  letters: string[]
  registerActions: (actions: ToolActions) => void
}

type LineLetter = {
  id: string
  pos: number
  letter: string
}

export default function LineTool({ letters, registerActions }: Props) {
  const [userLetters, setUserLetters] = useState<LineLetter[]>(
    initializeLetters(letters),
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  function resetPositions() {
    setActiveIndex(null)
    setUserLetters([...userLetters.sort((a, b) => a.pos - b.pos)])
  }

  function shuffleTiles() {
    setActiveIndex(null)
    setUserLetters([...userLetters.sort(() => Math.random() - 0.5)])
  }

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    })
  }, [])

  function initializeLetters(letters: string[]): LineLetter[] {
    return letters.map((letter, index) => {
      return {
        id: Math.random().toString(36).substring(3, 9),
        pos: index,
        letter,
      }
    })
  }

  function onClickLetter(index: number) {
    if (activeIndex !== null) {
      swap(activeIndex, index)
      return
    }

    setActiveIndex(index)
  }

  function swap(indexA: number, indexB: number) {
    const newUserLetters = [...userLetters]

    const letterA = userLetters[indexA]
    const letterB = userLetters[indexB]

    newUserLetters[indexB] = letterA
    newUserLetters[indexA] = letterB

    setUserLetters([...newUserLetters])
    setActiveIndex(null)
  }

  const spring: Transition = {
    type: "spring",
    damping: 50,
    stiffness: 1000,
  }

  function onReorder(args: LineLetter[]) {
    setActiveIndex(null)
    setUserLetters(args)
  }

  return (
    <>
      <Reorder.Group
        axis="x"
        as="div"
        onClick={() => setActiveIndex(null)}
        values={userLetters}
        onReorder={onReorder}
        className="line-tool-container"
        style={{ "--tile-count": userLetters.length } as React.CSSProperties}
      >
        {userLetters.map((letter, index) => {
          return (
            <Reorder.Item
              as="div"
              value={letter}
              className={`
                  tile
                  line-tool-tile
                  ${index === activeIndex ? "active" : ""}
                `}
              key={letter.id}
              onClick={(e) => {
                e.stopPropagation()
                onClickLetter(index)
              }}
              transition={spring}
              layout
            >
              {letter.letter}
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </>
  )
}
