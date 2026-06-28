# Contributing

Thanks for helping make LaunchDeck better.

## Development

```bash
npm install
npm run dev
```

Before opening a PR:

```bash
npm run check
npm run test:e2e
```

## Guidelines

- Keep imports local-first and explicit.
- Do not add backend calls unless the feature truly needs them.
- Do not execute imported project code as part of import or preview.
- Add tests for import, preview, and security-sensitive changes.
- Keep the UI dense, calm, and developer-friendly.

## Pull Requests

Good PRs include:

- a short description of the user-facing change
- screenshots for UI changes
- test coverage or a clear reason tests are not applicable
- security notes for import, preview, persistence, or GitHub changes
