// Sizzle & Serve: the game shell.
//
// Owns the game state, the frame loop, and the input (keyboard and
// mouse). The rules live in orders.js, cooking.js and player.js; the
// drawing lives in render.js. With ?shot=start|play|end in the URL the
// game renders one frozen screenshot scene instead of playing.
//
// State shape:
//   phase: 'menu' | 'playing' | 'paused' | 'over'
//   won, elapsed, timeLeft, money, served, failed, hearts
//   orders (the order board), grill, chop (chopping board), plate
//   chef, particles, flashes, servedPlates, sound, rng

import { VIEW, clampToWalk, nearestStation, stationById, STATIONS } from './kitchen.js';
import { makeRng, timeSeed } from './rng.js';
import { dishById } from './recipes.js';
import {
  MAX_HEARTS,
  SHIFT_SECONDS,
  makeOrderBoard,
  serveDish,
  updateOrderBoard,
} from './orders.js';
import { makeChopBoard, makeGrill, makePlate, updateCooking } from './cooking.js';
import { CHEF_RADIUS, makeChef, moveChef, useStation } from './player.js';
import { drawGame } from './render.js';
import { makeSound, playSound } from './sound.js';
import { buildShotState } from './shots.js';

/** A fresh game, waiting on the menu. */
function newGame(seed) {
  const rng = makeRng(seed);
  return {
    phase: 'menu',
    won: false,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    money: 0,
    served: 0,
    failed: 0,
    hearts: MAX_HEARTS,
    orders: makeOrderBoard(rng),
    grill: makeGrill(),
    chop: makeChopBoard(),
    plate: makePlate(),
    chef: makeChef(),
    particles: [],
    flashes: [],
    servedPlates: [],
    sound: makeSound(),
    muted: false,
    frozenNow: undefined,
    rng,
  };
}

/** Adds a floating message above the kitchen. */
function addFlash(state, text) {
  state.flashes.push({ text, ttl: 1.6 });
  if (state.flashes.length > 3) state.flashes.shift();
}

/** Serves a finished dish to the matching order; its pay, or null. */
function serveOrder(state, dishId) {
  const result = serveDish(state.orders, dishId);
  if (!result) return null;
  state.money += result.money;
  state.served += 1;
  state.servedPlates.push(dishById(dishId));
  return result.money;
}

/** Uses the station nearest the chef, with a flash and a sound. */
function interact(state) {
  const world = { grill: state.grill, chop: state.chop, plate: state.plate };
  const report = useStation(state.chef, world, (dishId) => serveOrder(state, dishId));
  if (!report) return;
  addFlash(state, report.message);
  if (report.sound) playSound(state.sound, report.sound);
}

/** Ends the shift: won when the clock ran out, lost on three failures. */
function endShift(state, won) {
  state.phase = 'over';
  state.won = won;
  playSound(state.sound, won ? 'serve' : 'fail');
}

/** One tick of the live game. */
function update(state, dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  const grillBefore = state.grill.map((slot) => slot.state).join(',');
  const chopBefore = state.chop.state;
  updateCooking(state.grill, state.chop, dt);
  const grillAfter = state.grill.map((slot) => slot.state).join(',');
  if (grillBefore !== grillAfter || chopBefore !== state.chop.state) {
    if (state.grill.some((slot) => slot.state === 'cooked') || state.chop.state === 'done') {
      playSound(state.sound, 'ding');
    }
  }

  const failed = updateOrderBoard(state.orders, dt, state.elapsed);
  for (const order of failed) {
    state.failed += 1;
    state.hearts -= 1;
    addFlash(state, `Lost order: ${dishById(order.dishId).name}`);
    playSound(state.sound, 'fail');
  }
  if (state.hearts <= 0) {
    endShift(state, false);
    return;
  }
  if (state.timeLeft <= 0) {
    endShift(state, true);
    return;
  }

  moveChef(state.chef, keys, dt);
  if (state.chef.pendingStation) {
    const station = stationById(state.chef.pendingStation);
    if (station) {
      const dist = Math.hypot(station.anchor.x - state.chef.x, station.anchor.y - state.chef.y);
      if (dist < 60) {
        state.chef.pendingStation = null;
        interact(state);
      }
    } else {
      state.chef.pendingStation = null;
    }
  }

  for (const [i, slot] of state.grill.entries()) {
    if (slot.state === 'cooking' && Math.random() < dt * 2) {
      state.particles.push({
        x: 232 + i * 96 + (Math.random() * 10 - 5),
        y: 528,
        r: 5 + Math.random() * 4,
        ttl: 1.2,
        max: 1.2,
      });
    }
  }
  for (const particle of state.particles) {
    particle.y -= 14 * dt;
    particle.ttl -= dt;
  }
  state.particles = state.particles.filter((p) => p.ttl > 0);
  for (const flash of state.flashes) flash.ttl -= dt;
  state.flashes = state.flashes.filter((f) => f.ttl > 0);
}

/** The keys held down, as 'up' | 'down' | 'left' | 'right'. */
const keys = new Set();

/** Maps a keyboard event to a direction name, or null. */
function directionOf(event) {
  if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') return 'up';
  if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') return 'down';
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') return 'left';
  if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') return 'right';
  return null;
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

let state;
if (shot) {
  // Screenshot mode: one frozen scene, drawn once, never updated.
  state = buildShotState(shot, Number(params.get('seed') || '1'));
  drawGame(ctx, state);
} else {
  state = newGame(timeSeed());

  window.addEventListener('keydown', (event) => {
    const direction = directionOf(event);
    if (direction) {
      keys.add(direction);
      event.preventDefault();
      return;
    }
    if (event.key === ' ' || event.key === 'e' || event.key === 'E') {
      if (state.phase === 'playing') interact(state);
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      if (state.phase === 'menu') state.phase = 'playing';
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      if (state.phase === 'over') {
        state = newGame(timeSeed());
        state.phase = 'playing';
      }
      return;
    }
    if (event.key === 'p' || event.key === 'P') {
      if (state.phase === 'playing') state.phase = 'paused';
      else if (state.phase === 'paused') state.phase = 'playing';
      return;
    }
    if (event.key === 'm' || event.key === 'M') {
      state.sound.muted = !state.sound.muted;
    }
  });
  window.addEventListener('keyup', (event) => {
    const direction = directionOf(event);
    if (direction) keys.delete(direction);
  });

  canvas.addEventListener('click', (event) => {
    if (state.phase === 'menu') {
      state.phase = 'playing';
      return;
    }
    if (state.phase === 'over') {
      state = newGame(timeSeed());
      state.phase = 'playing';
      return;
    }
    if (state.phase !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * VIEW.width) / rect.width;
    const y = ((event.clientY - rect.top) * VIEW.height) / rect.height;
    const clicked = STATIONS.find(
      (station) =>
        x >= station.x - 12 &&
        x <= station.x + station.w + 12 &&
        y >= station.y - 12 &&
        y <= station.y + station.h + 12,
    );
    if (clicked) {
      state.chef.target = { x: clicked.anchor.x, y: clicked.anchor.y };
      state.chef.pendingStation = clicked.id;
    } else {
      const point = clampToWalk(x, y, CHEF_RADIUS);
      state.chef.target = point;
      state.chef.pendingStation = null;
    }
  });

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.phase === 'playing') update(state, dt);
    drawGame(ctx, state);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
