import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { StorePayload } from '@/lib/types'
import { ProductGrid } from './product-card'
import { StoreImage } from './store-image'

export function CategoryNav({ payload, basePath, active }: { payload: StorePayload; basePath: string; active?: string | null }) {
  if (payload.categories.length < 2) return null
  return (
    <nav aria-label="קטגוריות" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className={cn('flex gap-2', payload.settings.template === 'boutique' && 'sm:justify-center')}>
        <li>
          <Link href={`${basePath}/catalog`} className="st-chip" aria-current={!active ? 'page' : undefined}>
            הכול
          </Link>
        </li>
        {payload.categories.map((c) => (
          <li key={c.id}>
            <Link href={`${basePath}/catalog?category=${c.id}`} className="st-chip" aria-current={active === c.id ? 'page' : undefined}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function StoreHome({ payload, basePath }: { payload: StorePayload; basePath: string }) {
  const { store, settings, products } = payload
  const tpl = settings.template
  const canOrder = payload.order_gate === 'ok'
  const heroImage = settings.hero_image_path
    ? { path: settings.hero_image_path }
    : products.find((p) => p.images[0])?.images[0]
  const title = settings.hero_title || store.name
  const subtitle = settings.hero_subtitle || store.description
  const featured = products.filter((p) => p.is_featured)
  // Small catalogs show everything on the home page so the store never looks empty.
  const showAll = products.length <= 12
  const homeProducts = showAll ? products : (featured.length >= 4 ? featured : products).slice(0, 8)
  // The hero already carries the description; the about block shows only dedicated text.
  const aboutText = settings.about_text

  return (
    <>
      {tpl === 'boutique' && (
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-6 pt-8 sm:px-6 md:grid-cols-2 md:gap-14 md:pt-14">
          <div className="order-2 md:order-1">
            <h1 className="st-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.02]">{title}</h1>
            {subtitle && <p className="st-muted mt-5 max-w-md text-lg leading-relaxed">{subtitle}</p>}
            <Link href={`${basePath}/catalog`} className="st-btn st-btn-outline mt-8">
              לכל המוצרים
            </Link>
          </div>
          {heroImage && (
            <div className="st-card-media order-1 aspect-[4/5] md:order-2">
              <StoreImage image={heroImage} alt={title} sizes="(min-width: 768px) 50vw, 100vw" priority />
            </div>
          )}
        </section>
      )}

      {tpl === 'artisan' && (
        <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-8">
          <div className="relative sm:overflow-hidden sm:rounded-[28px]">
            {heroImage ? (
              <div className="aspect-[4/3] overflow-hidden rounded-[24px] sm:aspect-[16/7] sm:rounded-none">
                <StoreImage image={heroImage} alt={title} sizes="100vw" priority />
              </div>
            ) : (
              <div className="aspect-[16/7] rounded-[24px] bg-[var(--st-primary)] sm:rounded-none" />
            )}
            <div className="relative mx-3 -mt-12 rounded-[20px] bg-[var(--st-surface)] p-5 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.25)] sm:absolute sm:bottom-6 sm:start-6 sm:mx-0 sm:mt-0 sm:max-w-md sm:p-7">
              <h1 className="st-display text-[clamp(1.9rem,5vw,3rem)] leading-tight text-[var(--st-primary)]">{title}</h1>
              {subtitle && <p className="st-muted mt-2 leading-relaxed">{subtitle}</p>}
              <Link href="#products" className="st-btn st-btn-primary mt-4">
                להזמנה
              </Link>
            </div>
          </div>
        </section>
      )}

      {tpl === 'bold' && (
        <section className="border-b-2 border-[var(--st-text)] bg-[var(--st-accent)] text-[var(--st-on-accent)]">
          <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:py-16">
            <div>
              <h1 className="st-display text-[clamp(2.8rem,9vw,6.5rem)] leading-[0.9]">{title}</h1>
              {subtitle && <p className="mt-5 max-w-lg text-lg font-medium leading-relaxed">{subtitle}</p>}
              <Link href="#products" className="st-btn st-btn-primary mt-7">
                לקנייה
              </Link>
            </div>
            {heroImage && (
              <div className="aspect-square border-2 border-[var(--st-text)] bg-[var(--st-surface)]">
                <StoreImage image={heroImage} alt={title} sizes="(min-width: 768px) 40vw, 100vw" priority />
              </div>
            )}
          </div>
        </section>
      )}

      <section id="products" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-14 sm:px-6">
        <div className={cn('mb-8 flex flex-wrap gap-4', tpl === 'boutique' ? 'flex-col items-center' : 'items-end justify-between')}>
          <h2 className="st-section-title st-display">{showAll ? 'המוצרים' : featured.length >= 4 ? 'מומלצים' : 'מהחנות'}</h2>
          {!showAll && (
            <Link href={`${basePath}/catalog`} className="text-sm font-semibold underline-offset-4 hover:underline">
              לכל {products.length} המוצרים
            </Link>
          )}
        </div>
        <div className="mb-8">
          <CategoryNav payload={payload} basePath={basePath} />
        </div>
        {homeProducts.length > 0 ? (
          <ProductGrid products={homeProducts} basePath={basePath} template={tpl} canOrder={canOrder} priorityCount={tpl === 'boutique' ? 0 : 2} />
        ) : (
          <p className="st-muted py-10 text-center">עוד מעט יעלו לכאן מוצרים.</p>
        )}
      </section>

      <section id="about" className="mx-auto mt-20 max-w-6xl scroll-mt-20 px-4 sm:px-6">
        <div
          className={cn(
            'grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]',
            tpl === 'artisan' && 'st-summary p-6 sm:p-10',
            tpl === 'bold' && 'border-2 border-[var(--st-text)] p-6 sm:p-10',
            tpl === 'boutique' && 'border-t border-[var(--st-line)] pt-14',
          )}
        >
          {aboutText ? (
            <div>
              <h2 className="st-section-title st-display text-start!">{settings.about_title || 'קצת עלינו'}</h2>
              <p className="mt-4 max-w-prose whitespace-pre-line text-lg leading-relaxed">{aboutText}</p>
            </div>
          ) : (
            <h2 className="st-section-title st-display text-start!">איך מזמינים</h2>
          )}
          <div>
            {aboutText && <h3 className="font-semibold">איך מזמינים</h3>}
            <p className="st-muted mt-2 text-sm leading-relaxed">
              בוחרים מוצרים, שולחים הזמנה, והעסק חוזר אליכם לאישור. האיסוף עצמי. {settings.payment_note}
            </p>
            {settings.pickup_instructions && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{settings.pickup_instructions}</p>}
          </div>
        </div>
      </section>
    </>
  )
}
