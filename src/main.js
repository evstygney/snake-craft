import {
  GRID_SIZE,
  createInitialState,
  restartGame,
  setDirection,
  stepGame,
  togglePause,
} from './snake-game.mjs';

const TICK_MS = 150;
const BEST_SCORE_KEY = 'snake-craft-best-score';

const board = document.querySelector('#board');
const scoreValue = document.querySelector('#score');
const bestScoreValue = document.querySelector('#best-score');
const overlay = document.querySelector('#overlay');
const overlayTitle = document.querySelector('#overlay-title');
const overlayText = document.querySelector('#overlay-text');
const overlayAction = document.querySelector('#overlay-action');
const pauseButton = document.querySelector('#pause-button');
const restartButton = document.querySelector('#restart-button');
const padButtons = document.querySelectorAll('[data-dir]');

let state = {
  ...createInitialState(GRID_SIZE),
};
let bestScore = readBestScore();

renderBoard();
renderState();

const timer = window.setInterval(() => {
  const nextState = stepGame(state);
  if (nextState !== state) {
    state = nextState;
    syncBestScore();
    renderState();
  }
}, TICK_MS);

window.addEventListener('keydown', (event) => {
  const direction = mapKeyToDirection(event.key);
  if (direction) {
    event.preventDefault();
    state = setDirection(state, direction);
    renderState();
    return;
  }

  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault();
    state = togglePause(state);
    renderState();
    return;
  }

  if (event.key.toLowerCase() === 'r') {
    state = restartGame(GRID_SIZE);
    renderState();
  }
});

pauseButton.addEventListener('click', () => {
  state = togglePause(state);
  renderState();
});

restartButton.addEventListener('click', () => {
  state = restartGame(GRID_SIZE);
  renderState();
});

overlayAction.addEventListener('click', () => {
  if (state.status === 'game-over') {
    state = restartGame(GRID_SIZE);
  } else if (state.status === 'paused') {
    state = togglePause(state);
  }
  renderState();
});

padButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state = setDirection(state, button.dataset.dir);
    renderState();
  });
});

window.addEventListener('beforeunload', () => {
  window.clearInterval(timer);
});

function renderBoard() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = String(index);
    fragment.appendChild(cell);
  }

  board.appendChild(fragment);
}

function renderState() {
  const cells = board.children;
  const snakeMap = new Map(state.snake.map((segment, index) => [toIndex(segment.x, segment.y), index]));
  const foodIndex = state.food ? toIndex(state.food.x, state.food.y) : -1;

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const index = toIndex(x, y);
      const cell = cells[index];
      cell.className = 'cell';

      if (index === foodIndex) {
        cell.classList.add('food');
      }

      if (snakeMap.has(index)) {
        cell.classList.add('snake');
        if (snakeMap.get(index) === 0) {
          cell.classList.add('snake-head');
        }
      }
    }
  }

  scoreValue.textContent = String(state.score);
  bestScoreValue.textContent = String(bestScore);
  pauseButton.textContent = state.status === 'paused' ? 'Продолжить' : 'Пауза';
  pauseButton.disabled = state.status === 'ready' || state.status === 'game-over';
  renderOverlay();
}

function renderOverlay() {
  if (state.status === 'ready') {
    overlay.hidden = false;
    overlayTitle.textContent = 'Новая игра';
    overlayText.textContent = 'Нажмите стрелку, WASD или экранную кнопку, чтобы начать движение.';
    overlayAction.hidden = true;
    return;
  }

  if (state.status === 'paused') {
    overlay.hidden = false;
    overlayAction.hidden = false;
    overlayTitle.textContent = 'Пауза';
    overlayText.textContent = 'Нажмите пробел или кнопку ниже, чтобы продолжить игру.';
    overlayAction.textContent = 'Продолжить';
    return;
  }

  if (state.status === 'game-over') {
    overlay.hidden = false;
    overlayAction.hidden = false;
    overlayTitle.textContent = 'Игра окончена';
    overlayText.textContent = `Ваш счет: ${state.score}. Нажмите R или кнопку ниже, чтобы начать заново.`;
    overlayAction.textContent = 'Играть снова';
    return;
  }

  overlay.hidden = true;
}

function mapKeyToDirection(key) {
  const normalized = key.toLowerCase();
  const map = {
    arrowup: 'up',
    w: 'up',
    arrowdown: 'down',
    s: 'down',
    arrowleft: 'left',
    a: 'left',
    arrowright: 'right',
    d: 'right',
  };

  return map[normalized] || null;
}

function toIndex(x, y) {
  return y * GRID_SIZE + x;
}

function readBestScore() {
  try {
    return Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function syncBestScore() {
  if (state.score <= bestScore) {
    return;
  }

  bestScore = state.score;
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  } catch {
    // Ignore storage errors and keep the current session playable.
  }
}
