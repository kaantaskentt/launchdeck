import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function fileWithPath(content: string, name: string, relativePath: string, type = 'text/plain') {
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath })
  return file
}

describe('LaunchDeck app', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the project cockpit and opens the workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('LaunchDeck')).toBeInTheDocument()
    expect(screen.getByText('Import your project to get started')).toBeInTheDocument()
    expect(screen.getAllByText('launchdeck-web').length).toBeGreaterThan(0)

    await user.click(screen.getByLabelText('Open launchdeck-web workspace'))

    expect(screen.getByLabelText('launchdeck-web coding workspace')).toBeInTheDocument()
    expect(screen.getByLabelText('File explorer')).toBeInTheDocument()
    expect(screen.getByLabelText('Live preview')).toBeInTheDocument()
  })

  it('opens project switching from the command palette', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('Press ⌘K to open command palette'))

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open api-server' }))

    expect(screen.getByLabelText('api-server coding workspace')).toBeInTheDocument()
  })

  it('imports a local folder and opens the imported workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    const files = [
      fileWithPath(
        '{"scripts":{"dev":"vite"},"dependencies":{"react":"latest","vite":"latest"}}',
        'package.json',
        'demo-app/package.json',
        'application/json',
      ),
      fileWithPath('# Demo App', 'README.md', 'demo-app/README.md', 'text/markdown'),
      fileWithPath('<h1>Demo App</h1>', 'index.html', 'demo-app/index.html', 'text/html'),
    ]

    await user.upload(screen.getByLabelText('Import folder'), files)

    expect(await screen.findByLabelText('Demo App coding workspace')).toBeInTheDocument()
    expect(screen.getByText('Imported 3 files from demo-app.')).toBeInTheDocument()
    expect(screen.getAllByText('Demo App').length).toBeGreaterThan(0)
  })

  it('imports a zip file and reports invalid GitHub input', async () => {
    const user = userEvent.setup()
    const zip = new JSZip()
    zip.file('zip-demo/package.json', '{"scripts":{"build":"vite build"},"dependencies":{"vite":"latest"}}')
    zip.file('zip-demo/README.md', '# Zip Demo')
    const blob = await zip.generateAsync({ type: 'blob' })
    const zipFile = new File([blob], 'zip-demo.zip', { type: 'application/zip' })

    render(<App />)

    await user.upload(screen.getByLabelText('Import zip'), zipFile)
    expect(await screen.findByLabelText('Zip Demo coding workspace')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('GitHub repository URL'))
    await user.type(screen.getByLabelText('GitHub repository URL'), 'not a repo')
    await user.click(screen.getByRole('button', { name: 'Import' }))

    expect(await screen.findByText('Enter a GitHub URL like https://github.com/owner/repo.')).toBeInTheDocument()
  })

  it('imports a mocked public GitHub repo zip', async () => {
    const user = userEvent.setup()
    const zip = new JSZip()
    zip.file('github-demo-main/package.json', '{"scripts":{"dev":"vite"},"dependencies":{"vite":"latest"}}')
    zip.file('github-demo-main/README.md', '# GitHub Demo')
    const archive = await zip.generateAsync({ type: 'arraybuffer' })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(archive, { status: 200, headers: { 'content-type': 'application/zip' } })),
    )

    render(<App />)

    await user.type(screen.getByLabelText('GitHub repository URL'), 'github.com/acme/github-demo')
    await user.click(screen.getByRole('button', { name: 'Import' }))

    expect(await screen.findByLabelText('github-demo coding workspace')).toBeInTheDocument()
    expect(screen.getAllByText('acme/github-demo').length).toBeGreaterThan(0)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/github-demo/zipball',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'application/vnd.github+json' }),
      }),
    )
  })

  it('makes table, inspector, and workspace controls respond', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Grid view' }))
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true')

    await user.selectOptions(screen.getByLabelText('Filter projects'), 'review')
    expect(screen.getByRole('table', { name: 'Imported projects' })).toHaveTextContent('api-server')
    expect(screen.getByRole('table', { name: 'Imported projects' })).not.toHaveTextContent('design-system')

    await user.click(screen.getByRole('button', { name: 'View all projects' }))
    await user.click(screen.getByRole('button', { name: 'More actions for api-server' }))
    await user.click(screen.getByRole('menuitem', { name: 'Open workspace' }))

    expect(screen.getByLabelText('api-server coding workspace')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Checks' }))
    expect(screen.getByText('Security & Quality')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Star project' }))
    expect(screen.getByRole('button', { name: 'Star project' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(screen.getByText('Preview refreshed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close tab' }))
    expect(screen.getByRole('button', { name: 'Reopen file' })).toBeInTheDocument()
  })
})
