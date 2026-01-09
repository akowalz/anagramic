import { type Transition } from "motion/react";
import * as motion from "motion/react-client";

import { useState } from "react";
import "./LineTool.css";

type Props = {
  letters: string[];
  resetLetters: () => void;
};

type LineLetter = {
  id: string;
  pos: number;
  letter: string;
};

export default function LineTool({ letters, resetLetters }: Props) {
  const [userLetters, setUserLetters] = useState<LineLetter[]>(
    initializeLetters(letters)
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function initializeLetters(letters: string[]): LineLetter[] {
    return letters.map((letter, index) => {
      return {
        id: Math.random().toString(36).substring(3, 9),
        pos: index,
        letter,
      };
    });
  }

  function onClickLetter(index: number) {
    if (activeIndex !== null) {
      swap(activeIndex, index);
      return;
    }

    setActiveIndex(index);
  }

  function swap(indexA: number, indexB: number) {
    const newUserLetters = [...userLetters];

    const letterA = userLetters[indexA];
    const letterB = userLetters[indexB];

    newUserLetters[indexB] = letterA;
    newUserLetters[indexA] = letterB;

    setUserLetters([...newUserLetters]);
    setActiveIndex(null);
  }

  function resetPositions() {
    setActiveIndex(null);
    setUserLetters([...userLetters.sort((a, b) => a.pos - b.pos)]);
  }

  function shuffleTiles() {
    setActiveIndex(null);
    setUserLetters([...userLetters.sort(() => Math.random() - 0.5)]);
  }

  const spring: Transition = {
    type: "spring",
    damping: 50,
    stiffness: 1000,
  };

  return (
    <>
      <div className="line-tool-container" onClick={() => setActiveIndex(null)}>
        {userLetters.map((letter, index) => {
          return (
            <motion.li
              className={`
                line-tool-letter 
                ${index === activeIndex ? "active" : ""}
              `}
              key={letter.id}
              onClick={(e) => {
                e.stopPropagation();
                onClickLetter(index);
              }}
              transition={spring}
              layout
            >
              {letter.letter}
            </motion.li>
          );
        })}
      </div>
      <div className="canvas-footer">
        <div className="tooltip">Tap to swap positions of letters</div>
        <div className="canvas-actions">
          <button onClick={() => resetPositions()}>Reset</button>
          <button onClick={() => shuffleTiles()}>Shuffle</button>
          <button onClick={() => resetLetters()}>New Letters</button>
        </div>
      </div>
    </>
  );
}
