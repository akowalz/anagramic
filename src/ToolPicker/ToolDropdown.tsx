import "./ToolDropdown.css"
import { ALL_TOOLS, TOOL_NAMES, type Tool } from "../Types/Tool"

type Props = {
  activeTool: Tool
  setTool: (tool: Tool) => void
}

/*
 * The tool picker in a single button, for when the clue needs the room. It's a
 * native select, so phones show their own picker.
 */
export default function ToolDropdown({ activeTool, setTool }: Props) {
  return (
    <label className="tool-dropdown">
      {TOOL_NAMES[activeTool]}
      <span className="tool-dropdown-arrow" aria-hidden>
        ▾
      </span>
      <select
        aria-label="Tool"
        value={activeTool}
        onChange={(e) => setTool(e.target.value as Tool)}
      >
        {ALL_TOOLS.map((tool) => (
          <option key={tool} value={tool}>
            {TOOL_NAMES[tool]}
          </option>
        ))}
      </select>
    </label>
  )
}
