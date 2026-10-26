import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { signIn, signUp } from './helpers'

// Uses the local SMTP sink (scripts/local-smtp-sink.mjs) that stores emails in .local/mail.
const MAIL_DIR = path.resolve('.local/mail')

function latestMailTo(email: string, since: number): string | null {
  const files = readdirSync(MAIL_DIR)
    .map((f) => path.join(MAIL_DIR, f))
    .filter((f) => statSync(f).mtimeMs >= since)
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  for (const f of files) {
    const raw = readFileSync(f, 'utf8')
    if (raw.includes(email)) return raw.replace(/=\r?\n/g, '').replace(/=3D/g, '=')
  }
  return null
}

test('a merchant can reset a forgotten password', async ({ page, baseURL }) => {
  const email = `reset-${Date.now().toString(36)}@e2e.local`
  await signUp(page, email)
  await page.context().clearCookies()

  const since = Date.now()
  await page.goto('/forgot-password')
  await page.getByLabel('מייל').fill(email)
  await page.getByRole('button', { name: 'שליחת קישור' }).click()
  await expect(page.getByText('בדקו את תיבת המייל')).toBeVisible()

  let mail: string | null = null
  await expect.poll(() => (mail = latestMailTo(email, since)), { timeout: 15_000 }).not.toBeNull()
  const link = /https?:\/\/[^\s"<>]+\/verify\?[^\s"<>]+/.exec(mail!)?.[0]
  expect(link).toBeTruthy()
  // The verify endpoint redirects to NEXT_PUBLIC_SITE_URL; point it at the server under test.
  const verify = new URL(link!.replace(/&amp;/g, '&'))
  // Local GoTrue omits the /auth/v1 prefix of the hosted layout in email links.
  if (!verify.pathname.startsWith('/auth/v1')) verify.pathname = `/auth/v1${verify.pathname}`
  const redirectTo = new URL(verify.searchParams.get('redirect_to')!)
  verify.searchParams.set('redirect_to', `${baseURL}${redirectTo.pathname}${redirectTo.search}`)
  await page.goto(verify.toString())
  await page.waitForURL('**/reset-password')

  await page.getByLabel('סיסמה חדשה').fill('NewPass456!')
  await page.getByLabel('שוב, לאימות').fill('NewPass456!')
  await page.getByRole('button', { name: 'שמירת הסיסמה' }).click()
  await page.waitForURL(/\/(dashboard|onboarding)/)

  await page.context().clearCookies()
  await signIn(page, email, 'NewPass456!')
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
})
