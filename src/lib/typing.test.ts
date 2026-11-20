import { describe, expect, it } from "vitest"
import { typingAction } from "./typing"

function press(key: string, modifiers: Partial<KeyboardEvent> = {}) {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    repeat: false,
    ...modifiers,
  }
}

describe("typingAction", () => {
  it("adds the letter for a letter key, in upper case", () => {
    expect(typingAction(press("a"))).toEqual({ type: "add", letter: "A" })
    expect(typingAction(press("Z"))).toEqual({ type: "add", letter: "Z" })
  })

  it("deletes for Backspace and Delete", () => {
    expect(typingAction(press("Backspace"))).toEqual({ type: "delete" })
    expect(typingAction(press("Delete"))).toEqual({ type: "delete" })
  })

  it("ignores keys that aren't letters", () => {
    for (const key of ["1", " ", "Enter", "Shift", "ArrowLeft", "é", "-"]) {
      expect(typingAction(press(key))).toBeNull()
    }
  })

  it("leaves shortcuts alone", () => {
    expect(typingAction(press("r", { metaKey: true }))).toBeNull()
    expect(typingAction(press("c", { ctrlKey: true }))).toBeNull()
    expect(typingAction(press("a", { altKey: true }))).toBeNull()
    expect(typingAction(press("Backspace", { metaKey: true }))).toBeNull()
  })

  it("doesn't repeat a letter while the key is held", () => {
    expect(typingAction(press("a", { repeat: true }))).toBeNull()
  })

  it("keeps deleting while delete is held", () => {
    expect(typingAction(press("Backspace", { repeat: true }))).toEqual({
      type: "delete",
    })
  })
})
