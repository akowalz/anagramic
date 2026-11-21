# Anagramic

Anagramic is a letter visualizer and workspace, designed to help with word games
like cryptic crosswords.

It's free and open source, and can be used at https://anagramic.net

## Running Locally

Install dependencies:

```
npm install
```

Run the dev server:

```
npm run dev
```

Build for production:

```
npm run build
```

Run the tests:

```
npm test            # unit tests (Vitest)
npm run test:ui     # UI tests in Chrome (Playwright)
```

## Deploying

Pushing to `main` deploys to production on Vercel, and nothing runs the tests
first. Always run the type check, lint and both test suites before pushing:

```
npx tsc -b && npm run lint && npx vitest run && npm run test:ui
```

## License and Contributions

Anagramic is open source under the MIT License. I'm not taking contributions right now,
but if you have feedback feel free to open an issue or fork the repository yourself.
