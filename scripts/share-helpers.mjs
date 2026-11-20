// Pure helpers for share.mjs, kept apart so they can be tested.

/* Split the arguments into an optional worktree name, then arguments for Vite */
export function parseArgs(args) {
  const [first, ...rest] = args

  if (first && !first.startsWith("-")) return { name: first, viteArgs: rest }
  return { name: undefined, viteArgs: args }
}

export function stripAnsi(text) {
  return text.replace(/\u001B\[[0-9;]*m/g, "")
}

/* The port Vite says it is listening on, from its startup output */
export function parseVitePort(output) {
  const match = stripAnsi(output).match(/Local:\s+https?:\/\/[^\s:/]+:(\d+)/)

  return match ? Number(match[1]) : null
}

/*
 * What one line of ngrok's JSON log tells us: the public URL once the tunnel
 * is up ({ url }), or something went wrong ({ error }). Plain lines that
 * aren't JSON are passed on as { other }. Everything else is just chatter.
 */
export function parseNgrokLine(line) {
  const text = line.trim()
  if (!text) return null

  let entry
  try {
    entry = JSON.parse(text)
  } catch {
    return { other: text }
  }

  if (entry.msg === "started tunnel" && typeof entry.url === "string") {
    return { url: entry.url }
  }
  if (entry.lvl === "eror" || entry.lvl === "crit") {
    return { error: entry.err ?? entry.msg ?? text }
  }
  return null
}
