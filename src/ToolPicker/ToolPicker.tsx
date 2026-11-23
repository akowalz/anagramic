import "./ToolPicker.css"

import { ALL_TOOLS, TOOL_NAMES, type Tool } from "../Types/Tool"

type Props = {
  setTool: (tool: Tool) => void
  activeTool: Tool
}

export default function ToolPicker({ activeTool, setTool }: Props) {
  return (
    <div className="tool-picker-container">
      <div className="tool-picker">
        {ALL_TOOLS.map((tool) => {
          return (
            <span
              key={tool}
              className={`tool-picker-tool ${activeTool === tool ? "active" : ""}`}
              onClick={() => setTool(tool)}
            >
              {TOOL_NAMES[tool]}
            </span>
          )
        })}
      </div>
    </div>
  )
}
