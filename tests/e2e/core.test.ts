import { expect, test } from '@playwright/test'

test.describe('Fleet Management Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@fleet.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/')
  })

  test('Inventory - should list parts', async ({ page }) => {
    await page.goto('/inventory')
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('Maintenance - should show calendar', async ({ page }) => {
    await page.goto('/maintenance-schedules')
    await expect(page.getByRole('heading', { name: 'Maintenance Schedules' })).toBeVisible()
  })

  test('Fuel - should show analytics', async ({ page }) => {
    // Navigate to an asset first to see fuel analytics
    await page.goto('/assets')
    await page.locator('tbody tr').first().locator('a').click()
    await page.getByRole('tab', { name: 'Fuel' }).click()
    await expect(page.getByText('Fuel History')).toBeVisible()
  })

  test('Inspections - should list inspections', async ({ page }) => {
    await page.goto('/inspections')
    await expect(page.getByRole('heading', { name: 'Inspection History' })).toBeVisible()
  })
})
