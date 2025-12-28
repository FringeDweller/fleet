import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in credentials
    await page.getByLabel('Email').fill('admin@fleet.com')
    await page.getByLabel('Password').fill('admin123')
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel('Email').fill('wrong@fleet.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show error toast
    await expect(page.getByText('Failed to login')).toBeVisible()
  })
})
