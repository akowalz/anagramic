import "./Tile.css";
import { useState } from "react";

type Pos = { x: number; y: number };

type Props = {
  letter: string;
  id: number;
  pos: Pos;
  onMove: (id: number, x: number, y: number) => void;
};

export default function Tile({ letter, pos, id, onMove }: Props) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    setDragging(true);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    onMove(id, e.clientX - offset.x, e.clientY - offset.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    console.log(`Now at (${pos.x}, ${pos.y})`);
  };

  return (
    <div
      className="letter-tile"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }}
    >
      {letter}
    </div>
  );
}
