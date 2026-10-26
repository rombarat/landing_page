import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Browser, type Page } from '@playwright/test'
import postgres from 'postgres'

export const FIXTURES = path.resolve('tests/fixtures/products')

export function db() {
  const url = process.env.DATABASE_URL ?? /^DATABASE_URL=(.*)$/m.exec(readFileSync('.env.local', 'utf8'))?.[1]
  return postgres(url!, { max: 1, onnotice: () => {} })
}

/** A fresh browser context per customer, each with its own client IP. */
export async function customerPage(browser: Browser, viewport = { width: 390, height: 844 }) {
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`
  const ctx = await browser.newContext({ viewport, extraHTTPHeaders: { 'x-forwarded-for': ip } })
  return ctx.newPage()
}

export async function signUp(page: Page, email: string, password = 'TestPass123!') {
  await page.goto('/signup')
  await page.getByLabel('מייל').fill(email)
  await page.getByLabel('סיסמה').fill(password)
  await page.getByRole('button', { name: 'יצירת חשבון' }).click()
  await page.waitForURL('**/onboarding')
}

export async function signIn(page: Page, email: string, password = 'TestPass123!') {
  await page.goto('/login')
  await page.getByLabel('מייל').fill(email)
  await page.getByLabel('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות' }).click()
  await page.waitForURL(/\/(dashboard|onboarding)/)
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(1)
}
