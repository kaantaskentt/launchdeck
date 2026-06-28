import { expect, test } from '@playwright/test'
import axeCore from 'axe-core'

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
