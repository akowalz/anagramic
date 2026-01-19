export type Coord = {
  x: number
  y: number
}

export type Position = {
  top: number
  left: number
}

export function coordToPosition(coord: Coord) {
  const { x, y } = coord

  if (x < -1.0 || x > 1.0) throw "x out of range"
  if (y < -1.0 || y > 1.0) throw "x out of range"

  return {
    left: x * 0.5 + 0.5,
    top: y * -0.5 + 0.5,
  }
}

export function positionToStyle(position: Position) {
  return {
    top: `${position.top * 100}%`,
    left: `${position.left * 100}%`,
  }
}
