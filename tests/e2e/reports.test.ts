import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('Report Builder', () => {
  test('should create and run a custom report', async ({ page }) => {
    await page.goto('/reports/builder')
    
    const reportName = `Test Report ${Date.now()}`
    
    // Fill report details
    const nameInput = page.getByLabel('Report Name')
    await expect(nameInput).toBeVisible({ timeout: 15000 })
    await nameInput.fill(reportName)
    
    // Select Data Source
    await page.getByLabel('Data Source').click()
    await page.getByRole('option', { name: 'Inventory' }).click()

    // Select Columns
    // Using a more reliable way to find the button
    await page.locator('button').filter({ hasText: 'Select columns' }).click()
    await page.getByRole('option', { name: 'SKU' }).click()
    await page.getByRole('option', { name: 'Name' }).click()
    await page.keyboard.press('Escape')

    // Run Report
    await page.getByRole('button', { name: 'Run Report' }).click()

    // Verify results
    // Wait for the table to contain at least header + 1 row
    await expect(page.locator('table tr').nth(1)).toBeVisible({ timeout: 15000 })
    
    // Check for specific headers
    await expect(page.getByRole('columnheader', { name: 'Sku' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()

    // Save Report
    await page.getByRole('button', { name: 'Save Report' }).click()

    // Verify success toast and redirection
    await expect(page.getByText('Report saved successfully').first()).toBeVisible()
    await expect(page).toHaveURL('/reports')
    await expect(page.getByText(reportName).first()).toBeVisible()
  })
})
