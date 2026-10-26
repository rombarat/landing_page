/**
 * The MVP scenario end to end, against real Auth, Postgres (RLS) and storage:
 * register → business → bulk photos → names/prices → template → preview → publish
 * → anonymous order → merchant manages it → price edit reaches the storefront
 * → a second merchant is isolated → trial expiry and manual activation.
 */
import { expect, test, type Page } from '@playwright/test'
import { customerPage, db, expectNoHorizontalScroll, FIXTURES, signIn, signUp } from './helpers'

test.describe.configure({ mode: 'serial' })

const run = Date.now().toString(36)
const merchantA = `a-${run}@e2e.local`
const merchantB = `b-${run}@e2e.local`
const adminEmail = `admin-${run}@e2e.local`
let storeUrl = ''
let orderId = ''
let productSlug = ''

async function placeOrder(page: Page, url: string, productName: string, customer: string) {
  await page.goto(url)
  await page.getByRole('link', { name: productName }).first().click()
  await page.waitForURL('**/products/**')
  await page.getByRole('button', { name: 'הוספה לעגלה' }).click()
  await page.goto(`${url}/cart`)
  await page.getByRole('link', { name: 'להמשך ההזמנה' }).click()
  await page.getByLabel('שם מלא').fill(customer)
  await page.getByLabel('טלפון').fill('052-7654321')
  await page.getByLabel('הערות להזמנה').fill('בלי אגוזים בבקשה')
  await page.waitForTimeout(2600) // the form rejects bot-fast submissions
  const submit = page.getByRole('button', { name: 'שליחת ההזמנה' })
  await submit.click()
  await page.waitForURL('**/order-success**')
}

test('1–7: merchant A builds and publishes a store from photos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signUp(page, merchantA)

  await page.getByLabel('שם העסק').fill('העוגות של לינוי')
  await page.getByText('מאפה ועוגות').click()
  await page.getByLabel('טלפון ליצירת קשר').fill('050-1234567')
  await expect(page.getByText('הכתובת פנויה')).toBeVisible()
  await page.getByRole('button', { name: 'להמשיך למוצרים' }).click()
  await page.waitForURL('**/onboarding/products')

  await page.locator('[data-testid=product-files]').setInputFiles(
    ['chocolate-cake', 'cheesecake', 'cupcakes', 'cookies'].map((f) => `${FIXTURES}/${f}.jpg`),
  )
  const cards = page.locator('[data-testid=product-card]')
  await expect(cards).toHaveCount(4)
  await expect(page.locator('[data-testid=product-card] input[id^=name-]:not([disabled])')).toHaveCount(4, { timeout: 60_000 })

  // Group the last two photos into one product.
  await cards.nth(2).getByRole('checkbox').check()
  await cards.nth(3).getByRole('checkbox').check()
  await page.getByRole('button', { name: 'איחוד למוצר אחד' }).click()
  await expect(cards).toHaveCount(3)
  await expect(cards.nth(2).locator('img[alt=""]')).toHaveCount(2)

  const data = [
    ['עוגת שוקולד ודובדבנים', '180'],
    ['עוגת גבינה', '160'],
    ['מארז מתוקים', '45'],
  ]
  for (const [i, [name, price]] of data.entries()) {
    await cards.nth(i).getByLabel('שם המוצר').fill(name!)
    await cards.nth(i).getByLabel('מחיר').fill(price!)
    await cards.nth(i).getByLabel('מחיר').blur()
    await expect(cards.nth(i).getByText('נשמר')).toBeVisible()
  }
  await cards.nth(0).getByRole('button', { name: '+ הוספת תיאור' }).click()
  await cards.nth(0).getByLabel('תיאור').fill('שוקולד מריר, קרם וניל ודובדבנים טריים.')
  await cards.nth(0).getByLabel('תיאור').blur()
  await expect(page.getByText('3 מוכנים לחנות')).toBeVisible()

  await page.getByRole('button', { name: 'לראות את החנות' }).click()
  await page.waitForURL('**/onboarding/design')
  await page.getByRole('button', { name: /בוטיק/ }).click()
  await expect(page.getByRole('status').filter({ hasText: /^\s*נשמר\s*$/ }).locator('visible=true')).toBeVisible()
  await page.getByRole('tab', { name: 'איך זה נראה' }).click()
  const preview = page.frameLocator('iframe[title="תצוגה מקדימה של החנות"]')
  await expect(preview.getByText('עוגת שוקולד ודובדבנים').first()).toBeVisible()

  await page.getByRole('link', { name: 'נראה טוב, להמשיך' }).first().click()
  await page.waitForURL('**/onboarding/publish')
  await page.getByLabel('כתובת לאיסוף').fill('רעננה')
  await page.getByRole('button', { name: 'פרסום החנות שלי' }).click()
  await page.waitForURL('**/onboarding/live')
  await expect(page.getByRole('heading', { name: /באוויר/ })).toBeVisible()
  storeUrl = (await page.getByTestId('store-url').textContent())!.trim()
  expect(storeUrl).toMatch(/\/s\/[a-z0-9-]+$/)
})

