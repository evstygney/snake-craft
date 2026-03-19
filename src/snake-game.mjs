export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = 'right';

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function createInitialState(gridSize = GRID_SIZE) {
  const center = Math.floor(gridSize / 2);
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];

  return {
    gridSize,
    snake,
    direction: INITIAL_DIRECTION,
    pendingDirection: INITIAL_DIRECTION,
    food: placeFood(snake, gridSize),
    score: 0,
    status: 'ready',
  };
}

export function setDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state;
  }

  if (state.status === 'ready') {
    return {
      ...state,
      direction: nextDirection,
      pendingDirection: nextDirection,
      status: 'running',
    };
  }

  const blockedDirection = OPPOSITES[state.direction];
  if (nextDirection === blockedDirection && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection,
    status: state.status,
  };
}

export function togglePause(state) {
  if (state.status === 'game-over' || state.status === 'ready') {
    return state;
  }

  const nextStatus = state.status === 'paused' ? 'running' : 'paused';
  return { ...state, status: nextStatus };
}

export function restartGame(gridSize = GRID_SIZE) {
  return createInitialState(gridSize);
}

export function stepGame(state) {
  if (state.status !== 'running') {
    return state;
  }

  const direction = state.pendingDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  const hitsWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  if (hitsWall) {
    return {
      ...state,
      direction,
      status: 'game-over',
    };
  }

  const ateFood = isSameCell(nextHead, state.food);
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  const hitsSelf = bodyToCheck.some((segment) => isSameCell(segment, nextHead));

  if (hitsSelf) {
    return {
      ...state,
      direction,
      status: 'game-over',
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    pendingDirection: direction,
    food: ateFood ? placeFood(nextSnake, state.gridSize) : state.food,
    score: ateFood ? state.score + 1 : state.score,
  };
}

export function placeFood(snake, gridSize, random = Math.random) {
  const occupied = new Set(snake.map(toKey));
  const freeCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = { x, y };
      if (!occupied.has(toKey(cell))) {
        freeCells.push(cell);
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.min(freeCells.length - 1, Math.floor(random() * freeCells.length));
  return freeCells[index];
}

export function isSameCell(a, b) {
  if (!a || !b) {
    return false;
  }

  return a.x === b.x && a.y === b.y;
}

function toKey(cell) {
  return `${cell.x},${cell.y}`;
}
