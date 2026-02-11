import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { vfs } from '@/system/vfs/vfs.seed'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/* ------------------------------------------------------------------ */
/*  Custom Markdown components — Win7 Notepad style (white bg, dark text) */
/* ------------------------------------------------------------------ */

const markdownComponents = {
  h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold text-[#000]" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
    <h2 className="mb-3 mt-5 text-xl font-bold text-[#000]" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
    <h3 className="mb-2 mt-4 text-lg font-semibold text-[#000]" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.ComponentProps<'h4'>) => (
    <h4 className="mb-2 mt-3 text-base font-semibold text-[#000]" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: React.ComponentProps<'p'>) => (
    <p className="mb-3 leading-relaxed text-[#1a1a1a]" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
    <ul className="mb-3 ml-6 list-disc space-y-1 text-[#1a1a1a]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
    <ol className="mb-3 ml-6 list-decimal space-y-1 text-[#1a1a1a]" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentProps<'li'>) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  a: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a
      className="text-[#0066cc] underline hover:text-[#004499] cursor-pointer"
      href={href}
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ children, className, ...props }: React.ComponentProps<'code'>) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <code className={`text-sm ${className ?? ''}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-sm text-[#c7254e]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }: React.ComponentProps<'pre'>) => (
    <pre
      className="mb-3 overflow-auto rounded border border-[#d0d0d0] bg-[#f5f5f5] p-4 text-sm text-[#1a1a1a]"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => (
    <blockquote
      className="mb-3 border-l-4 border-[#4580c4] pl-4 italic text-[#555]"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props: React.ComponentProps<'hr'>) => (
    <hr className="my-6 border-[#d0d0d0]" {...props} />
  ),
  table: ({ children, ...props }: React.ComponentProps<'table'>) => (
    <div className="mb-3 overflow-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.ComponentProps<'th'>) => (
    <th
      className="border border-[#c0c0c0] bg-[#f0f0f0] px-3 py-2 text-left font-semibold text-[#000]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentProps<'td'>) => (
    <td className="border border-[#c0c0c0] px-3 py-2 text-[#1a1a1a]" {...props}>
      {children}
    </td>
  ),
  strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-[#000]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.ComponentProps<'em'>) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
}

/* ------------------------------------------------------------------ */
/*  Highlight textarea                                                 */
/*  A textarea with a mirrored backdrop that renders <mark> highlights */
/*  for find matches. The textarea text is transparent so the backdrop  */
/*  shows through, while the caret stays visible.                      */
/* ------------------------------------------------------------------ */

const TEXTAREA_FONT = "'Consolas', 'Lucida Console', 'Courier New', monospace"
const TEXTAREA_FONT_SIZE = '13px'
const TEXTAREA_LINE_HEIGHT = '18px'
const TEXTAREA_PADDING_X = '8px' // px-2
const TEXTAREA_PADDING_Y = '4px' // py-1

interface HighlightTextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  wordWrap: boolean
  matches: { start: number; end: number }[]
  currentMatchIndex: number
  showHighlights: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  placeholder?: string
}

function HighlightTextarea({
  value,
  onChange,
  wordWrap,
  matches,
  currentMatchIndex,
  showHighlights,
  textareaRef,
  placeholder,
}: HighlightTextareaProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // Sync scroll position between textarea and backdrop
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [textareaRef])

  // Build the highlighted HTML for the backdrop
  const highlightedHtml = useMemo(() => {
    if (!showHighlights || matches.length === 0) return null

    const parts: string[] = []
    let lastEnd = 0

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i]
      // Text before this match
      if (m.start > lastEnd) {
        parts.push(escapeHtml(value.slice(lastEnd, m.start)))
      }
      // The match itself
      const matchText = escapeHtml(value.slice(m.start, m.end))
      const isCurrent = i === currentMatchIndex
      parts.push(
        `<mark style="background:${isCurrent ? 'rgba(255,150,50,0.35)' : 'rgba(255,255,0,0.3)'};color:transparent;border-radius:1px">${matchText}</mark>`,
      )
      lastEnd = m.end
    }
    // Text after the last match
    if (lastEnd < value.length) {
      parts.push(escapeHtml(value.slice(lastEnd)))
    }

    return parts.join('')
  }, [value, matches, currentMatchIndex, showHighlights])

  const sharedStyle: React.CSSProperties = {
    fontFamily: TEXTAREA_FONT,
    fontSize: TEXTAREA_FONT_SIZE,
    lineHeight: TEXTAREA_LINE_HEIGHT,
    padding: `${TEXTAREA_PADDING_Y} ${TEXTAREA_PADDING_X}`,
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    overflowWrap: wordWrap ? 'break-word' : undefined,
    wordBreak: wordWrap ? 'break-word' : undefined,
    border: 'none',
    margin: 0,
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Backdrop layer with highlights */}
      {highlightedHtml && (
        <div
          ref={backdropRef}
          className="pointer-events-none absolute inset-0 overflow-hidden bg-white"
          style={sharedStyle}
          dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
          aria-hidden="true"
        />
      )}
      {/* Actual textarea — text is transparent when highlights are active so marks show through */}
      <textarea
        ref={textareaRef}
        className="selectable absolute inset-0 h-full w-full resize-none outline-none"
        style={{
          ...sharedStyle,
          background: highlightedHtml ? 'transparent' : 'white',
          color: '#000',
          caretColor: '#000',
          overflow: 'auto',
        }}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder={placeholder}
      />
    </div>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = 'edit' | 'preview'

interface FindReplaceBarProps {
  findText: string
  replaceText: string
  onFindChange: (v: string) => void
  onReplaceChange: (v: string) => void
  onFindNext: () => void
  onReplace: () => void
  onReplaceAll: () => void
  onClose: () => void
  matchCount: number
  currentMatch: number
}

/* ------------------------------------------------------------------ */
/*  Find/Replace Bar                                                    */
/* ------------------------------------------------------------------ */

function FindReplaceBar({
  findText,
  replaceText,
  onFindChange,
  onReplaceChange,
  onFindNext,
  onReplace,
  onReplaceAll,
  onClose,
  matchCount,
  currentMatch,
}: FindReplaceBarProps) {
  const findInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    findInputRef.current?.focus()
  }, [])

  const handleFindKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onFindNext()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-[#c0c0c0] bg-[#f5f5f5] px-2 py-1.5">
      <label className="flex items-center gap-1 text-[11px] text-[#444]">
        Find:
        <input
          ref={findInputRef}
          type="text"
          value={findText}
          onChange={(e) => onFindChange(e.target.value)}
          onKeyDown={handleFindKeyDown}
          className="w-36 rounded border border-[#b8b8b8] bg-white px-2 py-[2px] text-[12px] outline-none focus:border-[#4580c4]"
        />
      </label>
      <label className="flex items-center gap-1 text-[11px] text-[#444]">
        Replace:
        <input
          type="text"
          value={replaceText}
          onChange={(e) => onReplaceChange(e.target.value)}
          onKeyDown={handleReplaceKeyDown}
          className="w-36 rounded border border-[#b8b8b8] bg-white px-2 py-[2px] text-[12px] outline-none focus:border-[#4580c4]"
        />
      </label>
      <span className="min-w-[70px] text-[11px] text-[#666]">
        {findText
          ? matchCount > 0
            ? `${currentMatch + 1} of ${matchCount}`
            : 'No matches'
          : ''}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onFindNext}
          disabled={matchCount === 0}
          className="rounded px-2 py-0.5 text-[11px] text-[#444] hover:bg-[#dde4ee] disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Find Next
        </button>
        <button
          onClick={onReplace}
          disabled={matchCount === 0}
          className="rounded px-2 py-0.5 text-[11px] text-[#444] hover:bg-[#dde4ee] disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Replace
        </button>
        <button
          onClick={onReplaceAll}
          disabled={matchCount === 0}
          className="rounded px-2 py-0.5 text-[11px] text-[#444] hover:bg-[#dde4ee] disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Replace All
        </button>
        <button
          onClick={onClose}
          className="rounded px-1.5 py-0.5 text-[11px] text-[#444] hover:bg-[#dde4ee]"
          title="Close find bar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Win7 Notepad menu bar                                              */
/* ------------------------------------------------------------------ */

function MenuBar({
  wordWrap,
  onToggleWordWrap,
  viewMode,
  onToggleView,
  showViewToggle,
  onSave,
  onFind,
  showFind,
}: {
  wordWrap: boolean
  onToggleWordWrap: () => void
  viewMode: ViewMode
  onToggleView: () => void
  showViewToggle: boolean
  onSave?: () => void
  onFind?: () => void
  showFind?: boolean
}) {
  return (
    <div className="flex items-center border-b border-[#c0c0c0] bg-[#f0f0f0] px-1 py-0.5">
      {onSave && (
        <>
          <button
            onClick={onSave}
            className="rounded px-2 py-0.5 text-[11px] text-[#444] hover:bg-[#dde4ee]"
            title="Save as .txt file"
          >
            Save
          </button>
          <div className="mx-1 h-3 w-px bg-[#c0c0c0]" />
        </>
      )}
      <button
        onClick={onToggleWordWrap}
        className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
          wordWrap ? 'text-[#1a1a1a] font-semibold' : 'text-[#444]'
        } hover:bg-[#dde4ee]`}
        title="Toggle word wrap"
      >
        Word Wrap {wordWrap ? '✓' : ''}
      </button>

      {onFind && (
        <>
          <div className="mx-1 h-3 w-px bg-[#c0c0c0]" />
          <button
            onClick={onFind}
            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
              showFind ? 'text-[#1a1a1a] font-semibold' : 'text-[#444]'
            } hover:bg-[#dde4ee]`}
            title="Find and Replace (Ctrl+F)"
          >
            Find
          </button>
        </>
      )}

      {showViewToggle && (
        <>
          <div className="mx-1 h-3 w-px bg-[#c0c0c0]" />
          <button
            onClick={onToggleView}
            className="rounded px-2 py-0.5 text-[11px] text-[#444] hover:bg-[#dde4ee]"
          >
            {viewMode === 'edit' ? 'Preview' : 'Edit'}
          </button>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Notepad App — Windows 7 style                                      */
/* ------------------------------------------------------------------ */

export default function NotepadApp({
  windowId: _windowId,
  payload,
}: {
  windowId: string
  payload?: unknown
}) {
  const p = payload as { nodeId?: string } | undefined

  const { node, initialContent } = useMemo(() => {
    if (!p?.nodeId) return { node: null, initialContent: '' }
    const n = vfs.getNode(p.nodeId)
    if (!n) return { node: null, initialContent: '' }
    const c = vfs.readContentById(p.nodeId)
    return { node: n, initialContent: c ?? '' }
  }, [p?.nodeId])

  const [text, setText] = useState(initialContent)
  const [wordWrap, setWordWrap] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')

  const mime = node?.mime ?? 'text/plain'
  const isMarkdown = mime === 'text/markdown'
  const isJson = mime === 'application/json'

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }, [])

  const toggleWordWrap = useCallback(() => {
    setWordWrap((w) => !w)
  }, [])

  const toggleView = useCallback(() => {
    setViewMode((m) => (m === 'edit' ? 'preview' : 'edit'))
  }, [])

  const handleSave = useCallback(() => {
    const filename = node?.name
      ? node.name.replace(/\.[^.]+$/, '') + '.txt'
      : 'Untitled.txt'
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [text, node])

  // Use formatted JSON as initial text when first loaded
  const [jsonInitialized] = useState(() => {
    if (isJson && initialContent) {
      try {
        return JSON.stringify(JSON.parse(initialContent), null, 2)
      } catch {
        return initialContent
      }
    }
    return null
  })

  // Set JSON text on first render
  const displayText = isJson && text === initialContent ? (jsonInitialized ?? text) : text

  /* ---- Find / Replace state ---- */
  const [showFind, setShowFind] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Determine which text the textarea is actually showing
  const activeText = isJson ? displayText : text

  const matches = useMemo(() => {
    if (!findText) return [] as { start: number; end: number }[]
    const results: { start: number; end: number }[] = []
    const searchLower = findText.toLowerCase()
    const textLower = activeText.toLowerCase()
    let idx = 0
    while (idx < textLower.length) {
      const found = textLower.indexOf(searchLower, idx)
      if (found === -1) break
      results.push({ start: found, end: found + findText.length })
      idx = found + 1
    }
    return results
  }, [activeText, findText])

  // Clamp currentMatch when matches change
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatch(0)
    } else if (currentMatch >= matches.length) {
      setCurrentMatch(0)
    }
  }, [matches.length, currentMatch])

  // When navigating (Find Next / Replace), focus textarea and select the match
  // so the view scrolls to it. For live-typing highlights we rely on the
  // HighlightTextarea backdrop instead of native selection.
  const navigatingMatch = useRef(false)
  useEffect(() => {
    if (navigatingMatch.current && matches.length > 0 && textareaRef.current && showFind) {
      const m = matches[currentMatch]
      if (m) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(m.start, m.end)
      }
      navigatingMatch.current = false
    }
  }, [matches, currentMatch, showFind])

  const toggleFind = useCallback(() => {
    setShowFind((prev) => {
      if (prev) {
        // Closing: clear search state
        setFindText('')
        setReplaceText('')
        setCurrentMatch(0)
      }
      return !prev
    })
  }, [])

  const handleFindNext = useCallback(() => {
    if (matches.length === 0) return
    navigatingMatch.current = true
    setCurrentMatch((prev) => (prev + 1) % matches.length)
  }, [matches.length])

  const handleReplace = useCallback(() => {
    if (matches.length === 0) return
    const m = matches[currentMatch]
    if (!m) return
    const before = activeText.slice(0, m.start)
    const after = activeText.slice(m.end)
    const newText = before + replaceText + after
    setText(newText)
    navigatingMatch.current = true
    // Keep currentMatch in range; if we replaced the last match, wrap to 0
    if (currentMatch >= matches.length - 1) {
      setCurrentMatch(0)
    }
  }, [matches, currentMatch, replaceText, activeText])

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0 || !findText) return
    // Replace all occurrences (case-insensitive)
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const newText = activeText.replace(regex, replaceText)
    setText(newText)
    setCurrentMatch(0)
  }, [findText, replaceText, activeText, matches.length])

  const handleCloseFind = useCallback(() => {
    setShowFind(false)
    setFindText('')
    setReplaceText('')
    setCurrentMatch(0)
    textareaRef.current?.focus()
  }, [])

  // Keyboard shortcut: Ctrl/Cmd+F to toggle find, Escape to close
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        e.stopPropagation()
        setShowFind(true)
      }
      if (e.key === 'Escape' && showFind) {
        e.preventDefault()
        handleCloseFind()
      }
    },
    [showFind, handleCloseFind],
  )

  // Determine if find bar should be visible (only in edit mode)
  const isInEditMode = !isMarkdown || viewMode === 'edit'
  const showFindBar = showFind && isInEditMode

  // No file opened — blank notepad
  if (!node) {
    return (
      <div className="flex h-full flex-col bg-[#f0f0f0]" onKeyDown={handleContainerKeyDown}>
        <MenuBar
          wordWrap={wordWrap}
          onToggleWordWrap={toggleWordWrap}
          viewMode="edit"
          onToggleView={toggleView}
          showViewToggle={false}
          onSave={handleSave}
          onFind={toggleFind}
          showFind={showFind}
        />
        {showFindBar && (
          <FindReplaceBar
            findText={findText}
            replaceText={replaceText}
            onFindChange={setFindText}
            onReplaceChange={setReplaceText}
            onFindNext={handleFindNext}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            onClose={handleCloseFind}
            matchCount={matches.length}
            currentMatch={currentMatch}
          />
        )}
        <HighlightTextarea
          value={text}
          onChange={handleTextChange}
          wordWrap={wordWrap}
          matches={matches}
          currentMatchIndex={currentMatch}
          showHighlights={showFindBar}
          textareaRef={textareaRef}
          placeholder="Type here..."
        />
      </div>
    )
  }

  // Markdown: show preview (rendered) or edit mode
  if (isMarkdown) {
    return (
      <div className="flex h-full flex-col bg-[#f0f0f0]" onKeyDown={handleContainerKeyDown}>
        <MenuBar
          wordWrap={wordWrap}
          onToggleWordWrap={toggleWordWrap}
          viewMode={viewMode}
          onToggleView={toggleView}
          showViewToggle={true}
          onSave={handleSave}
          onFind={viewMode === 'edit' ? toggleFind : undefined}
          showFind={showFind}
        />
        {showFindBar && (
          <FindReplaceBar
            findText={findText}
            replaceText={replaceText}
            onFindChange={setFindText}
            onReplaceChange={setReplaceText}
            onFindNext={handleFindNext}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            onClose={handleCloseFind}
            matchCount={matches.length}
            currentMatch={currentMatch}
          />
        )}
        {viewMode === 'preview' ? (
          <div className="selectable flex-1 overflow-auto bg-white">
            <div className="mx-auto max-w-3xl px-8 py-6">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {text}
              </Markdown>
            </div>
          </div>
        ) : (
          <HighlightTextarea
            value={text}
            onChange={handleTextChange}
            wordWrap={wordWrap}
            matches={matches}
            currentMatchIndex={currentMatch}
            showHighlights={showFindBar}
            textareaRef={textareaRef}
          />
        )}
      </div>
    )
  }

  // Plain text / JSON — editable textarea
  return (
    <div className="flex h-full flex-col bg-[#f0f0f0]" onKeyDown={handleContainerKeyDown}>
      <MenuBar
        wordWrap={wordWrap}
        onToggleWordWrap={toggleWordWrap}
        viewMode="edit"
        onToggleView={toggleView}
        showViewToggle={false}
        onFind={toggleFind}
        showFind={showFind}
      />
      {showFindBar && (
        <FindReplaceBar
          findText={findText}
          replaceText={replaceText}
          onFindChange={setFindText}
          onReplaceChange={setReplaceText}
          onFindNext={handleFindNext}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={handleCloseFind}
          matchCount={matches.length}
          currentMatch={currentMatch}
        />
      )}
      <HighlightTextarea
        value={displayText}
        onChange={handleTextChange}
        wordWrap={wordWrap}
        matches={matches}
        currentMatchIndex={currentMatch}
        showHighlights={showFindBar}
        textareaRef={textareaRef}
      />
    </div>
  )
}
