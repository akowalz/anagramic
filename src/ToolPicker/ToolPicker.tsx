import "./ToolPicker.css"

import type { Tool } from "../Types/Tool"

type Props = {
  setTool: (tool: Tool) => void
  activeTool: Tool
}

export default function ToolPicker({ activeTool, setTool }: Props) {
  // Most rigid to least: a fixed row, a circle, anywhere, drifting
  const allTools: Tool[] = ["Line", "Wheel", "Tiles", "Floating"]

  const toolNames = {
    Tiles: "Freeform",
    Line: "Line",
    Wheel: "Wheel",
    Floating: "Floating",
  }

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
              {toolNames[tool]}
            </span>
          )
        })}
      </div>
    </div>
  )
}
