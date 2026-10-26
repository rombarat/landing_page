'use client'

import { useRouter } from 'next/navigation'
import type { EditorCategory, EditorProduct } from '@/lib/data/merchant'
import { ProductEditor } from '@/components/products/product-editor'
import { Button } from '@/components/ui/button'

export function OnboardingProducts({ products, categories, aiEnabled }: { products: EditorProduct[]; categories: EditorCategory[]; aiEnabled: boolean }) {
  const router = useRouter()
  return (
    <ProductEditor
      initialProducts={products}
      initialCategories={categories}
      mode="onboarding"
      aiEnabled={aiEnabled}
      footer={({ ready, incomplete, uploading, total }) =>
        total > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
              <p className="text-sm" aria-live="polite">
                <span className="font-semibold text-ink">{ready} מוכנים לחנות</span>
                {incomplete > 0 && <span className="text-muted">, ועוד {incomplete} בלי שם או מחיר</span>}
                {uploading > 0 && <span className="text-muted">, {uploading} בהעלאה</span>}
              </p>
              <Button
                type="button"
                size="lg"
                className="ms-auto"
                disabled={ready === 0 || uploading > 0}
                onClick={() => router.push('/onboarding/design')}
              >
                {uploading > 0 ? 'מחכים לסיום ההעלאה…' : 'לראות את החנות'}
              </Button>
            </div>
          </div>
        )
      }
    />
  )
}
