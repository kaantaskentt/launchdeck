# Security Policy

## Supported Versions

LaunchDeck is pre-1.0. Please report issues against the latest `main` branch.

## Reporting A Vulnerability

Please open a private security advisory on GitHub if available. If that is not available, open an issue with minimal reproduction details and avoid posting secrets, private tokens, or sensitive project files.

Useful reports include:

- import path traversal or unsafe file handling
- preview sandbox escape
- script execution when safe preview is enabled
- unsafe persistence of sensitive data
- dependency vulnerabilities with practical impact

## Non-Goals

LaunchDeck does not claim to fully scan dependencies, detect every secret, or safely execute arbitrary project code. It is designed to inspect and preview projects before execution.
