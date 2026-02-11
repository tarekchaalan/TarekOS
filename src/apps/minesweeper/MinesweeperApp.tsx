import { useState, useCallback, useRef, useEffect } from 'react'
import styles from './MinesweeperApp.module.css'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROWS = 9
const COLS = 9
const TOTAL_CELLS = ROWS * COLS
const MINE_COUNT = 10

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  neighborCount: number
}

type GameState = 'idle' | 'playing' | 'won' | 'lost'

/* ------------------------------------------------------------------ */
/*  Board logic helpers                                                */
/* ------------------------------------------------------------------ */

function getNeighborIndices(idx: number): number[] {
  const row = Math.floor(idx / COLS)
  const col = idx % COLS
  const neighbors: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push(nr * COLS + nc)
      }
    }
  }
  return neighbors
}

/** Generate a board, guaranteeing the first-click cell AND its neighbors are mine-free. */
function generateBoard(firstClickIdx: number): Cell[] {
  const safeZone = new Set<number>([firstClickIdx, ...getNeighborIndices(firstClickIdx)])

  const mineIndices = new Set<number>()
  while (mineIndices.size < MINE_COUNT) {
    const idx = Math.floor(Math.random() * TOTAL_CELLS)
    if (!safeZone.has(idx)) {
      mineIndices.add(idx)
    }
  }

  const cells: Cell[] = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    mine: mineIndices.has(i),
    revealed: false,
    flagged: false,
    neighborCount: 0,
  }))

  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!cells[i].mine) {
      cells[i].neighborCount = getNeighborIndices(i).filter((ni) => cells[ni].mine).length
    }
  }

  return cells
}

function createEmptyBoard(): Cell[] {
  return Array.from({ length: TOTAL_CELLS }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    neighborCount: 0,
  }))
}

function floodFill(cells: Cell[], startIdx: number): void {
  const stack = [startIdx]
  while (stack.length > 0) {
    const idx = stack.pop()!
    if (cells[idx].revealed || cells[idx].flagged || cells[idx].mine) continue
    cells[idx].revealed = true
    if (cells[idx].neighborCount === 0) {
      for (const ni of getNeighborIndices(idx)) {
        if (!cells[ni].revealed && !cells[ni].flagged && !cells[ni].mine) {
          stack.push(ni)
        }
      }
    }
  }
}

function checkWinCondition(cells: Cell[]): boolean {
  return cells.every((c) => c.mine || c.revealed)
}

/* ------------------------------------------------------------------ */
/*  Number color classes                                               */
/* ------------------------------------------------------------------ */

const NUM_CLASSES: Record<number, string> = {
  1: styles.num1,
  2: styles.num2,
  3: styles.num3,
  4: styles.num4,
  5: styles.num5,
  6: styles.num6,
  7: styles.num7,
  8: styles.num8,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MinesweeperApp({
  windowId: _windowId,
  payload: _payload,
}: {
  windowId: string
  payload?: unknown
}) {
  const [board, setBoard] = useState<Cell[]>(createEmptyBoard)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [timer, setTimer] = useState(0)
  const [pressing, setPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ---- timer ---- */

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => {
      setTimer((t) => (t >= 999 ? 999 : t + 1))
    }, 1000)
  }, [stopTimer])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  /* ---- derived ---- */

  const flagCount = board.filter((c) => c.flagged).length
  const mineDisplay = MINE_COUNT - flagCount

  /* ---- left click ---- */

  const handleCellClick = useCallback(
    (idx: number) => {
      if (gameState === 'won' || gameState === 'lost') return

      let currentBoard: Cell[]
      let currentGameState: GameState = gameState

      if (gameState === 'idle') {
        // First click — generate board with safe zone around click
        currentBoard = generateBoard(idx)
        currentGameState = 'playing'
        startTimer()
      } else {
        // Clone the board
        currentBoard = board.map((c) => ({ ...c }))
      }

      const cell = currentBoard[idx]
      if (cell.revealed || cell.flagged) return

      if (cell.mine) {
        // Hit a mine — game over
        cell.revealed = true
        for (let i = 0; i < TOTAL_CELLS; i++) {
          if (currentBoard[i].mine) {
            currentBoard[i].revealed = true
          }
        }
        setBoard(currentBoard)
        setGameState('lost')
        stopTimer()
        return
      }

      // Flood fill from clicked cell
      floodFill(currentBoard, idx)

      // Check win
      if (checkWinCondition(currentBoard)) {
        // Auto-flag remaining mines
        for (let i = 0; i < TOTAL_CELLS; i++) {
          if (currentBoard[i].mine && !currentBoard[i].flagged) {
            currentBoard[i].flagged = true
          }
        }
        setBoard(currentBoard)
        setGameState('won')
        stopTimer()
        return
      }

      setBoard(currentBoard)
      if (currentGameState !== gameState) {
        setGameState(currentGameState)
      }
    },
    [gameState, board, startTimer, stopTimer],
  )

  /* ---- right click (flag) ---- */

  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.preventDefault()
      if (gameState !== 'playing') return

      const cell = board[idx]
      if (cell.revealed) return

      const newBoard = board.map((c) => ({ ...c }))
      newBoard[idx].flagged = !newBoard[idx].flagged
      setBoard(newBoard)
    },
    [gameState, board],
  )

  /* ---- reset ---- */

  const resetGame = useCallback(() => {
    stopTimer()
    setBoard(createEmptyBoard())
    setGameState('idle')
    setTimer(0)
  }, [stopTimer])

  /* ---- render helpers ---- */

  const getSmiley = (): string => {
    if (gameState === 'won') return '😎'
    if (gameState === 'lost') return '💀'
    if (pressing) return '😮'
    return '🙂'
  }

  const getCellContent = (cell: Cell): string => {
    if (cell.flagged && !cell.revealed) return '🚩'
    if (!cell.revealed) return ''
    if (cell.mine) return '💣'
    if (cell.neighborCount > 0) return String(cell.neighborCount)
    return ''
  }

  const getCellClassName = (cell: Cell): string => {
    const classes = [styles.cell]
    if (cell.flagged && !cell.revealed) {
      classes.push(styles.flag)
    } else if (cell.revealed) {
      classes.push(styles.cellRevealed)
      if (cell.mine) {
        classes.push(styles.mine)
      } else if (cell.neighborCount > 0) {
        const numClass = NUM_CLASSES[cell.neighborCount]
        if (numClass) classes.push(numClass)
      }
    } else {
      classes.push(styles.cellHidden)
    }
    return classes.join(' ')
  }

  const getStatusText = (): string => {
    if (gameState === 'won') return 'You win!'
    if (gameState === 'lost') return 'Game over!'
    if (gameState === 'idle') return 'Click to start'
    return ''
  }

  /* ---- JSX ---- */

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.counter}>
          {String(Math.max(mineDisplay, 0)).padStart(3, '0')}
        </div>
        <button className={styles.smiley} onClick={resetGame}>
          {getSmiley()}
        </button>
        <div className={styles.counter}>
          {String(Math.min(timer, 999)).padStart(3, '0')}
        </div>
      </div>

      <div
        className={styles.board}
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
      >
        {board.map((cell, idx) => (
          <button
            key={idx}
            className={getCellClassName(cell)}
            onClick={() => handleCellClick(idx)}
            onContextMenu={(e) => handleCellRightClick(e, idx)}
          >
            {getCellContent(cell)}
          </button>
        ))}
      </div>

      <div className={styles.statusBar}>{getStatusText()}</div>
    </div>
  )
}
