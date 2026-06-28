import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPreviewDocument,
  importGitHubRepository,
  importFileList,
  isTextProjectFile,
  normalizeProjectPath,
  parseGitHubRepo,
} from './projectImport'

describe('project import safety', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes unsafe project paths', () => {
    expect(normalizeProjectPath('../demo/\u0000src/<App>.tsx')).toBe('demo/src/-App-.tsx')
  })

  it('accepts only small text project files', () => {
    expect(isTextProjectFile('src/App.tsx', 1_024)).toBe(true)
    expect(isTextProjectFile('assets/logo.png', 1_024)).toBe(false)
    expect(isTextProjectFile('README.md', 500_000)).toBe(false)
  })

  it('parses common GitHub repository inputs', () => {
    expect(parseGitHubRepo('https://github.com/owner/repo')).toEqual({ owner: 'owner', name: 'repo' })
    expect(parseGitHubRepo('github.com/owner/repo')).toEqual({ owner: 'owner', name: 'repo' })
    expect(parseGitHubRepo('owner/repo')).toEqual({ owner: 'owner', name: 'repo' })
    expect(parseGitHubRepo('git@github.com:owner/repo.git')).toEqual({ owner: 'owner', name: 'repo' })
    expect(parseGitHubRepo('not a repo')).toBeNull()
  })

  it('imports text files and flags secret-like content', async () => {
    const files = [
      new File(['{"scripts":{"dev":"vite"},"dependencies":{"vite":"latest"}}'], 'package.json', {
        type: 'application/json',
      }),
      new File(['# Demo'], 'README.md', { type: 'text/markdown' }),
      new File(['export const API_KEY = "1234567890abcdef1234"'], 'config.ts', { type: 'text/plain' }),
    ]

    const { project, report } = await importFileList(files)

    expect(project.files).toHaveLength(3)
    expect(project.scripts[0]).toEqual({ name: 'dev', command: 'vite' })
    expect(project.security.find((check) => check.label === 'Secrets')?.state).toBe('warn')
    expect(report.warnings.join(' ')).toContain('Potential secret-like strings')
  })

  it('imports a public GitHub zip response', async () => {
    const zip = new JSZip()
    zip.file('github-demo-main/package.json', '{"scripts":{"dev":"vite"},"dependencies":{"vite":"latest"}}')
    zip.file('github-demo-main/README.md', '# GitHub Demo')
    const archive = await zip.generateAsync({ type: 'arraybuffer' })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(archive, { status: 200, headers: { 'content-type': 'application/zip' } })),
    )

    const { project, report } = await importGitHubRepository('github.com/acme/github-demo')

    expect(project.name).toBe('github-demo')
    expect(project.repoPath).toBe('acme/github-demo')
    expect(report.rootName).toBe('github-demo')
    expect(project.files.map((file) => file.name)).toEqual(['package.json', 'README.md'])
  })

  it('renders previews without script permissions by default', () => {
    const document = createPreviewDocument(
      {
        id: 'demo',
        name: 'demo',
        slug: 'demo',
        source: 'sample',
        repoPath: 'demo/demo',
        updatedAt: new Date().toISOString(),
        health: 'healthy',
        healthDetail: 'ok',
        runtime: 'Static',
        stack: ['HTML'],
        scripts: [],
        files: [
          {
            path: 'index.html',
            name: 'index.html',
            content: '<html><head></head><body><script>window.evil = true</script><h1>Demo</h1></body></html>',
            size: 92,
            language: 'HTML',
            lastModified: Date.now(),
          },
        ],
        security: [],
        activity: [],
      },
      'index.html',
      false,
    )

    expect(document).toContain("script-src 'none'")
    expect(document).toContain('Safe preview: scripts blocked')
  })
})
