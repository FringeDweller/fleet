import { expect, type Page } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/login')
  
  // Wait for the form to be stable
  await page.waitForLoadState('networkidle')
  
  await page.getByLabel('Email').fill('admin@fleet.com')
  await page.getByLabel('Password').fill('admin123')
  
  // Small delay before clicking
  await page.waitForTimeout(500)
  
  await page.getByRole('button', { name: 'Sign In' }).click()
  
  // Wait for redirect and dashboard heading
  await expect(page).toHaveURL('/', { timeout: 20000 })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 })
}
