import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PDF_URL = '/assets/Resume.pdf'

export default function ResumeViewerApp({
  windowId: _windowId,
}: {
  windowId: string
  payload?: unknown
}) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [error, setError] = useState(false)

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setPageNumber(1)
  }, [])

  const onDocumentLoadError = useCallback(() => {
    setError(true)
  }, [])

  const goToPrev = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - 1))
  }, [])

  const goToNext = useCallback(() => {
    setPageNumber((p) => Math.min(numPages, p + 1))
  }, [numPages])

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(3, s + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(0.5, s - 0.2))
  }, [])

  const handleDownload = useCallback(() => {
    const a = document.createElement('a')
    a.href = PDF_URL
    a.download = 'Tarek_Chaalan_Resume.pdf'
    a.click()
  }, [])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-os-bg text-os-text">
        <p className="text-lg font-medium">Resume Viewer</p>
        <p className="mt-2 text-sm text-os-text-muted">
          Resume.pdf not found. Please add it to /public/assets/Resume.pdf
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#2b2b2b]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#1e1e1e] px-3 py-1.5">
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
            onClick={goToPrev}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[80px] text-center text-xs text-white/70">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : '...'}
          </span>
          <button
            className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
            onClick={goToNext}
            disabled={pageNumber >= numPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="min-w-[48px] text-center text-xs text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <button
            className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <div className="mx-2 h-4 w-px bg-white/10" />
          <button
            className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={handleDownload}
            aria-label="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* PDF viewport */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-4">
        <Document
          file={PDF_URL}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  )
}
