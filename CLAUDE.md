# Claude.md

This is an app that helps users find anagrams from a given set of letters.
It's intended to be used by solvers of word games such as cryptic crosswords.

It's built with TypeScript, React, and Vite. The dependency list is very light
intentionally.

It is a fully front-end experience. It's just a static web app that users visit
in their browser. There is no backend or persistence.

The app is deployed using Vercel, pushing to main deploys. DO NOT DEPLOY OR PUSH.

The app is primarily designed to be used on mobile, but it also looks nice on
desktops. It's designed to look good on basically any screen size.

## Worktrees

When switching into a worktree, say so loudly: state the worktree name, its
path, and the git branch it is on (and whether that branch is new).

Naming: use the session name in kebab-case if there is one; otherwise pick a
short kebab-case name describing the task. With that `<name>`:

- worktree directory: `.claude/worktrees/<name>`
- git branch: `worktree-<name>` (the `EnterWorktree` default)

This lets me start and stop the dev server in different worktrees. A new
worktree needs `npm install` before `npm run dev`. If port 5173 is taken, Vite
picks the next free port, so report the URL you're using.

## Development

Dependencies are managed with npm (`package-lock.json`). Run `npm install` first.

- `npm run dev` — start the Vite dev server (http://localhost:5173 by default)
- `npx tsc -b` — type check the project (uses the project references in
  `tsconfig.json`, which cover `tsconfig.app.json` and `tsconfig.node.json`)
- `npm run lint` — run ESLint
- `npm run build` — type check and produce a production build in `dist/`
- `npm run preview` — serve the production build locally

Run the type check and lint after making changes.

## Rules for contributing

Please DO NOT PUSH TO MAIN. Pushing will deploy to production. Please do not do this!

Do not install new dependencies without asking first. If you want to install a new
dependency, make a strong case for it and only use if necessary.

There is a small Vitest suite covering pure logic (run with `npm test`, or
`npx vitest run` for a single run). Tests live next to the code they cover as
`*.test.ts`. Keep testable logic in plain functions (e.g. in `src/lib/`) so it
can be tested without a DOM.

Interactions (dragging, tapping, animation) are not covered by tests, so UI
changes must still be verified by hand. If you need to verify a change, pause
and ask for a manual verification of the changes.
