// Start the dev server in a Claude Code worktree by name.
//
//   npm run wt hotfix-123            -> .claude/worktrees/hotfix-123
//   npm run wt hotfix-123 -- --open  -> extra args are passed to Vite
//
// Works from the main checkout or from inside any worktree.

import {
  describeWorktrees,
  ensureDependencies,
  exitCodeOf,
  findWorktree,
  spawnNpm,
} from "./worktrees.mjs"

const [name, ...viteArgs] = process.argv.slice(2)

if (!name) {
  console.error("Usage: npm run wt <worktree-name>")
  console.error(describeWorktrees())
  process.exit(1)
}

const dir = findWorktree(name)

if (!dir) {
  console.error(`No worktree named "${name}".`)
  console.error(describeWorktrees())
  process.exit(1)
}

// Ctrl+C reaches the child directly; let it shut down and report its exit.
process.on("SIGINT", () => {})

const installCode = await ensureDependencies(dir)
if (installCode !== 0) process.exit(installCode)

process.exit(await exitCodeOf(spawnNpm(["run", "dev", "--", ...viteArgs], dir)))
