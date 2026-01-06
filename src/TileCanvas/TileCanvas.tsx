import { useEffect, useState } from "react";
import Tile from "../Tile/Tile";
import "./TileCanvas.css";

type TileCanvasProps = {
  letters: string[];
};

type TileData = {
  x: number;
  y: number;
  letter: string;
  id: number;
};

export default function TileCanvas({ letters }: TileCanvasProps) {
  function initialTileData(letters: string[]) {
    return letters.map((letter, index) => ({
      id: index,
      letter,
      x: 0,
      y: 0,
    }));
  }

  const handleMoveTile = (id: number, x: number, y: number) => {
    setTileData((tiles) =>
      tiles.map((tile) => (tile.id === id ? { ...tile, x, y } : tile))
    );
  };

  const [tileData, setTileData] = useState<TileData[]>([]);

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
        pos={{ x: dataForTile.x, y: dataForTile.y }}
        onMove={handleMoveTile}
      />
    );
  });

  return <div className="tile-canvas">{tiles}</div>;
}
