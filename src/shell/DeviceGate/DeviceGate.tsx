import { useState, useEffect, type ReactNode } from 'react'
import { Monitor, Smartphone, ExternalLink } from 'lucide-react'

interface DeviceGateProps {
  children: ReactNode
}

export function DeviceGate({ children }: DeviceGateProps) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  const [overridden, setOverridden] = useState(false)
  const [resizedSmall, setResizedSmall] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const wide = window.innerWidth >= 1024
      setIsDesktop(wide)
      if (!wide && overridden) {
        setResizedSmall(true)
      } else {
        setResizedSmall(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [overridden])

  // Desktop or user chose to continue anyway
  if (isDesktop || overridden) {
    return (
      <>
        {resizedSmall && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="max-w-md rounded-xl bg-os-bg-secondary p-8 text-center shadow-2xl">
              <Monitor className="mx-auto mb-4 h-10 w-10 text-os-accent" />
              <p className="text-lg font-medium text-os-text">
                Resize your window for the best experience
              </p>
              <p className="mt-2 text-sm text-os-text-secondary">
                This OS requires at least 1024px width
              </p>
            </div>
          </div>
        )}
        {children}
      </>
    )
  }

  // Mobile / small screen fallback
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-os-bg px-6 text-center">
      <div className="max-w-md">
        <div className="mb-8 flex justify-center gap-4">
          <Smartphone className="h-12 w-12 text-os-text-muted" />
          <Monitor className="h-12 w-12 text-os-accent" />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-os-text">
          Tarek Chaalan
        </h1>
        <p className="mb-1 text-lg text-os-accent">Software Engineer</p>
        <p className="mb-8 text-sm text-os-text-secondary">
          This interactive portfolio OS is designed for desktop browsers.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://tarekchaalan.com"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-os-accent px-6 py-3 font-medium text-white transition-colors hover:bg-os-accent-hover"
          >
            <ExternalLink className="h-4 w-4" />
            View Mobile Portfolio
          </a>

          <button
            onClick={() => setOverridden(true)}
            className="rounded-lg border border-os-border px-6 py-3 text-sm text-os-text-secondary transition-colors hover:bg-os-surface hover:text-os-text"
          >
            Continue anyway
          </button>
        </div>

        <p className="mt-8 text-xs text-os-text-muted">
          For the full experience, visit on a desktop with at least 1024px width
        </p>
      </div>
    </div>
  )
}
