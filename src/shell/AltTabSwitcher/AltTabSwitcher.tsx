import type { WindowInstance } from '@/shared/types/window.types'
import { Win7Icon } from '@/shared/components/Win7Icon'

interface AltTabSwitcherProps {
  windows: WindowInstance[]
  selectedIndex: number
  onSelect: (id: string) => void
}

export function AltTabSwitcher({ windows, selectedIndex, onSelect }: AltTabSwitcherProps) {
  if (windows.length === 0) return null

  const selectedWindow = windows[selectedIndex]

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99990 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" />

      {/* Panel */}
      <div
        className="relative flex flex-col items-center gap-3 rounded-lg border border-white/20 px-5 py-4 shadow-2xl backdrop-blur-lg"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        {/* Selected window title */}
        <div className="max-w-[480px] truncate text-center text-sm font-medium text-white/90">
          {selectedWindow?.title ?? ''}
        </div>

        {/* Window cards */}
        <div className="flex gap-2">
          {windows.map((win, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <button
                key={win.id}
                onClick={() => onSelect(win.id)}
                className={
                  'flex flex-col items-center gap-1.5 rounded-md border-2 px-3 py-2 transition-colors ' +
                  (isSelected
                    ? 'border-[#4580c4] bg-white/15'
                    : 'border-transparent bg-white/5 hover:bg-white/10')
                }
                style={{ width: 80 }}
              >
                <Win7Icon name={win.icon ?? 'icon.app'} size={32} />
                <span className="w-full truncate text-center text-[11px] leading-tight text-white/80">
                  {win.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
