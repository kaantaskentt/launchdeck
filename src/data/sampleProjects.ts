import type { Project } from '../types'

const now = Date.now()

export const sampleProjects: Project[] = [
  {
    id: 'sample-launchdeck-web',
    name: 'launchdeck-web',
    slug: 'launchdeck-web',
    source: 'sample',
    repoPath: 'launchdeck/launchdeck-web',
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    health: 'healthy',
    healthDetail: 'All local checks passing',
    runtime: 'Vite + TS',
    stack: ['React', 'TypeScript', 'Vite', 'CSS'],
    scripts: [
      { name: 'dev', command: 'vite --host 0.0.0.0' },
      { name: 'build', command: 'tsc -b && vite build' },
      { name: 'test', command: 'vitest run' },
    ],
    files: [
      {
        path: 'index.html',
        name: 'index.html',
        language: 'HTML',
        size: 690,
        lastModified: now - 8 * 60 * 1000,
        content: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>LaunchDeck</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="hero">
      <nav>
        <strong>LaunchDeck</strong>
        <span>Features</span>
        <span>Docs</span>
        <span>GitHub</span>
      </nav>
      <section>
        <p class="eyebrow">Open source project cockpit</p>
        <h1>Import. Code. Preview. Ship.</h1>
        <p>LaunchDeck gives every project a focused dashboard, code workspace, and safe local preview.</p>
        <button>Get started</button>
      </section>
    </main>
  </body>
</html>`,
      },
      {
        path: 'styles.css',
        name: 'styles.css',
        language: 'CSS',
        size: 798,
        lastModified: now - 8 * 60 * 1000,
        content: `body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  color: #0f172a;
  background: #f8fbff;
}

.hero {
  min-height: 100vh;
  padding: 32px 42px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), transparent 34%),
    linear-gradient(180deg, #ffffff, #eef6ff);
}

nav {
  display: flex;
  gap: 24px;
  align-items: center;
  color: #475569;
}

nav strong {
  margin-right: auto;
  color: #020617;
}

section {
  max-width: 620px;
  margin-top: 120px;
}

.eyebrow {
  color: #059669;
  font-weight: 700;
}

h1 {
  font-size: clamp(36px, 6vw, 68px);
  line-height: 0.95;
  margin: 0 0 18px;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 12px 18px;
  background: #2563eb;
  color: white;
  font-weight: 700;
}`,
      },
      {
        path: 'package.json',
        name: 'package.json',
        language: 'JSON',
        size: 255,
        lastModified: now - 10 * 60 * 1000,
        content: `{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest"
  }
}`,
      },
      {
        path: 'README.md',
        name: 'README.md',
        language: 'Markdown',
        size: 189,
        lastModified: now - 15 * 60 * 1000,
        content: `# launchdeck-web

A tiny open-source landing app used inside LaunchDeck's safe preview.

## Scripts

- \`npm run dev\`
- \`npm run build\`
- \`npm run test\``,
      },
      {
        path: 'LICENSE',
        name: 'LICENSE',
        language: 'Text',
        size: 23,
        lastModified: now - 16 * 60 * 1000,
        content: 'MIT License sample project',
      },
    ],
    security: [
      { label: 'Dependencies', state: 'pass', detail: 'Lockfile detected' },
      { label: 'Secrets', state: 'pass', detail: 'No obvious secrets found' },
      { label: 'License', state: 'pass', detail: 'MIT license found' },
      { label: 'README', state: 'pass', detail: 'Setup docs found' },
    ],
    activity: [
      { label: 'Preview refreshed', detail: 'Static preview rebuilt safely', time: '2m ago' },
      { label: 'Checks completed', detail: 'No dependency or secret warnings', time: '6m ago' },
    ],
  },
  {
    id: 'sample-api-server',
    name: 'api-server',
    slug: 'api-server',
    source: 'sample',
    repoPath: 'launchdeck/api-server',
    updatedAt: new Date(now - 45 * 60 * 1000).toISOString(),
    health: 'review',
    healthDetail: 'No license file yet',
    runtime: 'Node.js',
    stack: ['Node.js', 'TypeScript', 'REST'],
    scripts: [
      { name: 'dev', command: 'tsx watch src/server.ts' },
      { name: 'test', command: 'vitest run' },
    ],
    files: [
      {
        path: 'src/server.ts',
        name: 'server.ts',
        language: 'TypeScript',
        size: 490,
        lastModified: now - 52 * 60 * 1000,
        content: `import http from 'node:http'

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: true, service: 'api-server' }))
})

server.listen(3001, () => {
  console.log('api-server ready on http://localhost:3001')
})`,
      },
      {
        path: 'package.json',
        name: 'package.json',
        language: 'JSON',
        size: 154,
        lastModified: now - 54 * 60 * 1000,
        content: `{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "tsx": "latest",
    "vitest": "latest"
  }
}`,
      },
      {
        path: 'README.md',
        name: 'README.md',
        language: 'Markdown',
        size: 88,
        lastModified: now - 58 * 60 * 1000,
        content: '# api-server\n\nA small JSON service ready for LaunchDeck review.',
      },
    ],
    security: [
      { label: 'Dependencies', state: 'warn', detail: 'No lockfile in import' },
      { label: 'Secrets', state: 'pass', detail: 'No obvious secrets found' },
      { label: 'License', state: 'neutral', detail: 'No license file yet' },
      { label: 'README', state: 'pass', detail: 'Setup docs found' },
    ],
    activity: [
      { label: 'Dependency review needed', detail: 'Add a lockfile before release', time: '45m ago' },
      { label: 'Workspace opened', detail: 'server.ts selected', time: '1h ago' },
    ],
  },
  {
    id: 'sample-design-system',
    name: 'design-system',
    slug: 'design-system',
    source: 'sample',
    repoPath: 'launchdeck/design-system',
    updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    health: 'healthy',
    healthDetail: 'All local checks passing',
    runtime: 'Static preview',
    stack: ['HTML', 'CSS', 'Tokens'],
    scripts: [{ name: 'preview', command: 'serve .' }],
    files: [
      {
        path: 'index.html',
        name: 'index.html',
        language: 'HTML',
        size: 360,
        lastModified: now - 3 * 60 * 60 * 1000,
        content: `<!doctype html>
<html>
  <head>
    <title>Design System</title>
    <link rel="stylesheet" href="tokens.css">
  </head>
  <body>
    <main>
      <h1>Design System</h1>
      <button>Primary action</button>
      <button class="secondary">Secondary</button>
    </main>
  </body>
</html>`,
      },
      {
        path: 'tokens.css',
        name: 'tokens.css',
        language: 'CSS',
        size: 355,
        lastModified: now - 3 * 60 * 60 * 1000,
        content: `:root {
  --brand: #2563eb;
  --ink: #0f172a;
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: var(--ink);
  background: #f8fafc;
}

main {
  padding: 48px;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--brand);
  color: white;
}

.secondary {
  background: white;
  color: var(--ink);
  border: 1px solid #cbd5e1;
}`,
      },
      {
        path: 'LICENSE',
        name: 'LICENSE',
        language: 'Text',
        size: 23,
        lastModified: now - 3 * 60 * 60 * 1000,
        content: 'MIT License sample project',
      },
    ],
    security: [
      { label: 'Dependencies', state: 'neutral', detail: 'No package manager needed' },
      { label: 'Secrets', state: 'pass', detail: 'No obvious secrets found' },
      { label: 'License', state: 'pass', detail: 'MIT license found' },
      { label: 'README', state: 'neutral', detail: 'Add setup docs' },
    ],
    activity: [
      { label: 'Tokens indexed', detail: 'CSS variables detected', time: '3h ago' },
      { label: 'License found', detail: 'Ready for open source reuse', time: '3h ago' },
    ],
  },
]
