import JSZip from 'jszip'
import type {
  ImportReport,
  ImportResult,
  Project,
  ProjectFile,
  ProjectHealth,
  ProjectScript,
  ProjectSource,
  SecurityCheck,
  SkippedFile,
} from '../types'

const MAX_TEXT_FILE_BYTES = 420_000
const MAX_PROJECT_FILES = 160
const MAX_ZIP_BYTES = 18 * 1024 * 1024

const TEXT_EXTENSIONS = new Set([
  '.astro',
  '.css',
  '.env.example',
  '.gitignore',
  '.graphql',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.mts',
  '.scss',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.yaml',
  '.yml',
])

const TEXT_FILE_NAMES = new Set([
  'dockerfile',
  'license',
  'readme',
  'readme.md',
  'package.json',
  'vite.config.ts',
  'vite.config.js',
])

export type ImportableFile = {
  name: string
  size: number
  lastModified?: number
  text: () => Promise<string>
  webkitRelativePath?: string
}

type RawEntry = {
  path: string
  name: string
  size: number
  lastModified: number
  text: () => Promise<string>
}

export function normalizeProjectPath(path: string): string {
  const cleanSegments = path
    .replaceAll('\\', '/')
    .replaceAll('\u0000', '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => segment !== '.' && segment !== '..')
    .map((segment) => segment.replace(/[<>:"|?*]/g, '-'))

  return cleanSegments.join('/') || 'untitled'
}

export function getLanguageFromPath(path: string): string {
  const lower = path.toLowerCase()

  if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) return 'React'
  if (lower.endsWith('.ts') || lower.endsWith('.mts')) return 'TypeScript'
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'JavaScript'
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'CSS'
  if (lower.endsWith('.html')) return 'HTML'
  if (lower.endsWith('.json')) return 'JSON'
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'Markdown'
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'YAML'
  if (lower.endsWith('.toml')) return 'TOML'

  return 'Text'
}

export function isTextProjectFile(path: string, size: number): boolean {
  if (size > MAX_TEXT_FILE_BYTES) return false

  const lower = path.toLowerCase()
  const fileName = lower.split('/').at(-1) ?? lower
  const extensionMatch = lower.match(/(\.[a-z0-9]+)$/)
  const extension = extensionMatch?.[1] ?? ''

  return TEXT_FILE_NAMES.has(fileName) || TEXT_EXTENSIONS.has(extension)
}

export async function importFileList(files: FileList | ImportableFile[]): Promise<ImportResult> {
  const entries: RawEntry[] = Array.from(files).map((file) => {
    const relativePath = file.webkitRelativePath || file.name

    return {
      path: normalizeProjectPath(relativePath),
      name: file.name,
      size: file.size,
      lastModified: file.lastModified ?? Date.now(),
      text: () => file.text(),
    }
  })

  return createProjectFromEntries(entries, 'folder')
}

export async function importZipFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error('Zip is over the 18 MB safety limit.')
  }

  const zip = await JSZip.loadAsync(file)
  const entries: RawEntry[] = []

  zip.forEach((path, entry) => {
    if (!entry.dir) {
      entries.push({
        path: normalizeProjectPath(path),
        name: path.split('/').at(-1) ?? path,
        size: getZipEntrySize(entry),
        lastModified: entry.date.getTime(),
        text: () => entry.async('text'),
      })
    }
  })

  return createProjectFromEntries(entries, 'zip')
}

export async function importGitHubRepository(repoUrl: string): Promise<ImportResult> {
  const repo = parseGitHubRepo(repoUrl)

  if (!repo) {
    throw new Error('Enter a GitHub URL like https://github.com/owner/repo.')
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/zipball`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`GitHub import failed with ${response.status}.`)
  }

  const archive = await response.arrayBuffer()
  const file = new File([archive], `${repo.name}.zip`, { type: 'application/zip' })
  const result = await importZipFile(file)

  return {
    ...result,
    project: {
      ...result.project,
      source: 'github',
      name: repo.name,
      repoPath: `${repo.owner}/${repo.name}`,
      slug: slugify(repo.name),
    },
    report: {
      ...result.report,
      rootName: repo.name,
    },
  }
}

export function parseGitHubRepo(value: string): { owner: string; name: string } | null {
  const trimmed = value.trim()
  const sshMatch = trimmed.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(?:\.git)?(?:\/.*)?$/)
  const shorthandMatch = trimmed.match(/^([\w.-]+)\/([\w.-]+)(?:\.git)?$/)
  const match = sshMatch ?? urlMatch ?? shorthandMatch

  if (!match) return null

  return {
    owner: match[1],
    name: match[2].replace(/\.git$/, ''),
  }
}

async function createProjectFromEntries(
  entries: RawEntry[],
  source: ProjectSource,
): Promise<ImportResult> {
  if (entries.length === 0) {
    throw new Error('No files were found in this import.')
  }

  const skippedFiles: SkippedFile[] = []
  const rootName = inferRootName(entries.map((entry) => entry.path))
  const projectFiles: ProjectFile[] = []

  for (const entry of entries.slice(0, MAX_PROJECT_FILES)) {
    const relativePath = stripRoot(entry.path, rootName)
    const normalizedPath = normalizeProjectPath(relativePath)

    if (!isTextProjectFile(normalizedPath, entry.size)) {
      skippedFiles.push({
        path: normalizedPath,
        reason: entry.size > MAX_TEXT_FILE_BYTES ? 'over text preview limit' : 'binary or unsupported file type',
      })
      continue
    }

    try {
      const content = await entry.text()
      const contentSize = new Blob([content]).size

      if (contentSize > MAX_TEXT_FILE_BYTES) {
        skippedFiles.push({
          path: normalizedPath,
          reason: 'over text preview limit after decompression',
        })
        continue
      }

      projectFiles.push({
        path: normalizedPath,
        name: normalizedPath.split('/').at(-1) ?? normalizedPath,
        content,
        size: contentSize,
        language: getLanguageFromPath(normalizedPath),
        lastModified: entry.lastModified,
      })
    } catch {
      skippedFiles.push({
        path: normalizedPath,
        reason: 'could not read file safely',
      })
    }
  }

  if (entries.length > MAX_PROJECT_FILES) {
    skippedFiles.push({
      path: `${entries.length - MAX_PROJECT_FILES} additional files`,
      reason: 'project import limit reached',
    })
  }

  if (projectFiles.length === 0) {
    throw new Error('No safe text files could be imported.')
  }

  const project = createProjectFromFiles({
    files: projectFiles,
    rootName,
    source,
    skippedFiles,
  })

  const report: ImportReport = {
    rootName,
    importedFiles: projectFiles.length,
    skippedFiles,
    warnings: buildWarnings(projectFiles, skippedFiles),
  }

  return { project, report }
}

function createProjectFromFiles(input: {
  files: ProjectFile[]
  rootName: string
  source: ProjectSource
  skippedFiles: SkippedFile[]
}): Project {
  const packageJson = findFile(input.files, 'package.json')
  const scripts = detectScripts(packageJson)
  const stack = detectStack(input.files, packageJson)
  const secrets = findPotentialSecrets(input.files)
  const hasLockfile = input.files.some((file) =>
    ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'].includes(file.name),
  )
  const hasLicense = input.files.some((file) => file.name.toLowerCase().startsWith('license'))
  const hasReadme = input.files.some((file) => file.name.toLowerCase().startsWith('readme'))
  const health = determineHealth({ hasLockfile, secrets: secrets.length, skipped: input.skippedFiles.length })
  const runtime = inferRuntime(stack, packageJson)
  const safeName = titleFromSlug(input.rootName)

  return {
    id: createId(),
    name: safeName,
    slug: slugify(input.rootName),
    source: input.source,
    repoPath: input.source === 'sample' ? `launchdeck/${slugify(input.rootName)}` : input.rootName,
    updatedAt: new Date().toISOString(),
    health,
    healthDetail:
      health === 'healthy'
        ? 'All local checks passing'
        : health === 'degraded'
          ? 'Needs dependency or secret review'
          : 'Ready for first review',
    runtime,
    stack,
    scripts,
    files: input.files,
    security: buildSecurityChecks({ hasLockfile, hasLicense, hasReadme, secrets: secrets.length }),
    activity: [
      {
        label: 'Imported workspace',
        detail: `${input.files.length} safe text files indexed locally`,
        time: 'now',
      },
      {
        label: 'Sandbox preview prepared',
        detail: 'Scripts are blocked until enabled',
        time: 'now',
      },
    ],
  }
}

export function createPreviewDocument(
  project: Project,
  activeFilePath: string,
  allowScripts = false,
): string {
  const entry = findPreviewEntry(project.files)
  const csp = allowScripts
    ? "default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:;"
    : "default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; script-src 'none'; font-src data:;"

  if (entry) {
    const html = inlineLocalStyles(project.files, entry)
    const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`
    const notice = allowScripts
      ? ''
      : '<div style="position:fixed;right:12px;bottom:12px;background:#06131f;color:#dbeafe;border:1px solid #1e3a5f;border-radius:8px;padding:8px 10px;font:12px system-ui;z-index:9999;">Safe preview: scripts blocked</div>'

    if (/<head[^>]*>/i.test(html)) {
      const withMeta = html.replace(/<head([^>]*)>/i, `<head$1>${meta}`)
      return /<\/body>/i.test(withMeta)
        ? withMeta.replace(/<\/body>/i, `${notice}</body>`)
        : `${withMeta}${notice}`
    }

    return `<!doctype html><html><head>${meta}</head><body>${html}${notice}</body></html>`
  }

  const activeFile = project.files.find((file) => file.path === activeFilePath) ?? project.files[0]
  const readme = project.files.find((file) => file.name.toLowerCase().startsWith('readme'))
  const body = readme
    ? markdownToPreview(readme.content)
    : `<pre>${escapeHtml(activeFile.content)}</pre>`

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #f8fafc; }
      main { max-width: 760px; margin: 0 auto; padding: 42px 28px 64px; }
      h1 { font-size: 34px; line-height: 1.05; margin: 0 0 16px; }
      p { color: #475569; line-height: 1.65; }
      pre { overflow: auto; padding: 18px; border-radius: 10px; background: #0b1220; color: #dbeafe; font-size: 13px; line-height: 1.6; }
      .tag { display: inline-flex; margin-bottom: 18px; padding: 5px 9px; border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <span class="tag">LaunchDeck sandbox preview</span>
      ${body}
    </main>
  </body>
</html>`
}

function inlineLocalStyles(files: ProjectFile[], entry: ProjectFile): string {
  return entry.content.replace(
    /<link\s+([^>]*?)href=["']([^"']+\.css)["']([^>]*)>/gi,
    (_match, before: string, href: string, after: string) => {
      const cssPath = resolveRelativePath(entry.path, href)
      const cssFile = files.find((file) => file.path === cssPath || file.path.endsWith(`/${href}`))

      if (!cssFile) {
        return `<link ${before}href="${escapeHtml(href)}"${after}>`
      }

      return `<style data-launchdeck-inline="${escapeHtml(cssFile.path)}">${cssFile.content}</style>`
    },
  )
}

function findPreviewEntry(files: ProjectFile[]): ProjectFile | undefined {
  return (
    files.find((file) => file.path.toLowerCase() === 'index.html') ??
    files.find((file) => file.path.toLowerCase().endsWith('/index.html'))
  )
}

function resolveRelativePath(fromPath: string, href: string): string {
  if (href.startsWith('/') || href.startsWith('http')) return normalizeProjectPath(href)
  const base = fromPath.split('/').slice(0, -1)
  return normalizeProjectPath([...base, href].join('/'))
}

function detectScripts(packageJson?: ProjectFile): ProjectScript[] {
  if (!packageJson) return []

  try {
    const parsed = JSON.parse(packageJson.content) as { scripts?: Record<string, string> }

    return Object.entries(parsed.scripts ?? {})
      .slice(0, 6)
      .map(([name, command]) => ({ name, command }))
  } catch {
    return []
  }
}

function detectStack(files: ProjectFile[], packageJson?: ProjectFile): string[] {
  const stack = new Set<string>()
  const paths = files.map((file) => file.path.toLowerCase())

  if (paths.some((path) => path.endsWith('.tsx') || path.endsWith('.ts'))) stack.add('TypeScript')
  if (paths.some((path) => path.endsWith('.html'))) stack.add('HTML')
  if (paths.some((path) => path.endsWith('.css') || path.endsWith('.scss'))) stack.add('CSS')

  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson.content) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const deps = { ...parsed.dependencies, ...parsed.devDependencies }

      if (deps.next) stack.add('Next.js')
      if (deps.vite) stack.add('Vite')
      if (deps.react) stack.add('React')
      if (deps.vue) stack.add('Vue')
      if (deps.tailwindcss) stack.add('Tailwind')
      if (deps.typescript) stack.add('TypeScript')
      if (deps.express || deps.fastify) stack.add('Node.js')
    } catch {
      stack.add('package.json review')
    }
  }

  if (stack.size === 0) stack.add('Static')

  return Array.from(stack).slice(0, 6)
}

function inferRuntime(stack: string[], packageJson?: ProjectFile): string {
  if (stack.includes('Next.js')) return 'Next.js'
  if (stack.includes('Vite')) return stack.includes('TypeScript') ? 'Vite + TS' : 'Vite'
  if (stack.includes('Node.js')) return 'Node.js'
  if (packageJson) return 'npm workspace'
  return 'Static preview'
}

function determineHealth(input: {
  hasLockfile: boolean
  secrets: number
  skipped: number
}): ProjectHealth {
  if (input.secrets > 0) return 'degraded'
  if (!input.hasLockfile || input.skipped > 24) return 'review'
  return 'healthy'
}

function buildSecurityChecks(input: {
  hasLockfile: boolean
  hasLicense: boolean
  hasReadme: boolean
  secrets: number
}): SecurityCheck[] {
  return [
    {
      label: 'Dependencies',
      state: input.hasLockfile ? 'pass' : 'warn',
      detail: input.hasLockfile ? 'Lockfile detected' : 'No lockfile in import',
    },
    {
      label: 'Secrets',
      state: input.secrets === 0 ? 'pass' : 'warn',
      detail: input.secrets === 0 ? 'No obvious secrets found' : `${input.secrets} possible secret pattern(s)`,
    },
    {
      label: 'License',
      state: input.hasLicense ? 'pass' : 'neutral',
      detail: input.hasLicense ? 'License file found' : 'No license file yet',
    },
    {
      label: 'README',
      state: input.hasReadme ? 'pass' : 'neutral',
      detail: input.hasReadme ? 'README found' : 'Add setup docs',
    },
  ]
}

function findPotentialSecrets(files: ProjectFile[]): ProjectFile[] {
  const secretPattern =
    /(ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_\-.]{16,})/i

  return files.filter((file) => secretPattern.test(file.content) && !file.path.endsWith('.env.example'))
}

function buildWarnings(files: ProjectFile[], skippedFiles: SkippedFile[]): string[] {
  const warnings: string[] = []

  if (!files.some((file) => file.name.toLowerCase().startsWith('readme'))) {
    warnings.push('No README detected. Add onboarding docs before publishing.')
  }

  if (skippedFiles.length > 0) {
    warnings.push(`${skippedFiles.length} file(s) were skipped for safety or size limits.`)
  }

  if (findPotentialSecrets(files).length > 0) {
    warnings.push('Potential secret-like strings were found. Review before committing.')
  }

  return warnings
}

function findFile(files: ProjectFile[], fileName: string): ProjectFile | undefined {
  return files.find((file) => file.name.toLowerCase() === fileName.toLowerCase())
}

function inferRootName(paths: string[]): string {
  const firstSegments = paths.filter((path) => path.includes('/')).map((path) => path.split('/')[0])
  const common = firstSegments[0]

  if (common && firstSegments.length === paths.length && firstSegments.every((segment) => segment === common)) {
    return common
  }

  const packagePath = paths.find((path) => path.endsWith('package.json'))
  if (packagePath) return packagePath.split('/').at(-2) ?? 'imported-project'

  return 'imported-project'
}

function stripRoot(path: string, rootName: string): string {
  return path.startsWith(`${rootName}/`) ? path.slice(rootName.length + 1) : path
}

function getZipEntrySize(entry: unknown): number {
  const zipEntry = entry as { _data?: { uncompressedSize?: unknown } }
  const size = zipEntry._data?.uncompressedSize

  return typeof size === 'number' && Number.isFinite(size) ? size : 0
}

function titleFromSlug(value: string): string {
  return value
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Imported Project'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
  )
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function markdownToPreview(markdown: string): string {
  const lines = markdown.split('\n')
  const html = lines
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`
      if (!line.trim()) return ''
      return `<p>${escapeHtml(line)}</p>`
    })
    .join('')

  return html || '<p>No previewable content yet.</p>'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
