import { useState, useCallback } from 'react'
import { useStore } from '@/system/store'

/* ------------------------------------------------------------------ */
/*  Accent color presets                                               */
/* ------------------------------------------------------------------ */

const accentPresets = [
  { name: 'Windows Blue', value: '#4580c4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
]

/* ------------------------------------------------------------------ */
/*  Wallpaper categories                                               */
/* ------------------------------------------------------------------ */

interface WallpaperCategory {
  name: string
  wallpapers: Array<{ label: string; path: string }>
}

const wallpaperCategories: WallpaperCategory[] = [
  {
    name: 'Windows',
    wallpapers: [
      { label: 'Default', path: '/assets/wallpapers/Windows/img0.jpg' },
    ],
  },
  {
    name: 'Nature',
    wallpapers: Array.from({ length: 6 }, (_, i) => ({
      label: `Nature ${i + 1}`,
      path: `/assets/wallpapers/Nature/img${i + 1}.jpg`,
    })),
  },
  {
    name: 'Landscapes',
    wallpapers: Array.from({ length: 6 }, (_, i) => ({
      label: `Landscape ${i + 1}`,
      path: `/assets/wallpapers/Landscapes/img${i + 7}.jpg`,
    })),
  },
  {
    name: 'Architecture',
    wallpapers: Array.from({ length: 6 }, (_, i) => ({
      label: `Architecture ${i + 1}`,
      path: `/assets/wallpapers/Architecture/img${i + 13}.jpg`,
    })),
  },
  {
    name: 'Characters',
    wallpapers: Array.from({ length: 6 }, (_, i) => ({
      label: `Character ${i + 1}`,
      path: `/assets/wallpapers/Characters/img${i + 19}.jpg`,
    })),
  },
  {
    name: 'Scenes',
    wallpapers: Array.from({ length: 6 }, (_, i) => ({
      label: `Scene ${i + 1}`,
      path: `/assets/wallpapers/Scenes/img${i + 25}.jpg`,
    })),
  },
]

/* ------------------------------------------------------------------ */
/*  Sidebar sections                                                   */
/* ------------------------------------------------------------------ */

type SectionId = 'personalization' | 'about'

const sections: Array<{ id: SectionId; label: string; iconSvg: string }> = [
  { id: 'personalization', label: 'Personalization', iconSvg: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { id: 'about', label: 'About', iconSvg: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-1 5h2v6h-2z' },
]

/* ------------------------------------------------------------------ */
/*  Personalization Panel                                              */
/* ------------------------------------------------------------------ */

function PersonalizationPanel() {
  const accentColor = useStore((s) => s.accentColor)
  const wallpaper = useStore((s) => s.wallpaper)
  const setAccentColor = useStore((s) => s.setAccentColor)
  const setWallpaper = useStore((s) => s.setWallpaper)
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div className="space-y-8">
      {/* Accent Color */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#666]">
          Window Color
        </h3>
        <div className="flex flex-wrap gap-3">
          {accentPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setAccentColor(preset.value)}
              title={preset.name}
              className={`h-10 w-10 rounded transition-all ${
                accentColor === preset.value
                  ? 'ring-2 ring-[#333] ring-offset-2 ring-offset-[#f0f0f0]'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>
      </section>

      {/* Wallpaper */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#666]">
          Desktop Background
        </h3>

        {/* Category tabs */}
        <div className="mb-3 flex gap-1 overflow-x-auto border-b border-[#d0d0d0] pb-1">
          {wallpaperCategories.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(idx)}
              className={`whitespace-nowrap rounded-t px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === idx
                  ? 'bg-white text-[#1a1a1a] shadow-sm'
                  : 'text-[#666] hover:text-[#333]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Thumbnail grid */}
        <div className="grid grid-cols-4 gap-3">
          {wallpaperCategories[activeCategory].wallpapers.map((wp) => (
            <button
              key={wp.path}
              onClick={() => setWallpaper(wp.path)}
              className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                wallpaper === wp.path
                  ? 'border-[#4580c4] shadow-md'
                  : 'border-[#d0d0d0] hover:border-[#999]'
              }`}
            >
              <img
                src={wp.path}
                alt={wp.label}
                className="h-16 w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  About Panel                                                        */
/* ------------------------------------------------------------------ */

function AboutPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">TarekOS</h2>
        <p className="mt-1 text-sm text-[#888]">Windows 7 Edition — v1.0.0</p>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#666]">
          Built With
        </h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Tailwind CSS', 'Zustand'].map((tech) => (
            <span
              key={tech}
              className="rounded border border-[#d0d0d0] bg-white px-3 py-1.5 text-sm text-[#444]"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#666]">
          Source Code
        </h3>
        <p className="text-sm text-[#444]">
          github.com/TarekChaalan/Tarek-OS
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#666]">
          Credits
        </h3>
        <p className="text-sm text-[#444]">Created by Tarek Chaalan</p>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Settings App                                                       */
/* ------------------------------------------------------------------ */

export default function SettingsApp({
  windowId: _windowId,
  payload: _payload,
}: {
  windowId: string
  payload?: unknown
}) {
  const [activeSection, setActiveSection] = useState<SectionId>('personalization')

  const handleSectionChange = useCallback((id: SectionId) => {
    setActiveSection(id)
  }, [])

  return (
    <div className="flex h-full bg-[#f0f0f0] text-[#1a1a1a]">
      {/* Sidebar */}
      <div className="flex w-[180px] shrink-0 flex-col border-r border-[#d0d0d0] bg-[#e8e8e8]">
        <div className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-[#666]">
          Control Panel
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {sections.map((section) => {
            const active = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`flex items-center gap-2.5 rounded px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'bg-[#4580c4] text-white'
                    : 'text-[#444] hover:bg-[#d0d0d0]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d={section.iconSvg} />
                </svg>
                <span>{section.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeSection === 'personalization' && <PersonalizationPanel />}
        {activeSection === 'about' && <AboutPanel />}
      </div>
    </div>
  )
}
