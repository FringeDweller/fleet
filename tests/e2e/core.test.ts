import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('Fleet Management Core Features', () => {
  test('Inventory - should list parts', async ({ page }) => {
    await page.goto('/inventory')
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible({ timeout: 15000 })
    
    // Wait for the first data row (excluding separators) and ensure it has content
    const firstRow = page.locator('tbody tr:not([data-slot="separator"])').first()
    await expect(firstRow).toBeVisible({ timeout: 15000 })
    await expect(firstRow).not.toHaveText('No data', { timeout: 10000 })
  })

  test('Maintenance - should show calendar', async ({ page }) => {
    await page.goto('/maintenance-schedules')
    await expect(page.getByRole('heading', { name: 'Maintenance Schedules' })).toBeVisible({ timeout: 15000 })
  })

  test('Fuel - should show analytics', async ({ page }) => {
    // Navigate to an asset first to see fuel analytics
    await page.goto('/assets')
    
    // Wait for a row with "active" status to appear (robust wait)
    const row = page.locator('tr', { has: page.getByText('active') }).first()
    await expect(row).toBeVisible({ timeout: 20000 })
    
    await row.getByRole('link').first().click({ force: true })
    
    await page.getByRole('tab', { name: 'Fuel' }).click()
    await expect(page.getByText('Fuel History')).toBeVisible({ timeout: 15000 })
  })

  test('Inspections - should list inspections', async ({ page }) => {
    await page.goto('/inspections')
    await expect(page.getByRole('heading', { name: 'Inspection History' })).toBeVisible({ timeout: 15000 })
  })
})
