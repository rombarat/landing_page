import { LinkButton } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-display text-ink">404</p>
        <h1 className="mt-2 text-xl font-semibold">הדף הזה לא קיים</h1>
        <p className="mt-2 text-muted">ייתכן שהקישור השתנה או שהחנות עדיין לא פורסמה.</p>
        <LinkButton href="/" variant="outline" className="mt-6">
          לעמוד הבית
        </LinkButton>
      </div>
    </main>
  )
}
