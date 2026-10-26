import type { Metadata, Viewport } from 'next'
import '@fontsource/karantina/400.css'
import '@fontsource/karantina/700.css'
import '@fontsource/ibm-plex-sans-hebrew/400.css'
import '@fontsource/ibm-plex-sans-hebrew/500.css'
import '@fontsource/ibm-plex-sans-hebrew/600.css'
import '@fontsource/ibm-plex-sans-hebrew/700.css'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'דוכן — חנות אונליין לעסק שלך', template: '%s | דוכן' },
  description: 'מעלים תמונות ומחירים, בוחרים עיצוב, והחנות שלך מוכנה. חנות אונליין לעסקים קטנים, בעברית, בלי מתכנת.',
  openGraph: { locale: 'he_IL', type: 'website', siteName: 'דוכן' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fbfbf9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          דילוג לתוכן
        </a>
        {children}
      </body>
    </html>
  )
}
