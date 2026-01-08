import { useState } from "react";
import "./LineTool.css";

type Props = {
  letters: string[];
  resetLetters: () => void;
};

type LineLetter = {
  id: string;
  letter: string;
};

const TILE_WIDTH = 42;

export default function LineTool({ letters, resetLetters }: Props) {
  const [userLetters, setUserLetters] = useState<LineLetter[]>(
    initializeLetters(letters)
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function initializeLetters(letters: string[]): LineLetter[] {
    return letters.map((letter) => {
      return { id: Math.random().toString(36).substring(3, 9), letter };
    });
  }

  function onClickLetter(index: number) {
    if (activeIndex !== null) {
      swap(activeIndex, index);
      return;
    }

    setActiveIndex(index);
  }

  function resetTiles() {
    setUserLetters(initializeLetters(letters));
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

  return (
    <>
      <div className="line-tool-container">
        {userLetters.map((letter, index) => {
          return (
            <div
              className={`
                line-tool-letter 
                ${index === activeIndex ? "active" : ""}
                ${index + 1 === activeIndex ? "left-of-active" : ""}`}
              key={letter.id}
              onClick={() => onClickLetter(index)}
            >
              {letter.letter}
            </div>
          );
        })}
      </div>
      <div className="canvas-footer">
        <div>{activeIndex}</div>
        <div className="tooltip">Tap to swap positions of letters</div>
        <div className="canvas-actions">
          <button onClick={() => resetTiles()}>Reset</button>
          <button onClick={() => resetLetters()}>New Letters</button>
        </div>
      </div>
    </>
  );
}
