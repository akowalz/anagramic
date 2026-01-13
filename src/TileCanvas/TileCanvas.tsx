import { useEffect, useState } from "react";
import Tile from "../Tile/Tile";
import "./TileCanvas.css";
import { type ToolActions } from "../Types/ToolActions";

type TileCanvasProps = {
  letters: string[];
  registerActions: (actions: ToolActions) => void;
};

type Pos = { x: number; y: number };

type TileData = {
  pos: Pos;
  letter: string;
  zIndex: number;
  id: number;
};

export default function TileCanvas({
  letters,
  registerActions,
}: TileCanvasProps) {
  const [tileData, setTileData] = useState<TileData[]>([]);

  function resetTiles() {
    setTileData(initialTileData(letters));
  }

  const initialTileData = (letters: string[]) => {
    return letters.map((letter, index) => ({
      id: index,
      pos: { x: 0, y: 0 },
      zIndex: 0,
      letter,
    }));
  };

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

    registerActions({
      reset: () => resetTiles(),
    });
  }, [letters]);

  const tiles = letters.map((letter, index) => {
    if (tileData.length === 0) return;

    const dataForTile = tileData[index];

    return (
      <Tile
        letter={letter.toUpperCase()}
        id={index}
        key={dataForTile.id}
        pos={{ ...dataForTile.pos }}
        zIndex={dataForTile.zIndex}
        onMove={handleMoveTile}
      />
    );
  });

  return <div className="tile-canvas">{tiles}</div>;
}
