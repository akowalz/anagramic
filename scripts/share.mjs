// Run the dev server and put it on a public URL with ngrok, e.g. to try it on
// a phone.
//
//   npm run share                       -> the checkout you're in
//   npm run share hotfix-123            -> .claude/worktrees/hotfix-123
//   npm run share hotfix-123 -- --open  -> extra args are passed to Vite
//
// Needs ngrok, signed in once:
//   brew install --cask ngrok
//   ngrok config add-authtoken <token>
//
// Anyone with the URL can open the app until you press Ctrl+C.

import { spawn, spawnSync } from "node:child_process"
import readline from "node:readline"
import { parseArgs, parseNgrokLine, parseVitePort } from "./share-helpers.mjs"
import {
  currentCheckout,
  describeWorktrees,
  ensureDependencies,
  findWorktree,
  spawnNpm,
} from "./worktrees.mjs"

const { name, viteArgs } = parseArgs(process.argv.slice(2))

let dir
if (name) {
  dir = findWorktree(name)
  if (!dir) {
    console.error(`No worktree named "${name}".`)
    console.error(describeWorktrees())
    process.exit(1)
  }
} else {
  dir = currentCheckout()
}

if (spawnSync("ngrok", ["version"]).error) {
  console.error(
    [
      "ngrok isn't installed. Install it, and sign in once with a free account:",
      "  brew install --cask ngrok",
      "  ngrok config add-authtoken <token>   (from dashboard.ngrok.com)",
    ].join("\n"),
  )
  process.exit(1)
}

const installCode = await ensureDependencies(dir)
if (installCode !== 0) process.exit(installCode)

// The dev server and the tunnel live and die together
const children = []
let stopping = false
let exitCode = 0

function stop(code) {
  if (stopping) return
  stopping = true
  exitCode = code

  for (const child of children) child.kill("SIGTERM")

  // Don't hang around if something ignores the request to stop
  setTimeout(() => {
    for (const child of children) child.kill("SIGKILL")
    process.exit(exitCode)
  }, 3000).unref()
}

function track(child) {
  children.push(child)

  child.on("exit", (code, signal) => {
    // One of them ending takes the other with it
    stop(signal ? 1 : (code ?? 0))

    if (children.every((c) => c.exitCode !== null || c.signalCode !== null)) {
      process.exit(exitCode)
    }
  })
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => stop(0))
}

function onNgrokLine(line) {
  const result = parseNgrokLine(line)
  if (!result) return

  if (result.url) {
    console.log(
      `\n  \x1b[32m➜\x1b[0m  \x1b[1mPublic:\x1b[0m   ${result.url}` +
        "\n     \x1b[2mAnyone with this URL can open the app. Ctrl+C to stop.\x1b[0m\n",
    )
  } else {
    console.error(`ngrok: ${result.error ?? result.other}`)
  }
}

function startTunnel(port) {
  // Vite refuses requests for hosts it doesn't know, like *.ngrok-free.app.
  // Rewriting the Host header to localhost means Vite needs no changes.
  const ngrok = spawn(
    "ngrok",
    [
      "http",
      String(port),
      "--host-header=rewrite",
      "--log=stdout",
      "--log-format=json",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  )
  track(ngrok)

  for (const stream of [ngrok.stdout, ngrok.stderr]) {
    readline.createInterface({ input: stream }).on("line", onNgrokLine)
  }
}

const vite = spawnNpm(["run", "dev", "--", ...viteArgs], dir, {
  // Piped so we can see which port Vite picked; still shown as usual
  stdio: ["inherit", "pipe", "inherit"],
  env: { ...process.env, FORCE_COLOR: "1" },
})
track(vite)

let viteOutput = ""
let tunnelStarted = false

vite.stdout.on("data", (chunk) => {
  process.stdout.write(chunk)
  if (tunnelStarted) return

  viteOutput += chunk
  const port = parseVitePort(viteOutput)
  if (port) {
    tunnelStarted = true
    startTunnel(port)
  }
})
