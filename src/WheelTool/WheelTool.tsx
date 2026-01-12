import "./WheelTool.css";

type Props = {
  letters: string[];
  resetLetters: () => void;
};

type Coord = {
  x: number;
  y: number;
};

type Position = {
  top: number;
  left: number;
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

export default function WheelTool({ letters, _ }: Props) {
  const TWO_PI = Math.PI * 2;
  const theta = TWO_PI / letters.length;

  const tileStyles = letters.map((_, index) => {
    const scale = 0.5;
    const y = Math.cos(theta * index) * (scale + 0.05);
    const x = Math.sin(theta * index) * scale;
    return positionToStyle(coordToPosition({ x, y }));
  });

  return (
    <div className="wheel-tool-container">
      {letters.map((letter, index) => {
        return (
          <div className="wheel-tool-tile" style={tileStyles[index]}>
            {letter}
          </div>
        );
      })}
    </div>
  );
}
