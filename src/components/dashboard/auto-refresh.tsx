'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * New orders arrive through periodic server refreshes while the tab is visible
 * (free-tier friendly; no websocket connection to keep open). Also refreshes
 * immediately when the merchant returns to the tab.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const id = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [router, intervalMs])
  return null
}
