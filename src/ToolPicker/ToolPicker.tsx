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
    <div className="tool-picker-container">
      <div className="tool-picker">
        {allTools.map((tool) => {
          return (
            <span
              key={tool}
              className={`tool-picker-tool ${activeTool === tool ? "active" : ""}`}
              onClick={() => setTool(tool)}
            >
              {tool}
            </span>
          )
        })}
      </div>
    </div>
  )
}
