import { useEffect, useState } from "react";
import Tile from "../Tile/Tile";
import "./TileCanvas.css";

type TileCanvasProps = {
  letters: string[];
  resetLetters: () => void;
};

type Pos = { x: number; y: number };

type TileData = {
  pos: Pos;
  letter: string;
  zIndex: number;
  id: number;
};

export default function TileCanvas({ letters, resetLetters }: TileCanvasProps) {
  const [tileData, setTileData] = useState<TileData[]>([]);

  function resetTiles() {
    setTileData(initialTileData(letters));
  }

  function initialTileData(letters: string[]) {
    return letters.map((letter, index) => ({
      id: index,
      pos: { x: 0, y: 0 },
      zIndex: 0,
      letter,
    }));
  }

  const handleMoveTile = (id: number, newPos: Pos) => {
    const currentMaxZIndex = Math.max(...tileData.map((t) => t.zIndex));

    setTileData((tiles) =>
      tiles.map((tile) =>
        tile.id === id
          ? { ...tile, pos: newPos, zIndex: currentMaxZIndex + 1 }
          : tile
      )
    );
  };

  useEffect(() => {
    setTileData(initialTileData(letters));
  }, [letters]);

  const tiles = letters.map((letter, index) => {
    if (tileData.length === 0) return;

    const dataForTile = tileData[index];

    return (
      <Tile
        letter={letter.toUpperCase()}
        id={index}
        pos={{ ...dataForTile.pos }}
        zIndex={dataForTile.zIndex}
        onMove={handleMoveTile}
      />
    );
  });

  return (
    <>
      <div className="tile-canvas">{tiles}</div>
      <div className="canvas-footer">
        <div className="tooltip">Drag and drop to rearrange letters</div>
        <div className="canvas-actions">
          <button onClick={() => resetTiles()}>Reset</button>
          <button onClick={() => resetLetters()}>New Letters</button>
        </div>
      </div>
    </>
  );
}
