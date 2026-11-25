// Deterministic screenshot states for Sizzle & Serve.
//
// ?shot=start&seed=1, ?shot=play&seed=1 and ?shot=end&seed=1 each build
// one frozen scene, so a screenshot renders exactly the same every time
// for the same seed: the clock is frozen (frozenNow), nothing updates,
// and every number in the scene comes from the seed. main.js renders the
// scene once and never runs the live loop for it.
//
//   start — the menu over the kitchen, two fresh orders on the board.
//   play  — mid-shift: a dish half-built on the plate, a patty on the
//           grill, lettuce on the board, the chef carrying chopped tomato.
//   end   — the shift done: stars, the takings, plates at the window.

import { makeRng } from './rng.js';
import { DISHES, dishById } from './recipes.js';
import { makeGrill, makeChopBoard, makePlate } from './cooking.js';
import { makeChef } from './player.js';
import { SHIFT_SECONDS, MAX_HEARTS } from './orders.js';

/** The frozen clock every shot renders with (blink prompts stay on). */
const FROZEN_NOW = 1000;

/** A blank state with the clock frozen and nothing on the stations. */
function blankState(phase) {
  return {
    phase,
    won: false,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    money: 0,
    served: 0,
    failed: 0,
    hearts: MAX_HEARTS,
    orders: { orders: [], nextId: 1, spawnIn: 0, rng: null },
    grill: makeGrill(),
    chop: makeChopBoard(),
    plate: makePlate(),
    chef: makeChef(),
    particles: [],
    flashes: [],
    servedPlates: [],
    sound: null,
    muted: true,
    frozenNow: FROZEN_NOW,
  };
}

/** The menu scene: the kitchen waiting, two fresh tickets on the board. */
function startState() {
  const state = blankState('menu');
  state.orders.orders = [
    { id: 1, dishId: 'burger', patience: 50, maxPatience: 50 },
    { id: 2, dishId: 'salad', patience: 50, maxPatience: 50 },
  ];
  state.orders.nextId = 3;
  state.chef.x = 514;
  state.chef.y = 300;
  state.chef.facing = 'down';
  return state;
}

/** The mid-shift scene: a dish half-built, food on every station. */
function playState(seed) {
  const rng = makeRng(seed);
  const state = blankState('playing');
  state.elapsed = 45;
  state.timeLeft = 135;
  state.money = 24;
  state.served = 2;
  state.orders.rng = rng;
  const first = rng.pick(DISHES);
  const second = rng.pick(DISHES);
  const third = rng.pick(DISHES);
  state.orders.orders = [
    { id: 1, dishId: first.id, patience: 20, maxPatience: 50 },
    { id: 2, dishId: second.id, patience: 38, maxPatience: 50 },
    { id: 3, dishId: third.id, patience: 45, maxPatience: 48 },
  ];
  state.orders.nextId = 4;
  state.grill[0] = { item: 'patty-raw', timer: 1.8, state: 'cooking' };
  state.chop = { item: 'lettuce-raw', timer: 1.5, state: 'chopping' };
  state.plate.components = ['bun', 'patty-grilled'];
  state.chef.x = 700;
  state.chef.y = 470;
  state.chef.facing = 'up';
  state.chef.carrying = 'tomato-chopped';
  state.servedPlates = [dishById('burger'), dishById('salad')];
  state.particles = [
    { x: 232, y: 522, r: 6, ttl: 0.8, max: 1.2 },
    { x: 242, y: 506, r: 8, ttl: 0.4, max: 1.2 },
  ];
  state.flashes = [{ text: 'Served! +$14', ttl: 1.2 }];
  return state;
}

/** The end-of-shift scene: stars, the takings, plates at the window. */
function endState() {
  const state = blankState('over');
  state.won = true;
  state.elapsed = SHIFT_SECONDS;
  state.timeLeft = 0;
  state.money = 86;
  state.served = 9;
  state.failed = 1;
  state.hearts = 2;
  state.orders.orders = [];
  state.chef.x = 840;
  state.chef.y = 320;
  state.chef.facing = 'left';
  state.servedPlates = [dishById('burger'), dishById('melt'), dishById('salad')];
  return state;
}

/**
 * The frozen scene for `kind` ('start' | 'play' | 'end') and `seed`.
 * Unknown kinds fall back to the start scene.
 */
export function buildShotState(kind, seed) {
  if (kind === 'play') return playState(seed);
  if (kind === 'end') return endState();
  return startState();
}
