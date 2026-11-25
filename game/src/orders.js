// The order board: which dishes customers ask for, how long they wait,
// and what a served or a failed order is worth.
//
// Orders arrive over the shift and each carries a patience bar. Serve the
// dish it asks for before the bar runs out to earn its price plus a tip;
// let it run out and the customer storms off, costing one heart.

import { DISHES, tipFor } from './recipes.js';

/** The shift lasts three minutes. */
export const SHIFT_SECONDS = 180;
/** Hearts lost when an order's patience runs out; at zero the shift fails. */
export const MAX_HEARTS = 3;
/** At most this many tickets sit on the board at once. */
export const MAX_ORDERS = 3;

/** Patience (seconds) of an order placed `elapsed` seconds into the shift. */
export function patienceFor(elapsed) {
  return Math.max(38, 50 - elapsed / 20);
}

/** Seconds between new orders `elapsed` seconds into the shift. */
export function spawnGapFor(elapsed) {
  return Math.max(9, 16 - elapsed / 30);
}

/** A fresh order ticket: a random dish and a full patience bar. */
export function makeOrder(rng, elapsed, id) {
  const dish = rng.pick(DISHES);
  const patience = patienceFor(elapsed);
  return { id, dishId: dish.id, patience, maxPatience: patience };
}

/**
 * The order board's state: the tickets on it, the next ticket's id, and
 * the countdown to the next new order.
 */
export function makeOrderBoard(rng) {
  return {
    rng,
    orders: [makeOrder(rng, 0, 1)],
    nextId: 2,
    spawnIn: spawnGapFor(0),
  };
}

/**
 * Advances the board by `dt` seconds. Returns the tickets that just
 * failed (their patience ran out), so the game can charge a heart each.
 * New tickets arrive on their own timer while the board has room.
 */
export function updateOrderBoard(board, dt, elapsed) {
  const failed = [];
  for (const order of board.orders) {
    order.patience -= dt;
  }
  board.orders = board.orders.filter((order) => {
    if (order.patience <= 0) {
      failed.push(order);
      return false;
    }
    return true;
  });
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_ORDERS) {
    board.orders.push(makeOrder(board.rng, elapsed, board.nextId));
    board.nextId += 1;
    board.spawnIn = spawnGapFor(elapsed);
  } else if (board.spawnIn <= 0) {
    board.spawnIn = 2;
  }
  return failed;
}

/**
 * Serves a finished dish: removes the oldest open order for that dish and
 * returns what it paid ({ order, money }) — the dish price plus a tip for
 * the patience still left. Returns null when no open order asks for it.
 */
export function serveDish(board, dishId) {
  const index = board.orders.findIndex((order) => order.dishId === dishId);
  if (index === -1) return null;
  const [order] = board.orders.splice(index, 1);
  const dish = DISHES.find((d) => d.id === dishId);
  const money = dish.price + tipFor(order.patience / order.maxPatience);
  return { order, money };
}

/** Stars for finishing the shift with `money` earned: 1 / 2 / 3. */
export function starsFor(money) {
  if (money >= 100) return 3;
  if (money >= 70) return 2;
  if (money >= 40) return 1;
  return 0;
}
