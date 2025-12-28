import { test, expect } from '@playwright/test'

test.describe('Assets', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@fleet.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/')
  })

  test('should list assets', async ({ page }) => {
    await page.goto('/assets')
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible()
    
    // Check if table has data (assuming seeded data)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should view asset details', async ({ page }) => {
    await page.goto('/assets')
    
    // Click on the first asset link (assuming it exists)
    const firstAssetLink = page.locator('tbody tr').first().locator('a')
    await firstAssetLink.click()
    
    // Should be on asset detail page
    await expect(page).toHaveURL(/\/assets\/.+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
