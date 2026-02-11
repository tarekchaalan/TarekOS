import { TASKBAR_HEIGHT } from '@/shared/constants'

interface SnapPreviewProps {
  region: 'left' | 'right' | 'maximize' | null
}

export function SnapPreview({ region }: SnapPreviewProps) {
  if (!region) return null

  const style: React.CSSProperties = (() => {
    const h = window.innerHeight - TASKBAR_HEIGHT
    switch (region) {
      case 'left':
        return { left: 0, top: 0, width: '50%', height: h }
      case 'right':
        return { left: '50%', top: 0, width: '50%', height: h }
      case 'maximize':
        return { left: 0, top: 0, width: '100%', height: h }
    }
  })()

  return (
    <div
      className="pointer-events-none fixed z-[9990] rounded-lg border-2 border-[rgba(80,140,220,0.7)] transition-all duration-200"
      style={{
        ...style,
        background: 'rgba(80, 140, 220, 0.2)',
        backdropFilter: 'blur(2px)',
        boxShadow: '0 0 20px rgba(80, 140, 220, 0.3), inset 0 0 20px rgba(80, 140, 220, 0.1)',
      }}
    />
  )
}
