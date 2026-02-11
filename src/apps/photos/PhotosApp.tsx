import { useState, useCallback, useRef, useEffect } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tool = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill' | 'picker'

interface Point {
  x: number
  y: number
}

/* ------------------------------------------------------------------ */
/*  Color palette — classic MS Paint                                   */
/* ------------------------------------------------------------------ */

const PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000', '#ffffff', '#c0c0c0',
  '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80',
  '#80ffff', '#8080ff', '#ff0080', '#ff8040',
]

const BRUSH_SIZES = [1, 3, 5, 8, 12]

/* ------------------------------------------------------------------ */
/*  Tool icons (inline SVG paths)                                      */
/* ------------------------------------------------------------------ */

const TOOL_ICONS: Record<Tool, { path: string; label: string }> = {
  pencil:  { path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z', label: 'Pencil' },
  brush:   { path: 'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z', label: 'Brush' },
  eraser:  { path: 'M16.24 3.56l4.95 4.94c.78.78.78 2.05 0 2.83L12.29 20.24a2 2 0 0 1-2.83 0L3.51 14.29a2 2 0 0 1 0-2.83L12.41 2.56a2 2 0 0 1 2.83 0l1 1zm-1.41 1.42L6.34 13.47l4.95 4.95 8.49-8.49-4.95-4.95z', label: 'Eraser' },
  line:    { path: 'M4 20L20 4', label: 'Line' },
  rect:    { path: 'M3 3h18v18H3V3zm2 2v14h14V5H5z', label: 'Rectangle' },
  ellipse: { path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z', label: 'Ellipse' },
  fill:    { path: 'M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z', label: 'Fill' },
  picker:  { path: 'M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12a1 1 0 0 0 .01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z', label: 'Color Picker' },
}

/* ------------------------------------------------------------------ */
/*  Flood fill on canvas                                               */
/* ------------------------------------------------------------------ */

function floodFillCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  width: number,
  height: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const sx = Math.floor(startX)
  const sy = Math.floor(startY)
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return

  const startIdx = (sy * width + sx) * 4
  const targetColor: [number, number, number, number] = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ]

  if (
    targetColor[0] === fillColor[0] &&
    targetColor[1] === fillColor[1] &&
    targetColor[2] === fillColor[2] &&
    targetColor[3] === fillColor[3]
  )
    return

  const match = (idx: number) =>
    data[idx] === targetColor[0] &&
    data[idx + 1] === targetColor[1] &&
    data[idx + 2] === targetColor[2] &&
    data[idx + 3] === targetColor[3]

  const setPixel = (idx: number) => {
    data[idx] = fillColor[0]
    data[idx + 1] = fillColor[1]
    data[idx + 2] = fillColor[2]
    data[idx + 3] = fillColor[3]
  }

  const stack: number[] = [sx, sy]
  while (stack.length > 0) {
    const y = stack.pop()!
    const x = stack.pop()!
    const idx = (y * width + x) * 4
    if (!match(idx)) continue
    setPixel(idx)
    if (x > 0) stack.push(x - 1, y)
    if (x < width - 1) stack.push(x + 1, y)
    if (y > 0) stack.push(x, y - 1)
    if (y < height - 1) stack.push(x, y + 1)
  }
  ctx.putImageData(imageData, 0, 0)
}

function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, 255]
}

function rgbaToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/* ------------------------------------------------------------------ */
/*  MS Paint Component                                                 */
/* ------------------------------------------------------------------ */

