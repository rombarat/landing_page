'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">משהו השתבש בטעינת הדף</h1>
        <p className="mt-2 text-muted">הנתונים שלך שמורים. נסו לטעון שוב.</p>
        <Button onClick={reset} variant="outline" className="mt-6">
          לטעון שוב
        </Button>
      </div>
    </main>
  )
}
