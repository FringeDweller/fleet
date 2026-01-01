import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('Assets', () => {
  test('should list assets', async ({ page }) => {
    await page.goto('/assets')
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible({ timeout: 10000 })

    // Check if table has data (at least header + 1 row)
    await expect(page.locator('table tr').nth(1)).toBeVisible({ timeout: 10000 })
  })

  test('should view asset details', async ({ page }) => {
    await page.goto('/assets')

    // Wait for a row with "active" status to appear
    // This implies data is loaded and we are looking at a real asset
    const row = page.locator('tr', { has: page.getByText('active') }).first()
    await expect(row).toBeVisible({ timeout: 20000 })

    // Click on the action link in this row
    const actionLink = row.getByRole('link').first()
    await actionLink.click({ force: true })

    // Should be on asset detail page
    await expect(page).toHaveURL(/\/assets\/.+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