test('8–10: an anonymous customer browses and places an order', async ({ browser }) => {
  const page = await customerPage(browser)
  const path = new URL(storeUrl).pathname
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('העוגות של לינוי')
  await expectNoHorizontalScroll(page)
  await page.getByRole('link', { name: 'עוגת שוקולד ודובדבנים' }).first().click()
  await page.waitForURL('**/products/**')
  productSlug = page.url().split('/products/')[1]!
  await expect(page.getByText('שוקולד מריר, קרם וניל')).toBeVisible()
  await page.getByRole('button', { name: 'הוספה לעגלה' }).click()
  await expect(page.getByText('נוסף לעגלה')).toBeVisible()
  await page.goto(`${path}/cart`)
  await page.getByRole('button', { name: 'הוספה' }).click() // quantity 2
  await expect(page.getByText(/360/).first()).toBeVisible()
  await page.getByRole('link', { name: 'להמשך ההזמנה' }).click()
  await expect(page.getByText('אין תשלום באתר.')).toBeVisible()
  await page.getByLabel('שם מלא').fill('דנה כהן')
  await page.getByLabel('טלפון').fill('052-7654321')
  await page.getByLabel('הערות להזמנה').fill('כיתוב: מזל טוב')
  await page.waitForTimeout(2600)
  await page.getByRole('button', { name: 'שליחת ההזמנה' }).click()
  await page.waitForURL('**/order-success**')
  await expect(page.getByText(/#1001/)).toBeVisible()
  await expect(page.getByText('לא בוצע תשלום באתר.')).toBeVisible()
  await page.context().close()
})

test('11–15: merchant A manages the order and edits a price', async ({ page, browser }) => {
  await signIn(page, merchantA)
  await page.goto('/dashboard/orders')
  const row = page.getByTestId('order-list').getByRole('link').first()
  await expect(row).toContainText('דנה כהן')
  await row.click()
  orderId = page.url().split('/dashboard/orders/')[1]!
  await expect(page.getByText('כיתוב: מזל טוב')).toBeVisible()
  await expect(page.getByText('2×')).toBeVisible()
  await page.getByRole('button', { name: 'אישור ההזמנה' }).click()
  await expect(page.getByRole('button', { name: 'התחלת הכנה' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('שינוי סטטוס')).toHaveValue('confirmed')

  await page.goto('/dashboard/products')
  const card = page.locator('[data-testid=product-card]').filter({ has: page.locator('input[value="עוגת שוקולד ודובדבנים"]') })
  await card.getByLabel('מחיר').fill('195')
  await card.getByLabel('מחיר').blur()
  await expect(card.getByText('נשמר')).toBeVisible()

  const customer = await customerPage(browser)
  await customer.goto(`${new URL(storeUrl).pathname}/products/${productSlug}`)
  await expect(customer.getByText(/195/).first()).toBeVisible()
  await customer.context().close()
})

test('16–17: merchant B cannot see or touch merchant A’s data', async ({ page }) => {
  await signUp(page, merchantB)
  await page.getByLabel('שם העסק').fill('קרמיקה של דנה')
  await page.getByText('קרמיקה').click()
  await page.getByLabel('טלפון ליצירת קשר').fill('050-2222222')
  await expect(page.getByText('הכתובת פנויה')).toBeVisible()
  await page.getByRole('button', { name: 'להמשיך למוצרים' }).click()
  await page.waitForURL('**/onboarding/products')

  const res = await page.goto(`/dashboard/orders/${orderId}`)
  expect(res?.status()).toBe(404)
  await page.goto('/dashboard/orders?status=all')
  await expect(page.getByText('דנה כהן')).toHaveCount(0)
  await page.goto('/preview')
  await expect(page.getByText('העוגות של לינוי')).toHaveCount(0)

  const sql = db()
  const [rowA] = await sql`select p.id from public.products p join public.stores s on s.id = p.store_id
                                      where s.name = 'העוגות של לינוי' and s.owner_id = (select id from auth.users where email = ${merchantA}) limit 1`
  await sql.end()
  const productA = rowA!.id as string
  const upload = await page.request.post('/api/uploads', {
    multipart: { kind: 'product-image', productId: productA, file: { name: 'x.jpg', mimeType: 'image/jpeg', buffer: (await import('node:fs')).readFileSync(`${FIXTURES}/vase.jpg`) } },
  })
  expect(upload.status()).toBe(404)

  const admin = await page.goto('/platform-admin')
  expect(admin?.url()).toContain('/dashboard')
})

test('18: trial expiry blocks new orders; manual activation restores them', async ({ page, browser }) => {
  await signUp(page, adminEmail)
  const sql = db()
  await sql`insert into public.platform_admins (user_id) select id from auth.users where email = ${adminEmail}`
  await sql.end()

  await page.goto('/platform-admin')
  const rowA = page.getByTestId('admin-merchant-row').filter({ hasText: merchantA })
  await expect(rowA.getByText('ניסיון', { exact: true })).toBeVisible()
  await rowA.getByRole('button', { name: 'סיום ניסיון (בדיקות)' }).click()
  await expect(rowA.getByText('לא פעיל', { exact: true })).toBeVisible()

  const customer = await customerPage(browser)
  const path = new URL(storeUrl).pathname
  await customer.goto(path)
  await expect(customer.getByText('החנות לא מקבלת הזמנות חדשות כרגע.').first()).toBeVisible()
  await customer.getByRole('link', { name: 'עוגת גבינה' }).first().click()
  await expect(customer.getByText('אי אפשר להזמין כרגע דרך האתר.')).toBeVisible()
  await expect(customer.getByRole('button', { name: 'הוספה לעגלה' })).toHaveCount(0)

  const merchant = await (await browser.newContext()).newPage()
  await signIn(merchant, merchantA)
  await merchant.goto('/dashboard')
  await expect(merchant.getByText('תקופת הניסיון הסתיימה. החנות לא מקבלת הזמנות חדשות.')).toBeVisible()
  await merchant.goto('/dashboard/orders?status=all')
  await expect(merchant.getByText('דנה כהן')).toBeVisible() // data intact

  await page.reload()
  await page.getByTestId('admin-merchant-row').filter({ hasText: merchantA }).getByRole('button', { name: 'הפעלת מנוי לחודש' }).click()
  await expect(page.getByTestId('admin-merchant-row').filter({ hasText: merchantA }).getByText('פעיל', { exact: true })).toBeVisible()

  await placeOrder(customer, path, 'עוגת גבינה', 'יוסי לוי')
  await expect(customer.getByText(/#1002/)).toBeVisible()
  await customer.context().close()
  await merchant.context().close()
})

test('responsive: key pages have no horizontal scroll on mobile and desktop', async ({ browser }) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 1440, height: 900 },
  ]) {
    const page = await customerPage(browser, viewport)
    for (const url of ['/', '/pricing', '/signup', new URL(storeUrl).pathname, `${new URL(storeUrl).pathname}/catalog`]) {
      await page.goto(url)
      await expectNoHorizontalScroll(page)
    }
    await signIn(page, merchantA)
    for (const url of ['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/design', '/dashboard/settings', '/dashboard/billing']) {
      await page.goto(url)
      await expectNoHorizontalScroll(page)
    }
    await page.context().close()
  }
})
