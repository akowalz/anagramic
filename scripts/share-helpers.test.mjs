import { describe, expect, it } from "vitest"
import {
  parseArgs,
  parseNgrokLine,
  parseVitePort,
  stripAnsi,
} from "./share-helpers.mjs"

describe("parseArgs", () => {
  it("takes the first argument as the worktree name", () => {
    expect(parseArgs(["hotfix-123"])).toEqual({
      name: "hotfix-123",
      viteArgs: [],
    })
  })

  it("passes the rest on to Vite", () => {
    expect(parseArgs(["hotfix-123", "--open", "--host"])).toEqual({
      name: "hotfix-123",
      viteArgs: ["--open", "--host"],
    })
  })

  it("has no name when there are no arguments", () => {
    expect(parseArgs([])).toEqual({ name: undefined, viteArgs: [] })
  })

  it("doesn't mistake a Vite option for a name", () => {
    expect(parseArgs(["--open"])).toEqual({
      name: undefined,
      viteArgs: ["--open"],
    })
  })
})

describe("stripAnsi", () => {
  it("removes colour codes", () => {
    expect(stripAnsi("\x1b[1m\x1b[32mhello\x1b[0m world")).toBe("hello world")
  })
})

describe("parseVitePort", () => {
  it("finds the port in Vite's startup output", () => {
    const output =
      "\n  VITE v7.3.0  ready in 78 ms\n\n  ➜  Local:   http://localhost:5174/\n"

    expect(parseVitePort(output)).toBe(5174)
  })

  it("copes with the colours Vite adds", () => {
    const output =
      "  \x1b[32m➜\x1b[39m  \x1b[1mLocal\x1b[22m:   \x1b[36mhttp://localhost:\x1b[1m5173\x1b[22m/\x1b[39m"

    expect(parseVitePort(output)).toBe(5173)
  })

  it("is null until Vite has said where it is listening", () => {
    expect(parseVitePort("> anagramic@1.0.0 dev\n> vite\n")).toBeNull()
  })

  it("ignores the network address", () => {
    expect(parseVitePort("  ➜  Network: http://192.168.1.5:5173/")).toBeNull()
  })
})

describe("parseNgrokLine", () => {
  it("finds the public URL when the tunnel starts", () => {
    const line = JSON.stringify({
      lvl: "info",
      msg: "started tunnel",
      obj: "tunnels",
      addr: "http://localhost:5174",
      url: "https://1cf7-205-178-69-168.ngrok-free.app",
    })

    expect(parseNgrokLine(line)).toEqual({
      url: "https://1cf7-205-178-69-168.ngrok-free.app",
    })
  })

  it("reports errors", () => {
    const line = JSON.stringify({
      lvl: "eror",
      msg: "command failed",
      err: "authentication failed",
    })

    expect(parseNgrokLine(line)).toEqual({ error: "authentication failed" })
  })

  it("falls back to the message when an error has no details", () => {
    const line = JSON.stringify({ lvl: "crit", msg: "it broke" })

    expect(parseNgrokLine(line)).toEqual({ error: "it broke" })
  })

  it("ignores ordinary log lines", () => {
    const line = JSON.stringify({
      lvl: "info",
      msg: "client session established",
    })

    expect(parseNgrokLine(line)).toBeNull()
  })

  it("passes on lines that aren't JSON", () => {
    expect(parseNgrokLine("ERROR: something went wrong")).toEqual({
      other: "ERROR: something went wrong",
    })
  })

  it("ignores blank lines", () => {
    expect(parseNgrokLine("  ")).toBeNull()
  })
})
