// Helpers shared by the dev server launchers (wt.mjs and share.mjs).

import { execFileSync, spawn } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"

// The shared .git dir lives in the main checkout, whichever worktree we're in.
function worktreesDir() {
  const gitCommonDir = execFileSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { encoding: "utf8" },
  ).trim()

  return path.join(path.dirname(gitCommonDir), ".claude", "worktrees")
}

/* The worktrees that exist, as a message to show when one wasn't found */
export function describeWorktrees() {
  const dir = worktreesDir()
  const names = existsSync(dir) ? readdirSync(dir) : []

  return names.length
    ? `Available worktrees:\n${names.map((n) => `  ${n}`).join("\n")}`
    : "No worktrees found in .claude/worktrees/"
}

/* The directory of the worktree with this name, or undefined if there isn't one */
export function findWorktree(name) {
  // Accept the branch name too (worktree-<name>).
  return [name, name.replace(/^worktree-/, "")]
    .map((n) => path.join(worktreesDir(), n))
    .find((dir) => existsSync(dir))
}

/* The root of the checkout (main or worktree) the script was run from */
export function currentCheckout() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim()
}

/* Run an npm command in the directory; output goes straight to the terminal unless `options` say otherwise */
export function spawnNpm(args, dir, options = {}) {
  return spawn("npm", args, { cwd: dir, stdio: "inherit", ...options })
}

/* Resolves to the exit code of a child process once it ends */
export function exitCodeOf(child) {
  return new Promise((resolve) => {
    child.on("exit", (code, signal) => resolve(signal ? 1 : (code ?? 0)))
  })
}

/* Install dependencies if the directory has none yet. Resolves to an exit code. */
export async function ensureDependencies(dir) {
  if (existsSync(path.join(dir, "node_modules"))) return 0

  console.log(`Installing dependencies in ${path.basename(dir)}...`)
  return exitCodeOf(spawnNpm(["install"], dir))
}
