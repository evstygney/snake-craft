import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  placeFood,
  restartGame,
  setDirection,
  stepGame,
} from '../src/snake-game.mjs';

test('snake moves one cell in the current direction', () => {
  const initial = restartGame(8);
  const next = stepGame(initial);

  assert.deepEqual(next.snake[0], { x: initial.snake[0].x + 1, y: initial.snake[0].y });
  assert.equal(next.snake.length, initial.snake.length);
  assert.equal(next.score, 0);
});

test('snake grows and increases score when it eats food', () => {
  const initial = restartGame(8);
  const foodAhead = { x: initial.snake[0].x + 1, y: initial.snake[0].y };
  const next = stepGame({ ...initial, food: foodAhead });

  assert.equal(next.score, 1);
  assert.equal(next.snake.length, initial.snake.length + 1);
  assert.deepEqual(next.snake[0], foodAhead);
  assert.notDeepEqual(next.food, foodAhead);
});

test('reverse direction is ignored', () => {
  const initial = restartGame(8);
  const next = setDirection(initial, 'left');

  assert.equal(next.pendingDirection, initial.pendingDirection);
});

test('wall collision ends the game', () => {
  const state = {
    ...restartGame(6),
    snake: [{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }],
    direction: 'right',
    pendingDirection: 'right',
  };
  const next = stepGame(state);

  assert.equal(next.status, 'game-over');
});

test('self collision ends the game', () => {
  const state = {
    ...restartGame(7),
    snake: [
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    direction: 'up',
    pendingDirection: 'left',
  };
  const next = stepGame(state);

  assert.equal(next.status, 'game-over');
});

test('food placement skips occupied cells deterministically', () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  const food = placeFood(snake, 2, () => 0);

  assert.deepEqual(food, { x: 1, y: 1 });
});

test('initial state contains food outside the snake', () => {
  const state = createInitialState(10);
  const overlapsSnake = state.snake.some((segment) => segment.x === state.food.x && segment.y === state.food.y);

  assert.equal(overlapsSnake, false);
});
