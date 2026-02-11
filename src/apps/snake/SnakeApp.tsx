import { useRef, useEffect, useCallback, useState } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 400

const COLORS = {
  background: '#1a1a2e',
  grid: '#252540',
  snakeHead: '#388E3C',
  snakeBody: '#4CAF50',
  food: '#F44336',
  textPrimary: '#ffffff',
  textSecondary: '#aaaacc',
};

type Direction = 'up' | 'down' | 'left' | 'right';
type Point = { x: number; y: number };
type GameState = 'idle' | 'playing' | 'gameover';

interface GameData {
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point;
  score: number;
  gameState: GameState;
  speed: number;
}

function spawnFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  const empty: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        empty.push({ x, y });
      }
    }
  }
  if (empty.length === 0) return { x: 10, y: 10 };
  return empty[Math.floor(Math.random() * empty.length)];
}

function getInitialGameData(): GameData {
  const snake: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  return {
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: spawnFood(snake),
    score: 0,
    gameState: 'idle',
    speed: 150,
  };
}

function getOpposite(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  return opposites[dir];
}

function calcSpeed(score: number): number {
  // Every 5 foods eaten (50 score), decrease interval by 5ms. Min 80ms.
  const foodsEaten = score / 10;
  const steps = Math.floor(foodsEaten / 5);
  return Math.max(80, 150 - steps * 5);
}

export default function SnakeApp({ windowId: _windowId, payload: _payload }: { windowId: string; payload?: unknown }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(getInitialGameData());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [renderTick, setRenderTick] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const game = gameRef.current;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Food (circle)
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      game.food.x * CELL_SIZE + CELL_SIZE / 2,
      game.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Snake body
    for (let i = game.snake.length - 1; i >= 0; i--) {
      const seg = game.snake[i];
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      // Rounded corners effect
      ctx.beginPath();
      const radius = 3;
      const x = seg.x * CELL_SIZE + 1;
      const y = seg.y * CELL_SIZE + 1;
      const w = CELL_SIZE - 2;
      const h = CELL_SIZE - 2;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      ctx.fill();
    }

    // Score overlay during gameplay
    if (game.gameState === 'playing') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(5, 5, 100, 28);
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font = 'bold 16px "Segoe UI", "Inter", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${game.score}`, 12, 24);
    }

    // Idle screen
    if (game.gameState === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font = 'bold 28px "Segoe UI", "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNAKE', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '16px "Segoe UI", "Inter", system-ui, sans-serif';
      ctx.fillText('Press SPACE to start', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    }

    // Game over screen
    if (game.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#F44336';
      ctx.font = 'bold 32px "Segoe UI", "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 40);
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font = 'bold 22px "Segoe UI", "Inter", system-ui, sans-serif';
      ctx.fillText(`Score: ${game.score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 5);
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '15px "Segoe UI", "Inter", system-ui, sans-serif';
      ctx.fillText('Press SPACE to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 40);
    }
  }, []);

  const stopGame = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const gameLoop = useCallback(() => {
    const game = gameRef.current;
    if (game.gameState !== 'playing') return;

    // Apply queued direction
    game.direction = game.nextDirection;

    // Calculate new head position
    const head = game.snake[0];
    let newHead: Point;
    switch (game.direction) {
      case 'up':
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case 'down':
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case 'left':
        newHead = { x: head.x - 1, y: head.y };
        break;
      case 'right':
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      game.gameState = 'gameover';
      stopGame();
      draw();
      setRenderTick((t) => t + 1);
      return;
    }

    // Self collision
    for (const seg of game.snake) {
      if (seg.x === newHead.x && seg.y === newHead.y) {
        game.gameState = 'gameover';
        stopGame();
        draw();
        setRenderTick((t) => t + 1);
        return;
      }
    }

    // Move snake
    game.snake.unshift(newHead);

    // Check food
    if (newHead.x === game.food.x && newHead.y === game.food.y) {
      game.score += 10;
      game.food = spawnFood(game.snake);
      // Update speed
      const newSpeed = calcSpeed(game.score);
      if (newSpeed !== game.speed) {
        game.speed = newSpeed;
        stopGame();
        intervalRef.current = setInterval(gameLoop, game.speed);
      }
    } else {
      game.snake.pop();
    }

    draw();
    setRenderTick((t) => t + 1);
  }, [draw, stopGame]);

  const startGame = useCallback(() => {
    const initial = getInitialGameData();
    initial.gameState = 'playing';
    gameRef.current = initial;
    stopGame();
    intervalRef.current = setInterval(gameLoop, initial.speed);
    draw();
    setRenderTick((t) => t + 1);
  }, [gameLoop, draw, stopGame]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const game = gameRef.current;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (game.gameState === 'idle' || game.gameState === 'gameover') {
          startGame();
        }
        return;
      }

      if (game.gameState !== 'playing') return;

      let newDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDir = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDir = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDir = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDir = 'right';
          break;
      }

      if (newDir && newDir !== getOpposite(game.direction)) {
        e.preventDefault();
        game.nextDirection = newDir;
      }
    },
    [startGame]
  );

  // Initial draw
  useEffect(() => {
    draw();
    // Auto-focus the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.focus();
    }
  }, [draw]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopGame();
    };
  }, [stopGame]);

  // Suppress unused variable warnings
  void _windowId;
  void _payload;
  void renderTick;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: COLORS.background,
        fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          border: '2px solid #333355',
          borderRadius: '4px',
          outline: 'none',
          cursor: 'default',
        }}
      />
    </div>
  );
}