export default function PhotosApp({
  windowId: _windowId,
  payload: _payload,
}: {
  windowId: string
  payload?: unknown
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [shapeStart, setShapeStart] = useState<Point | null>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const snapshotRef = useRef<ImageData | null>(null)
  const lastPointRef = useRef<Point | null>(null)
  const initializedRef = useRef(false)

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!initializedRef.current) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      initializedRef.current = true
    }
  }, [canvasSize])

  // Resize canvas to fit container (only on initial mount)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setCanvasSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) })
    }
  }, [])

  const getCanvasPoint = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const drawLine = useCallback(
    (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    },
    [],
  )

  const setupCtx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (tool === 'eraser') {
        ctx.strokeStyle = '#ffffff'
        ctx.fillStyle = '#ffffff'
      } else {
        ctx.strokeStyle = color
        ctx.fillStyle = color
      }
      ctx.lineWidth = tool === 'brush' ? brushSize * 2 : brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    },
    [tool, color, brushSize],
  )

  /* ---- Mouse handlers ---- */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const point = getCanvasPoint(e)

      setupCtx(ctx)
      setIsDrawing(true)

      if (tool === 'fill') {
        floodFillCanvas(ctx, point.x, point.y, hexToRgba(color), canvas.width, canvas.height)
        setIsDrawing(false)
        return
      }

      if (tool === 'picker') {
        const pixel = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data
        setColor(rgbaToHex(pixel[0], pixel[1], pixel[2]))
        setIsDrawing(false)
        return
      }

      if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
        snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
        setShapeStart(point)
        return
      }

      // Pencil, brush, eraser — draw a dot
      ctx.beginPath()
      ctx.arc(point.x, point.y, (tool === 'brush' ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2)
      ctx.fill()
      lastPointRef.current = point
    },
    [tool, color, brushSize, getCanvasPoint, setupCtx],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const point = getCanvasPoint(e)

      setupCtx(ctx)

      if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
        if (snapshotRef.current) {
          ctx.putImageData(snapshotRef.current, 0, 0)
        }
        if (!shapeStart) return

        if (tool === 'line') {
          drawLine(ctx, shapeStart, point)
        } else if (tool === 'rect') {
          ctx.strokeRect(
            shapeStart.x,
            shapeStart.y,
            point.x - shapeStart.x,
            point.y - shapeStart.y,
          )
        } else if (tool === 'ellipse') {
          const cx = (shapeStart.x + point.x) / 2
          const cy = (shapeStart.y + point.y) / 2
          const rx = Math.abs(point.x - shapeStart.x) / 2
          const ry = Math.abs(point.y - shapeStart.y) / 2
          ctx.beginPath()
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        return
      }

      // Freehand tools
      if (lastPointRef.current) {
        drawLine(ctx, lastPointRef.current, point)
      }
      lastPointRef.current = point
    },
    [isDrawing, tool, shapeStart, getCanvasPoint, setupCtx, drawLine],
  )

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
    setShapeStart(null)
    snapshotRef.current = null
    lastPointRef.current = null
  }, [])

  /* ---- Clear canvas ---- */

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  /* ---- JSX ---- */

  return (
    <div className="flex h-full flex-col bg-[#f0f0f0]">
      {/* Menu bar */}
      <div className="flex items-center border-b border-[#c0c0c0] bg-[#f0f0f0] px-1 py-0.5">
        <button
          className="rounded px-3 py-0.5 text-[11px] text-[#1a1a1a] hover:bg-[#dde4ee]"
          onClick={clearCanvas}
        >
          New
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tool panel */}
        <div className="flex w-[54px] shrink-0 flex-col items-center gap-0.5 border-r border-[#c0c0c0] bg-[#f0f0f0] py-1">
          {(Object.keys(TOOL_ICONS) as Tool[]).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              title={TOOL_ICONS[t].label}
              className={`flex h-[28px] w-[44px] items-center justify-center rounded-sm transition-colors ${
                tool === t
                  ? 'bg-[#c0d8f0] shadow-inner outline outline-1 outline-[#6699cc]'
                  : 'hover:bg-[#e0e8f0]'
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={TOOL_ICONS[t].path} />
              </svg>
            </button>
          ))}

          {/* Brush size selector */}
          <div className="mt-2 w-full border-t border-[#c0c0c0] pt-2">
            <div className="px-1 text-center text-[9px] text-[#666] mb-1">Size</div>
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                title={`${s}px`}
                className={`flex h-[22px] w-full items-center justify-center ${
                  brushSize === s
                    ? 'bg-[#c0d8f0] outline outline-1 outline-[#6699cc]'
                    : 'hover:bg-[#e0e8f0]'
                }`}
              >
                <div
                  className="rounded-full bg-[#333]"
                  style={{
                    width: Math.max(Math.min(s * 2, 16), 2),
                    height: Math.max(Math.min(s * 2, 16), 2),
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-[#808080] p-0"
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="block"
            style={{ cursor: 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      {/* Color palette bar */}
      <div className="flex items-center gap-2 border-t border-[#c0c0c0] bg-[#f0f0f0] px-2 py-1">
        {/* Current color preview */}
        <div
          className="h-[22px] w-[22px] shrink-0 border-2 border-[#808080]"
          style={{ backgroundColor: color }}
          title={`Current: ${color}`}
        />

        {/* Palette grid: 2 rows of 14 */}
        <div className="grid grid-cols-14 gap-px">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-[14px] w-[14px] border ${
                color === c ? 'border-[#000]' : 'border-[#808080]'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Coordinates / status */}
        <div className="ml-auto text-[10px] text-[#666]">
          {canvasSize.w} × {canvasSize.h}
        </div>
      </div>
    </div>
  )
}
