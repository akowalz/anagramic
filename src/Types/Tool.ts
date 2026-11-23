export type Tool = "Tiles" | "Line" | "Wheel" | "Floating"

// Most rigid to least: a fixed row, a circle, anywhere, drifting
export const ALL_TOOLS: Tool[] = ["Line", "Wheel", "Tiles", "Floating"]

export const TOOL_NAMES: Record<Tool, string> = {
  Tiles: "Freeform",
  Line: "Line",
  Wheel: "Wheel",
  Floating: "Floating",
}
