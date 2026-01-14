import "./WheelTool.css";
import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import type { Transition } from "motion";
import type { ToolActions } from "../Types/ToolActions";

type Props = {
  letters: string[];
  registerActions: (actions: ToolActions) => void;
};

type Coord = {
  x: number;
  y: number;
};

type Position = {
  top: number;
  left: number;
};

type LineLetter = {
  id: string;
  pos: number;
  letter: string;
};

function coordToPosition(coord: Coord) {
  const { x, y } = coord;

  if (x < -1.0 || x > 1.0) throw "x out of range";
  if (y < -1.0 || y > 1.0) throw "x out of range";

  return {
    left: x * 0.5 + 0.5,
    top: y * -0.5 + 0.5,
  };
}

function positionToStyle(position: Position) {
  return {
    top: `${position.top * 100}%`,
    left: `${position.left * 100}%`,
  };
}

export default function WheelTool({ letters, registerActions }: Props) {
  function initializeLetters(letters: string[]): LineLetter[] {
    return letters.map((letter, index) => {
      return {
        id: Math.random().toString(36).substring(3, 9),
        pos: index,
        letter,
      };
    });
  }

  const [userLetters, setUserLetters] = useState<LineLetter[]>(
    initializeLetters(letters)
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function resetPositions() {
    setActiveIndex(null);
    setUserLetters([...userLetters.sort((a, b) => a.pos - b.pos)]);
  }

  function shuffleTiles() {
    setActiveIndex(null);
    setUserLetters([...userLetters.sort(() => Math.random() - 0.5)]);
  }

  useEffect(() => {
    registerActions({
      reset: () => resetPositions(),
      shuffle: () => shuffleTiles(),
    });
  }, []);

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

  const spring: Transition = {
    type: "spring",
    damping: 50,
    stiffness: 1000,
  };

  const tileStyles = letters.map((_, index) => {
    const TWO_PI = Math.PI * 2;
    const theta = TWO_PI / letters.length;

    const y = Math.cos(theta * index);
    const x = Math.sin(theta * index);

    return positionToStyle(coordToPosition({ x, y }));
  });

  return (
    <>
      <div
        className="wheel-tool-container"
        onClick={() => setActiveIndex(null)}
      >
        <div className="wheel-boundary">
          {userLetters.map((letter, index) => {
            return (
              <motion.li
                className={`wheel-tool-tile ${
                  index === activeIndex ? "active" : ""
                }`}
                key={letter.id}
                style={tileStyles[index]}
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
      </div>
    </>
  );
}
