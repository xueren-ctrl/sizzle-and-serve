// Cooking: the grill, the chopping board and the assembly plate.
//
// A grill slot holds one patty: raw -> cooking (6 s) -> cooked, and then
// it burns if it sits 4 more seconds. The chopping board holds one item
// for 3 s and hands back its chopped form. The plate collects prepared
// components; when its set is exactly one dish's set, the dish is ready
// to carry to the serve window.
//
// Every function here takes the state it changes and returns a short
// report of what happened, so the game can play a sound and flash a hint.

import { PREPPED_ITEM, canAddComponent, dishForComponents } from './recipes.js';

/** Seconds a patty grills before it is cooked. */
export const GRILL_SECONDS = 6;
/** Seconds after cooked before a patty on the grill burns. */
export const BURN_AFTER_SECONDS = 4;
/** Seconds an item spends on the chopping board. */
export const CHOP_SECONDS = 3;

/** Two empty grill slots. A slot: { item, timer, state } with state one of 'empty' | 'cooking' | 'cooked' | 'burnt'. */
export function makeGrill() {
  return [
    { item: null, timer: 0, state: 'empty' },
    { item: null, timer: 0, state: 'empty' },
  ];
}

/** One empty chopping board. A board: { item, timer, state } with state 'empty' | 'chopping' | 'done'. */
export function makeChopBoard() {
  return { item: null, timer: 0, state: 'empty' };
}

/** An empty assembly plate. A plate: { components: [] }. */
export function makePlate() {
  return { components: [] };
}

/** Advances the grill and the board by `dt` seconds (timers, burning). */
export function updateCooking(grill, board, dt) {
  for (const slot of grill) {
    if (slot.state === 'cooking') {
      slot.timer -= dt;
      if (slot.timer <= 0) {
        slot.state = 'cooked';
        slot.timer = BURN_AFTER_SECONDS;
      }
    } else if (slot.state === 'cooked') {
      slot.timer -= dt;
      if (slot.timer <= 0) slot.state = 'burnt';
    }
  }
  if (board.state === 'chopping') {
    board.timer -= dt;
    if (board.timer <= 0) board.state = 'done';
  }
}

/**
 * Puts `item` (a raw patty) on a free grill slot. Returns true when it
 * went on, false when both slots are busy.
 */
export function placeOnGrill(grill, item) {
  const slot = grill.find((s) => s.state === 'empty');
  if (!slot) return false;
  slot.item = item;
  slot.timer = GRILL_SECONDS;
  slot.state = 'cooking';
  return true;
}

/**
 * Takes the cooked patty off a grill slot (the first cooked one), or the
 * burnt one when there is no cooked one. Returns the item id, or null
 * when every slot is empty or still cooking.
 */
export function takeFromGrill(grill) {
  const slot =
    grill.find((s) => s.state === 'cooked') ?? grill.find((s) => s.state === 'burnt');
  if (!slot) return null;
  const item = slot.state === 'burnt' ? 'patty-burnt' : PREPPED_ITEM[slot.item];
  slot.item = null;
  slot.timer = 0;
  slot.state = 'empty';
  return item;
}

/** Whether any grill slot holds a cooked patty ready to take. */
export function grillHasCooked(grill) {
  return grill.some((s) => s.state === 'cooked');
}

/**
 * Puts `item` (raw lettuce or tomato) on the chopping board. Returns true
 * when it went on, false when the board is busy.
 */
export function placeOnBoard(board, item) {
  if (board.state !== 'empty') return false;
  board.item = item;
  board.timer = CHOP_SECONDS;
  board.state = 'chopping';
  return true;
}

/**
 * Takes the chopped item off the board. Returns its id, or null when the
 * board is empty or still chopping.
 */
export function takeFromBoard(board) {
  if (board.state !== 'done') return null;
  const item = PREPPED_ITEM[board.item];
  board.item = null;
  board.timer = 0;
  board.state = 'empty';
  return item;
}

/**
 * Adds a prepared `component` to the plate. Returns 'added' when it went
 * on, 'dish' when the plate now holds a complete dish, or 'refused' when
 * the component fits no dish with what is already on the plate.
 */
export function addToPlate(plate, component) {
  if (!canAddComponent(plate.components, component)) return 'refused';
  plate.components.push(component);
  return dishForComponents(plate.components) ? 'dish' : 'added';
}

/** The finished dish on the plate, when its components make one; else null. */
export function plateDish(plate) {
  return dishForComponents(plate.components);
}

/** Lifts the finished dish off the plate, clearing it. Returns the dish, or null. */
export function takeDishOffPlate(plate) {
  const dish = plateDish(plate);
  if (!dish) return null;
  plate.components = [];
  return dish;
}
