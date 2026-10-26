// Builds three demo stores through the real UI (signup → onboarding → publish),
// places demo orders, and captures screenshots of the actual product into
// public/marketing/. Run against a local dev server with the local stack:
//   node scripts/capture-marketing.mjs [baseUrl]
// The stores are demo data and are labeled as such on the marketing page.
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const BASE = process.argv[2] ?? 'http://localhost:3000'
const FX = path.resolve('tests/fixtures/products')
const OUT = path.resolve('public/marketing')
await mkdir(OUT, { recursive: true })

const run = Date.now().toString(36).slice(-4)
const STORES = [
  {
    key: 'artisan',
    name: 'המאפייה של נוגה',
    category: 'מאפה ועוגות',
    description: 'עוגות ומאפים ביתיים לפי הזמנה, נאפים כל בוקר בקריית טבעון.',
    template: 'סדנה',
    products: [
      ['chocolate-cake', 'עוגת שוקולד ודובדבנים', '180', 'עוגות'],
      ['cheesecake', 'עוגת גבינה ופירות יער', '160', 'עוגות'],
      ['cupcakes', 'מארז קאפקייקס וניל', '45', 'קטנים'],
      ['cookies', 'עוגיות שוקולד צ׳יפס', '38', 'קטנים'],
      ['sourdough', 'לחם מחמצת כפרי', '32', 'לחמים'],
      ['jam-jar', 'ריבת תות ביתית', '28', 'לחמים'],
    ],
  },
  {
    key: 'boutique',
    name: 'סטודיו חומר',
    category: 'קרמיקה',
    description: 'כלי קרמיקה בעבודת יד, בכמויות קטנות.',
    template: 'בוטיק',
    products: [
      ['vase', 'אגרטל טרקוטה', '260', ''],
      ['blue-bowl', 'קערת הגשה כחולה', '140', ''],
      ['mug', 'ספל זית', '85', ''],
      ['soy-candle', 'נר סויה לבנדר', '70', ''],
    ],
  },
  {
    key: 'bold',
    name: 'אור תכשיטים',
    category: 'תכשיטים',
    description: 'תכשיטים עכשוויים בציפוי זהב.',
    template: 'נועז',
    swatch: 'גרפיט ואלמוג',
    products: [
      ['gold-ring', 'טבעת סוליטר', '420', ''],
      ['necklace', 'שרשרת מדליון', '360', ''],
      ['soy-candle', 'נר מתנה', '70', ''],
      ['mug', 'ספל לוגו', '85', ''],
    ],
  },
]

async function shot(page, name, opts = {}) {
  const buf = await page.screenshot({ fullPage: false, ...opts })
  await sharp(buf).webp({ quality: 82 }).toFile(path.join(OUT, `${name}.webp`))
  console.log('captured', name)
}

const browser = await chromium.launch()
const created = []

