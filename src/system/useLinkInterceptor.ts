import { useEffect } from 'react'
import { openUrlInBrowser } from '@/system/openTarget'

/**
 * Global capture-phase click listener that intercepts all external <a> clicks
 * and routes them through the built-in browser app instead of opening a new tab.
 */
export function useLinkInterceptor() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Walk up from the click target to find an <a> with an href
      const anchor = (e.target as HTMLElement)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      try {
        const url = new URL(href, window.location.origin)

        // Only intercept external http/https links
        if (url.origin === window.location.origin) return
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return

        // Intercept: prevent default navigation and open in built-in browser
        e.preventDefault()
        e.stopPropagation()
        openUrlInBrowser(url.href)
      } catch {
        // Invalid URL — let the browser handle it normally
      }
    }

    // Capture phase so we intercept before any component handlers
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])
}
