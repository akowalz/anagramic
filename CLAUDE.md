# Claude.md

This is an app that helps users find anagrams from a given set of letters.
It's intended to be used by solvers of word games such as cryptic crosswords.

It's built with TypeScript, React, and Vite. The dependency list is very light
intentionally.

It is a fully front-end experience. It's just a static web app that users visit
in their browser. There is no backend or persistence.

The app is deployed using Vercel, pushing to main deploys. Agents are allowed to
deploy the app and push to main, if approval is given by the user.

The app is primarily designed to be used on mobile, but it also looks nice on
desktops. It's designed to look good on basically any screen size.

## Worktrees

By default, dont use worktrees. Switch to a different branch off the main checkout instead.

## Development

Dependencies are managed with npm (`package-lock.json`). Run `npm install` first.

- `npm run dev` — start the Vite dev server (http://localhost:5173 by default)
- `npx tsc -b` — type check the project (uses the project references in
  `tsconfig.json`, which cover `tsconfig.app.json`, `tsconfig.node.json` and
  `tsconfig.e2e.json` for the UI tests)
- `npm run lint` — run ESLint
- `npm run build` — type check and produce a production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm test` — unit tests (Vitest); `npx vitest run` for a single run
- `npm run test:ui` — UI tests in a real browser (Playwright); see "Tests" below
- `npm run share [name]` - share a public link with ngrok (handy if using remote-control to make changes); see "Sharing a dev server" below

Run the type check and lint after making changes.

## Sharing a dev server at a public URL (ngrok)

```
npm run share              # share the checkout you're in
npm run share <name>       # share .claude/worktrees/<name>
```

`npm run share [name]` starts the dev server and puts it on a public
`https://<random>.ngrok-free.app` URL, e.g. to try a change on a phone. With no
name it shares the checkout you're in; with a name it shares
`.claude/worktrees/<name>` (installing dependencies first if needed). Extra
args after `--` go to Vite. It prints the URL on a `Public:` line, and Ctrl+C
stops both the dev server and the tunnel.

**Claude can run this.** When asking the user to check a UI change by hand,
remind them that Claude can run `npm run share <name>` to give them a URL to
open on their phone. Only start it once they say yes, since it makes the app
public. To run it, use the background option, read its output for the `Public:`
line, and send the user that URL. Stop the background task when they're done.

Notes:

- **Doing it by hand**, e.g. for a dev server that's already running:
  `ngrok http <port> --host-header=rewrite`, with the port Vite printed (5173,
  or the next free port). ngrok prints the URL, or read `public_url` from its
  local API with `curl -s http://127.0.0.1:4040/api/tunnels`.
- **`--host-header=rewrite` is required.** Vite refuses requests whose `Host`
  isn't allowed, so without it the site shows "Blocked request. This host is
  not allowed." Rewriting the header to `localhost` means no `vite.config.ts`
  change is needed, in any worktree or branch. Hot reload works through the
  tunnel. (`npm run share` does this for you.)
- **Tunnel the right port.** Several dev servers can be running at once. To
  see which checkout a port serves, run `lsof -nP -iTCP -sTCP:LISTEN | grep node`
  and then `lsof -a -p <pid> -d cwd` for the process.
- **Check it loads before sending it**, e.g. with
  `curl -s -H "ngrok-skip-browser-warning: 1" <url>/`, which should return the
  page's HTML.
- **Setup:** ngrok is installed with `brew install --cask ngrok`. It needs a
  free ngrok account and an authtoken, added once with
  `ngrok config add-authtoken <token>`. The token is stored in
  `~/Library/Application Support/ngrok/ngrok.yml` and is already set up on
  this machine. Never print it.
- **It's public.** Anyone with the URL can use the app until the tunnel is
  stopped, so stop it when the user is done (Ctrl+C, or stop the background
  task). The URL changes every time a tunnel starts, and the free plan limits
  how many tunnels can run at once.

## Rules for contributing

Do not install new dependencies without asking first. If you want to install a new
dependency, make a strong case for it and only use if necessary.

## Tests

- **Unit tests** (Vitest, `npm test`) cover pure logic. They live next to the
  code they cover as `*.test.ts`. Keep testable logic in plain functions (e.g.
  in `src/lib/`) so it can be tested without a DOM.
- **UI tests** (Playwright, `npm run test:ui`) drive the app in a real Chrome
  at phone size: typing and delete, each tool's taps, drags, locks, shuffle
  and reset, and layout. They live in `e2e/`, one file per tool plus
  `app.spec.ts`, with shared helpers in `e2e/helpers.ts`. They start their own
  dev server on port 5199 and use the Chrome installed on this machine.
  `Math.random` is seeded and CSS transitions are turned off, so runs are
  repeatable and positions can be read straight away.

Run both after changing behaviour, and add UI tests for new behaviour. A
`test.fail(...)` marks a known bug: it's expected to fail, and Playwright
reports it once it passes so the marker can be removed.

The UI tests don't cover real touch input, how animations look, or iOS
specifics (e.g. the Home Screen app), so UI changes still need checking by
hand. If you need to verify a change, pause and ask for a manual verification
of the changes.
