# Security Model

LaunchDeck is built around one rule: importing a project must never silently execute it.

## Trust Boundaries

- The browser is the runtime boundary.
- Imported files are treated as untrusted content.
- GitHub imports are public repository zip downloads fetched directly from GitHub.
- LaunchDeck has no backend, no database, and no credential store.

## Import Controls

- Paths are normalized to remove null bytes, parent traversal segments, and unsafe filename characters.
- Binary and unsupported file types are skipped.
- Text files over the preview limit are skipped.
- Zip entries are checked by metadata and again after decompression.
- Zip archives have a size limit before extraction.
- A project import report records skipped files and warnings.

## Preview Controls

Preview rendering uses `iframe srcDoc`.

Default preview mode:

- no sandbox permissions
- `script-src 'none'`
- `default-src 'none'`
- image sources limited to data/blob/https
- inline styles allowed for static HTML/CSS previews

Users can toggle script preview in the UI, but LaunchDeck labels that state clearly. Future versions should gate this behind stronger warnings and per-project trust decisions.

## Secret Handling

LaunchDeck performs a lightweight static scan for common token/key/password patterns in imported text files. It is not a substitute for GitHub secret scanning, TruffleHog, Gitleaks, or provider-specific scanners.

Do not import private projects containing real secrets unless you are comfortable storing those file contents in browser localStorage.

## Dependency Handling

LaunchDeck reads metadata such as scripts and dependencies from `package.json`, but it does not run install scripts, package managers, build tools, or shell commands.

## Reporting Vulnerabilities

Please see [SECURITY.md](../SECURITY.md).
