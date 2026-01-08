import { useState } from "react";
import "./LineTool.css";

type Props = {
  letters: string[];
};

export default function LineTool({ letters }: Props) {
  const [userLetters, setUserLetters] = useState<string[]>(letters);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function onClickLetter(index: number) {
    if (activeIndex !== null) {
      swap(activeIndex, index);
      return;
    }

    setActiveIndex(index);
  }

  function resetTiles() {
    setUserLetters(letters);
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

  function resetLetters() {
    return;
  }

  return (
    <>
      <div className="line-tool-container">
        {userLetters.map((letter, index) => {
          return (
            <div
              className={`line-tool-letter ${
                index === activeIndex ? "active" : ""
              } ${index + 1 === activeIndex ? "left-of-active" : ""}`}
              key={index}
              onClick={() => onClickLetter(index)}
            >
              {letter}
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
