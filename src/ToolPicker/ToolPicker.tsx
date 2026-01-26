import "./ToolPicker.css"

import type { Dispatch, SetStateAction } from "react"
import type { Tool } from "../Types/Tool"

type Props = {
  setTool: Dispatch<SetStateAction<Tool>>
  activeTool: Tool
}

export default function ToolPicker({ activeTool, setTool }: Props) {
  const allTools: Tool[] = ["Tiles", "Line", "Wheel", "Floating"]

  return (
    <div id="tool-picker">
      {allTools.map((tool) => {
        return (
          <button
            key={tool}
            className={activeTool === tool ? "active" : ""}
            onClick={() => setTool(tool)}
          >
            {tool}
          </button>
        )
      })}
    </div>
  )
}
