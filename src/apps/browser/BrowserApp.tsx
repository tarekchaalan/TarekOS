import { useState, useCallback, useRef, useEffect } from 'react'
import { Globe, ExternalLink, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react'

export default function BrowserApp({
  windowId: _windowId,
  payload,
}: {
  windowId: string
  payload?: unknown
}) {
  const initialUrl = (payload as { url?: string } | undefined)?.url ?? ''
  const [url, setUrl] = useState(initialUrl)
  const [inputUrl, setInputUrl] = useState(initialUrl)
  const [iframeKey, setIframeKey] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(!!initialUrl)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const openExternal = useCallback(
    (target: string) => {
      if (target) window.open(target, '_blank', 'noopener,noreferrer')
    },
    [],
  )

  /** Check whether a URL points to an external origin */
  const isExternal = useCallback((target: string) => {
    try {
      return new URL(target).origin !== window.location.origin
    } catch {
      return false
    }
  }, [])

  const navigate = useCallback((target: string) => {
    let normalized = target.trim()
    if (!normalized) return
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }
    try {
      const parsed = new URL(normalized)
      if (!['http:', 'https:'].includes(parsed.protocol)) return
    } catch {
      return
    }
    setUrl(normalized)
    setInputUrl(normalized)
    setLoadError(false)
    setLoading(true)
    setIframeKey((k) => k + 1)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      navigate(inputUrl)
    },
    [inputUrl, navigate],
  )

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1)
    setLoadError(false)
    setLoading(true)
  }, [])

  const handleOpenExternal = useCallback(() => {
    openExternal(url)
  }, [url, openExternal])

  /**
   * CSP detection after iframe `load` fires.
   *
   * Firefox / Safari: CSP-blocked frames fall back to about:blank which is
   *   same-origin with the parent, so `contentDocument` is accessible.
   *   If the document URL is about:blank but we navigated to an external URL
   *   → definitively blocked → auto-open in new tab.
   *
   * Chrome: CSP-blocked frames show `chrome-error://chromewebdata/` which is
   *   cross-origin, so `contentDocument` throws — indistinguishable from a
   *   page that loaded successfully. No client-side JS API can tell them apart.
   *   We only show the error when we can definitively detect blocking; otherwise
   *   the site stays in the iframe. Users can manually click "Open in tab" if needed.
   */
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !url) {
      setLoading(false)
      return
    }

    try {
      // If contentDocument is accessible, the frame loaded same-origin content.
      // For an external URL this means CSP blocked it → about:blank fallback.
      const doc = iframe.contentDocument
      if (doc) {
        const docUrl = doc.URL || ''
        if (
          isExternal(url) &&
          (docUrl === 'about:blank' || docUrl === '' || docUrl === 'about:srcdoc')
        ) {
          // Definitively blocked (Firefox / Safari)
          setLoadError(true)
          setLoading(false)
          openExternal(url)
          return
        }
        // Same-origin page that loaded fine
        setLoading(false)
        return
      }
    } catch {
      // SecurityError → cross-origin. Could be a real page or Chrome's CSP error.
      // We cannot distinguish them, so assume it loaded — no false positives.
    }

    // Cross-origin external page: assume it loaded successfully.
    setLoading(false)
  }, [url, openExternal, isExternal])

  // Attach the load handler via ref (React's onLoad is less reliable for iframes)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.addEventListener('load', handleIframeLoad)
    return () => iframe.removeEventListener('load', handleIframeLoad)
  }, [handleIframeLoad, iframeKey])

  return (
    <div className="flex h-full flex-col bg-os-bg">
      {/* Address bar */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#1a1a2e] px-2 py-1.5">
        <button
          className="rounded p-1 text-os-text-muted hover:bg-white/10 hover:text-os-text"
          disabled
          aria-label="Back"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          className="rounded p-1 text-os-text-muted hover:bg-white/10 hover:text-os-text"
          disabled
          aria-label="Forward"
        >
          <ArrowRight size={14} />
        </button>
        <button
          className="rounded p-1 text-os-text-muted hover:bg-white/10 hover:text-os-text"
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RotateCw size={14} />
        </button>

        <form onSubmit={handleSubmit} className="flex flex-1">
          <div className="flex flex-1 items-center gap-1.5 rounded bg-white/5 px-2 py-1">
            <Globe size={12} className="text-os-text-muted" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
            />
          </div>
        </form>

        <button
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-os-accent hover:bg-white/10"
          onClick={handleOpenExternal}
          title="Open in new tab"
        >
          <ExternalLink size={12} />
          <span>Open in tab</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {!url ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-os-text-muted">
            <Globe size={48} strokeWidth={1} />
            <p className="text-sm">Enter a URL to browse</p>
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-os-text-muted">
            <Globe size={48} strokeWidth={1} />
            <div className="text-center">
              <p className="text-sm font-medium text-os-text-muted">
                This site can't be displayed here
              </p>
              <p className="mt-1 text-xs text-os-text-muted">
                The site blocked iframe embedding — it was opened in a new tab.
              </p>
            </div>
            <button
              className="rounded bg-os-accent px-4 py-1.5 text-xs text-white hover:bg-os-accent/80"
              onClick={handleOpenExternal}
            >
              Open again in new tab
            </button>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-os-bg/80">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-os-text-muted/30 border-t-os-accent" />
              </div>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={url}
              className="h-full w-full border-0"
              title="Browser content"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </>
        )}
      </div>
    </div>
  );
}
