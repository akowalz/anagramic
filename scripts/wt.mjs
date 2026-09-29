// Start the dev server in a Claude Code worktree by name.
//
//   npm run wt hotfix-123            -> .claude/worktrees/hotfix-123
//   npm run wt hotfix-123 -- --open  -> extra args are passed to Vite
//
// Works from the main checkout or from inside any worktree.

import { execFileSync, spawn } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"

const [name, ...viteArgs] = process.argv.slice(2)

// The shared .git dir lives in the main checkout, whichever worktree we're in.
const gitCommonDir = execFileSync(
  "git",
  ["rev-parse", "--path-format=absolute", "--git-common-dir"],
  { encoding: "utf8" },
).trim()
const worktreesDir = path.join(path.dirname(gitCommonDir), ".claude", "worktrees")

function listWorktrees() {
  const names = existsSync(worktreesDir) ? readdirSync(worktreesDir) : []
  console.error(
    names.length
      ? `Available worktrees:\n${names.map((n) => `  ${n}`).join("\n")}`
      : "No worktrees found in .claude/worktrees/",
  )
}

if (!name) {
  console.error("Usage: npm run wt <worktree-name>")
  listWorktrees()
  process.exit(1)
}

// Accept the branch name too (worktree-<name>).
const dir = [name, name.replace(/^worktree-/, "")]
  .map((n) => path.join(worktreesDir, n))
  .find((d) => existsSync(d))

if (!dir) {
  console.error(`No worktree named "${name}".`)
  listWorktrees()
  process.exit(1)
}

function run(args) {
  return new Promise((resolve) => {
    const child = spawn("npm", args, { cwd: dir, stdio: "inherit" })
    child.on("exit", (code, signal) => resolve(signal ? 1 : (code ?? 0)))
  })
}

// Ctrl+C reaches the child directly; let it shut down and report its exit.
process.on("SIGINT", () => {})

if (!existsSync(path.join(dir, "node_modules"))) {
  console.log(`Installing dependencies in ${path.basename(dir)}...`)
  const code = await run(["install"])
  if (code !== 0) process.exit(code)
}

process.exit(await run(["run", "dev", "--", ...viteArgs]))