for (const s of STORES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'he-IL' })
  const page = await ctx.newPage()
  const email = `demo-${s.key}-${run}@demo.dukan.local`
  await page.goto(`${BASE}/signup`)
  await page.fill('input[name=email]', email)
  await page.fill('input[name=password]', 'DemoPass123!')
  await page.click('button[type=submit]')
  await page.waitForURL('**/onboarding')
  await page.fill('input[name=name]', s.name)
  await page.click(`label:has-text("${s.category}")`)
  await page.fill('textarea[name=description]', s.description)
  await page.fill('input[name=phone]', '050-1234567')
  await page.waitForTimeout(1200)
  await page.click('button:has-text("להמשיך למוצרים")')
  await page.waitForURL('**/onboarding/products')
  await page.setInputFiles('[data-testid=product-files]', s.products.map(([f]) => `${FX}/${f}.jpg`))
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid=product-card] input[id^=name-]:not([disabled])').length === n, s.products.length, { timeout: 60000 })
  const cards = page.locator('[data-testid=product-card]')
  if (s.key === 'artisan') {
    await page.waitForTimeout(800)
    await shot(page, 'step-upload')
  }
  for (let i = 0; i < s.products.length; i++) {
    const [, name, price, category] = s.products[i]
    const card = cards.nth(i)
    await card.locator('input[id^=name-]').fill(name)
    await card.locator('input[id^=price-]').fill(price)
    await card.locator('input[id^=price-]').blur()
    if (category) {
      const select = card.locator('select[id^=cat-]')
      const exists = await select.locator(`option:has-text("${category}")`).count()
      if (exists) await select.selectOption({ label: category })
      else {
        await select.selectOption('__new')
        await card.locator('input[aria-label="שם הקטגוריה החדשה"]').fill(category)
        await card.locator('button:has-text("הוספה")').click()
      }
      await page.waitForTimeout(400)
    }
  }
  await page.waitForTimeout(1500)
  if (s.key === 'artisan') {
    await cards.nth(0).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70))
    await page.waitForTimeout(300)
    await shot(page, 'step-products')
  }
  await page.click('button:has-text("לראות את החנות")')
  await page.waitForURL('**/onboarding/design')
  await page.click(`button[aria-pressed]:has-text("${s.template}")`)
  if (s.swatch) await page.click(`button[aria-label="${s.swatch}"]`)
  await page.waitForTimeout(2500)
  if (s.key === 'artisan') {
    await page.locator('#tpl-heading').scrollIntoViewIfNeeded()
    await shot(page, 'step-design')
  }
  await page.click('a:has-text("נראה טוב, להמשיך") >> nth=0')
  await page.waitForURL('**/onboarding/publish')
  await page.fill('input[placeholder^="למשל: רעננה"]', s.key === 'artisan' ? 'קריית טבעון, רחוב האלונים' : 'תל אביב, פלורנטין')
  await page.click('button:has-text("פרסום החנות שלי")')
  await page.waitForURL('**/onboarding/live')
  if (s.key === 'artisan') await shot(page, 'step-live')
  const url = await page.textContent('[data-testid=store-url]')
  const slug = url.split('/s/')[1]
  created.push({ ...s, slug, email })

  // Customer view of the published store.
  const customer = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'he-IL', extraHTTPHeaders: { 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } })
  const cp = await customer.newPage()
  await cp.goto(`${BASE}/s/${slug}`)
  await cp.waitForTimeout(1200)
  await shot(cp, `tpl-${s.key}`)
  if (s.key === 'artisan') {
    // Two demo orders for the dashboard screenshot.
    for (const [first, phone, qty] of [
      ['מיכל לוי', '052-1112233', 1],
      ['יוסי אברהם', '054-9988776', 2],
    ]) {
      await cp.goto(`${BASE}/s/${slug}`)
      for (let q = 0; q < qty; q++) await cp.click('button[aria-label^="הוספת מארז קאפקייקס"]')
      await cp.click('button[aria-label^="הוספת עוגת שוקולד"]')
      await cp.goto(`${BASE}/s/${slug}/checkout`)
      await cp.fill('#name', first)
      await cp.fill('#phone', phone)
      await cp.fill('#notes', 'כיתוב על העוגה: מזל טוב!')
      await cp.waitForTimeout(2700)
      await cp.click('button:has-text("שליחת ההזמנה")')
      await cp.waitForURL('**/order-success**')
    }
    await shot(cp, 'order-success')
  }
  await customer.close()
  await ctx.close()
}

// Merchant dashboard on desktop.
const bakery = created[0]
const desk = await browser.newContext({ viewport: { width: 1360, height: 860 }, deviceScaleFactor: 2, locale: 'he-IL' })
const dp = await desk.newPage()
await dp.goto(`${BASE}/login`)
await dp.fill('input[name=email]', bakery.email)
await dp.fill('input[name=password]', 'DemoPass123!')
await dp.click('button[type=submit]')
await dp.waitForURL('**/dashboard')
await dp.waitForTimeout(800)
await shot(dp, 'dashboard-overview')
await dp.goto(`${BASE}/dashboard/orders`)
await dp.click('[data-testid=order-list] a >> nth=0')
await dp.waitForURL('**/dashboard/orders/*')
await dp.click('button:has-text("אישור ההזמנה")')
await dp.waitForTimeout(1200)
await shot(dp, 'dashboard-order')
await dp.goto(`${BASE}/dashboard/products`)
await dp.waitForTimeout(800)
await shot(dp, 'dashboard-products')
await desk.close()
await browser.close()
console.log(JSON.stringify(created.map(({ key, slug, email }) => ({ key, slug, email }))))
