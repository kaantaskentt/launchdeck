import { expect, test } from '@playwright/test'
import axeCore from 'axe-core'
import JSZip from 'jszip'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

test('dashboard to workspace flow works', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Import your project to get started' })).toBeVisible()
  await expect(page.getByText('launchdeck-web').first()).toBeVisible()

  await page.getByLabel('Open launchdeck-web workspace').click()

  await expect(page.getByLabel('launchdeck-web coding workspace')).toBeVisible()
  await expect(page.getByLabel('File explorer')).toBeVisible()
  await expect(page.getByLabel('Live preview')).toBeVisible()
  await expect(page.frameLocator('iframe[title="launchdeck-web preview"]').getByText('LaunchDeck').first()).toBeVisible()
})

test('command palette opens and has no serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Press ⌘K to open command palette').click()

  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()

  await page.addScriptTag({ content: axeCore.source })
  const results = await page.evaluate(async () => {
    return window.axe.run(document, {
      rules: {
        'color-contrast': { enabled: false },
      },
    })
  })

  expect(results.violations).toEqual([])
})

test('imports a local folder and supports workspace editing controls', async ({ page }) => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'launchdeck-folder-'))
  const projectRoot = path.join(tempRoot, 'folder-demo')

  await mkdir(projectRoot, { recursive: true })
  await writeFile(path.join(projectRoot, 'package.json'), '{"scripts":{"dev":"vite"},"dependencies":{"vite":"latest","react":"latest"}}')
  await writeFile(path.join(projectRoot, 'README.md'), '# Folder Demo')
  await writeFile(path.join(projectRoot, 'index.html'), '<h1>Folder Demo</h1>')

  await page.goto('/')
  await page.locator('input[aria-label="Import folder"]').setInputFiles(projectRoot)

  await expect(page.getByLabel('Folder Demo coding workspace')).toBeVisible()
  await expect(page.getByText('Imported 3 files from folder-demo.')).toBeVisible()

  await page.getByRole('button', { name: 'README.md' }).click()
  const editor = page.getByLabel('README.md editor')
  await expect(editor).toBeVisible()
  await editor.fill('# Folder Demo\n\nEdited locally')
  await page.getByRole('button', { name: 'Save locally' }).click()
  await expect(page.getByText('Saved locally')).toBeVisible()

  await page.getByRole('button', { name: 'Refresh' }).click()
  await expect(page.getByText('Preview refreshed')).toBeVisible()

  await rm(tempRoot, { recursive: true, force: true })
})

test('imports zip and mocked GitHub repos', async ({ page }) => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'launchdeck-zip-'))
  const zipPath = path.join(tempRoot, 'zip-demo.zip')
  const zip = new JSZip()
  zip.file('zip-demo/package.json', '{"scripts":{"build":"vite build"},"dependencies":{"vite":"latest"}}')
  zip.file('zip-demo/README.md', '# Zip Demo')
  await writeFile(zipPath, await zip.generateAsync({ type: 'nodebuffer' }))

  const githubZip = new JSZip()
  githubZip.file('github-demo-main/package.json', '{"scripts":{"dev":"vite"},"dependencies":{"vite":"latest"}}')
  githubZip.file('github-demo-main/README.md', '# GitHub Demo')
  const githubZipBody = await githubZip.generateAsync({ type: 'nodebuffer' })

  await page.route('https://api.github.com/repos/acme/github-demo/zipball', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/zip',
      body: githubZipBody,
    })
  })

  await page.goto('/')
  await page.locator('input[aria-label="Import zip"]').setInputFiles(zipPath)
  await expect(page.getByLabel('Zip Demo coding workspace')).toBeVisible()

  await page.getByLabel('GitHub repository URL').fill('github.com/acme/github-demo')
  await page.locator('.github-import').getByRole('button', { name: 'Import' }).click()

  await expect(page.getByLabel('github-demo coding workspace')).toBeVisible()
  await expect(page.getByLabel('github-demo inspector').getByText('acme/github-demo')).toBeVisible()

  await rm(tempRoot, { recursive: true, force: true })
})

test('table and inspector controls expose real state', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Grid view' }).click()
  await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByLabel('Filter projects').selectOption('review')
  await expect(page.getByRole('table', { name: 'Imported projects' })).toContainText('api-server')
  await expect(page.getByRole('table', { name: 'Imported projects' })).not.toContainText('design-system')

  await page.getByRole('button', { name: 'View all projects' }).click()
  await page.getByRole('button', { name: 'More actions for api-server' }).click()
  await page.getByRole('menuitem', { name: 'Open workspace' }).click()
  await expect(page.getByLabel('api-server coding workspace')).toBeVisible()

  await page.getByRole('tab', { name: 'Checks' }).click()
  await expect(page.getByText('Security & Quality')).toBeVisible()

  await page.getByRole('button', { name: 'Star project' }).click()
  await expect(page.getByRole('button', { name: 'Star project' })).toHaveAttribute('aria-pressed', 'true')
})
