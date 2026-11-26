import "./ToolPicker.css"

import { ALL_TOOLS, TOOL_NAMES, type Tool } from "../Types/Tool"

type Props = {
  setTool: (tool: Tool) => void
  activeTool: Tool
  // Smaller, for the header
  compact?: boolean
}

export default function ToolPicker({ activeTool, setTool, compact }: Props) {
  return (
    <div className={`tool-picker-container ${compact ? "compact" : ""}`}>
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
