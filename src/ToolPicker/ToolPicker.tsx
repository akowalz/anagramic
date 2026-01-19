import "./ToolPicker.css"

import TilesIcon from "../Icons/Tiles.svg?react"
import LineIcon from "../Icons/Line.svg?react"
import WheelIcon from "../Icons/Wheel.svg?react"

import type { Dispatch, SetStateAction } from "react"
import type { Tool } from "../Types/Tool"

type Props = {
  setTool: Dispatch<SetStateAction<Tool>>
  activeTool: Tool
}

export default function ToolPicker({ activeTool, setTool }: Props) {
  const allTools: Tool[] = ["Tiles", "Line", "Wheel", "Floating"]
  // TODO: remove icons?
  const iconForTool = {
    Tiles: <TilesIcon />,
    Line: <LineIcon />,
    Wheel: <WheelIcon />,
  }

  return (
    <div id="tool-picker">
      <span>Tools</span>
      {allTools.map((tool) => {
        return (
          <button
            key={tool}
            className={activeTool === tool ? "active" : ""}
            onClick={() => setTool(tool)}
          >
            {tool}
            {/* Uncomment when svgs are fixed */}
            {/* {iconForTool[tool]} */}
          </button>
        )
      })}
    </div>
  )
}
