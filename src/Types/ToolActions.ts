import type { Tool } from "./Tool"

/*
 * What a tool can do when the footer buttons are pressed. Each tool hands its
 * actions to the app through a ref (useImperativeHandle), so they always see
 * the tool's current state.
 */
export interface ToolActions {
  shuffle?: () => void
  reset?: () => void
}

/* Which footer buttons each tool shows */
export const TOOL_BUTTONS: Record<Tool, { reset: boolean; shuffle: boolean }> =
  {
    Tiles: { reset: true, shuffle: true },
    Line: { reset: true, shuffle: true },
    Wheel: { reset: true, shuffle: true },
    Floating: { reset: false, shuffle: true },
  }
