// The chef: movement, the thing in their hands, and using a station.
//
// The chef walks the kitchen floor with the arrow keys or WASD, or by
// clicking a spot to walk to. E or Space (or clicking a station) uses the
// nearest station: take an ingredient, grill or chop it, add it to the
// plate, or serve a finished dish. The chef carries at most one thing.

import { clampToWalk, nearestStation } from './kitchen.js';
import { PREP_STATION } from './recipes.js';
import {
  addToPlate,
  grillHasCooked,
  placeOnBoard,
  placeOnGrill,
  plateDish,
  takeDishOffPlate,
  takeFromBoard,
  takeFromGrill,
} from './cooking.js';

/** Walking speed in pixels per second. */
export const CHEF_SPEED = 230;
/** The chef's drawn radius. */
export const CHEF_RADIUS = 16;

/** A chef standing in the middle of the floor, hands empty. */
export function makeChef() {
  return {
    x: 514,
    y: 300,
    facing: 'down',
    carrying: null,
    target: null,
    pendingStation: null,
    moving: false,
  };
}

/**
 * Walks the chef one step: keyboard directions win over a click target.
 * `keys` is a Set of pressed key names ('up' | 'down' | 'left' | 'right').
 * Returns nothing; the chef's x, y, facing and moving are updated.
 */
export function moveChef(chef, keys, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('left')) dx -= 1;
  if (keys.has('right')) dx += 1;
  if (keys.has('up')) dy -= 1;
  if (keys.has('down')) dy += 1;
  if (dx !== 0 || dy !== 0) {
    chef.target = null;
    chef.pendingStation = null;
  } else if (chef.target) {
    const tx = chef.target.x - chef.x;
    const ty = chef.target.y - chef.y;
    const dist = Math.sqrt(tx * tx + ty * ty);
    if (dist < 6) {
      chef.target = null;
    } else {
      dx = tx / dist;
      dy = ty / dist;
    }
  }
  if (dx === 0 && dy === 0) {
    chef.moving = false;
    return;
  }
  const len = Math.sqrt(dx * dx + dy * dy);
  const step = CHEF_SPEED * dt;
  const next = clampToWalk(
    chef.x + (dx / len) * step,
    chef.y + (dy / len) * step,
    CHEF_RADIUS,
  );
  chef.x = next.x;
  chef.y = next.y;
  chef.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  chef.moving = true;
}

/**
 * Uses the station nearest the chef. `serve` is a callback the game
 * passes in: serve(dishId) -> money earned, or null when no order wants
 * the dish. Returns a report { ok, message } for the game's flash text
 * and sounds, or null when no station is in reach.
 *
 * `world` holds the grill, board and plate the stations work on.
 */
export function useStation(chef, world, serve) {
  const station = nearestStation(chef.x, chef.y);
  if (!station) return null;

  if (station.kind === 'bin') {
    if (chef.carrying) return { ok: false, message: 'Hands full!' };
    chef.carrying = station.item;
    return { ok: true, message: `Took ${station.label.toLowerCase()}`, sound: 'pickup' };
  }

  if (station.kind === 'grill') {
    if (chef.carrying === 'patty-raw') {
      if (placeOnGrill(world.grill, chef.carrying)) {
        chef.carrying = null;
        return { ok: true, message: 'Patty on the grill', sound: 'place' };
      }
      return { ok: false, message: 'Grill is full!' };
    }
    if (!chef.carrying && grillHasCooked(world.grill)) {
      chef.carrying = takeFromGrill(world.grill);
      return { ok: true, message: 'Took grilled patty', sound: 'pickup' };
    }
    if (!chef.carrying) {
      const burnt = takeFromGrill(world.grill);
      if (burnt) {
        chef.carrying = burnt;
        return { ok: true, message: 'Burnt! Bin it.', sound: 'pickup' };
      }
    }
    return { ok: false, message: 'Grill a raw patty here' };
  }

  if (station.kind === 'chop') {
    if (chef.carrying && PREP_STATION[chef.carrying] === 'chop') {
      if (placeOnBoard(world.chop, chef.carrying)) {
        chef.carrying = null;
        return { ok: true, message: 'Chopping…', sound: 'place' };
      }
      return { ok: false, message: 'Board is busy!' };
    }
    if (!chef.carrying) {
      const chopped = takeFromBoard(world.chop);
      if (chopped) {
        chef.carrying = chopped;
        return { ok: true, message: 'Took chopped veg', sound: 'pickup' };
      }
    }
    return { ok: false, message: 'Chop lettuce or tomato' };
  }

  if (station.kind === 'plate') {
    const dish = plateDish(world.plate);
    if (dish && !chef.carrying) {
      takeDishOffPlate(world.plate);
      chef.carrying = `dish:${dish.id}`;
      return { ok: true, message: `${dish.name} ready!`, sound: 'pickup' };
    }
    if (chef.carrying && !chef.carrying.startsWith('dish:') && chef.carrying !== 'patty-burnt') {
      const result = addToPlate(world.plate, chef.carrying);
      if (result === 'refused') return { ok: false, message: 'Does not fit any dish!' };
      chef.carrying = null;
      return {
        ok: true,
        message: result === 'dish' ? 'Dish complete!' : 'Added to plate',
        sound: result === 'dish' ? 'dish' : 'place',
      };
    }
    return { ok: false, message: 'Add prepped food to the plate' };
  }

  if (station.kind === 'serve') {
    if (chef.carrying && chef.carrying.startsWith('dish:')) {
      const dishId = chef.carrying.slice(5);
      const money = serve(dishId);
      if (money === null) return { ok: false, message: 'No order for this dish!' };
      chef.carrying = null;
      return { ok: true, message: `Served! +$${money}`, sound: 'serve', money };
    }
    return { ok: false, message: 'Bring a finished dish' };
  }

  if (station.kind === 'trash') {
    if (chef.carrying) {
      chef.carrying = null;
      return { ok: true, message: 'Binned it', sound: 'trash' };
    }
    return { ok: false, message: 'Nothing to bin' };
  }

  return null;
}
