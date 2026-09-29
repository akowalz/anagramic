import { execFileSync } from "node:child_process"
import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import { configDefaults } from "vitest/config"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"

// Show which worktree and branch this dev server is running from, both in
// Vite's startup banner and in the terminal tab title.
function worktreeBanner(): Plugin {
  return {
    name: "worktree-banner",
    apply: "serve",
    configureServer(server) {
      const root = server.config.root
      const match = root.match(/[\\/]\.claude[\\/]worktrees[\\/]([^\\/]+)/)
      const where = match ? `worktree ${match[1]}` : "main checkout"
      let branch = "unknown branch"
      try {
        branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
          cwd: root,
          encoding: "utf8",
        }).trim()
      } catch {
        // Not a git checkout; keep the fallback.
      }

      const printUrls = server.printUrls.bind(server)
      server.printUrls = () => {
        printUrls()
        server.config.logger.info(
          `  \x1b[32m➜\x1b[0m  \x1b[1mCheckout:\x1b[0m ${where} \x1b[2m(${branch})\x1b[0m`,
        )
        if (process.stdout.isTTY) {
          const label = match ? match[1] : path.basename(root)
          process.stdout.write(`\x1b]0;anagramic: ${label}\x07`)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    svgr(),
    worktreeBanner(),
  ],
  test: {
    exclude: [...configDefaults.exclude, ".claude/**", ".worktrees/**"],
  },
})
