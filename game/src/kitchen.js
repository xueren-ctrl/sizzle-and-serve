// The kitchen's layout: where the stations are, where the chef may walk,
// and which station the chef is standing at.
//
// Canvas: 960 x 600. The top strip (y 0..100) is the wall with the order
// board and the shift clock. The floor (y 106..600) holds the ingredient
// bins on the left, the grill / chopping board / assembly plate along the
// bottom, and the serve window and trash on the right wall. The chef walks
// the open floor between them.

/** The canvas size in pixels. */
export const VIEW = { width: 960, height: 600 };

/** The rectangle the chef may walk in (stations sit outside it). */
export const WALK = { x: 148, y: 106, w: 732, h: 384 };

/** How close the chef must be to a station's anchor to use it. */
export const USE_RANGE = 74;

/**
 * Every station: its kind, its rectangle on the floor, the point the chef
 * stands at to use it, and the label drawn on it.
 *
 * kinds: 'bin' (hands out one raw item), 'grill' (cooks patties),
 * 'chop' (chops lettuce and tomato), 'plate' (assembles dishes),
 * 'serve' (hands a finished dish to a customer), 'trash' (throws away).
 */
export const STATIONS = [
  { id: 'bin-bun', kind: 'bin', item: 'bun', label: 'BUNS', x: 8, y: 116, w: 132, h: 70, anchor: { x: 148, y: 151 } },
  { id: 'bin-patty', kind: 'bin', item: 'patty-raw', label: 'PATTY', x: 8, y: 191, w: 132, h: 70, anchor: { x: 148, y: 226 } },
  { id: 'bin-lettuce', kind: 'bin', item: 'lettuce-raw', label: 'LETTUCE', x: 8, y: 266, w: 132, h: 70, anchor: { x: 148, y: 301 } },
  { id: 'bin-tomato', kind: 'bin', item: 'tomato-raw', label: 'TOMATO', x: 8, y: 341, w: 132, h: 70, anchor: { x: 148, y: 376 } },
  { id: 'bin-cheese', kind: 'bin', item: 'cheese', label: 'CHEESE', x: 8, y: 416, w: 132, h: 70, anchor: { x: 148, y: 451 } },
  { id: 'grill', kind: 'grill', label: 'GRILL', x: 170, y: 496, w: 220, h: 88, anchor: { x: 280, y: 490 } },
  { id: 'chop', kind: 'chop', label: 'CHOP', x: 420, y: 496, w: 180, h: 88, anchor: { x: 510, y: 490 } },
  { id: 'plate', kind: 'plate', label: 'PLATE', x: 630, y: 496, w: 220, h: 88, anchor: { x: 740, y: 490 } },
  { id: 'serve', kind: 'serve', label: 'SERVE', x: 888, y: 260, w: 64, h: 120, anchor: { x: 880, y: 320 } },
  { id: 'trash', kind: 'trash', label: 'TRASH', x: 888, y: 420, w: 64, h: 80, anchor: { x: 880, y: 460 } },
];

/** A station by id, or undefined. */
export function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

/**
 * The station whose anchor is nearest to (x, y), when it is within
 * USE_RANGE; null when the chef is not near any station.
 */
export function nearestStation(x, y, range = USE_RANGE) {
  let best = null;
  let bestDist = range;
  for (const station of STATIONS) {
    const dx = station.anchor.x - x;
    const dy = station.anchor.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      best = station;
      bestDist = dist;
    }
  }
  return best;
}

/** Clamps a point into the walkable floor, keeping `radius` inside it. */
export function clampToWalk(x, y, radius) {
  return {
    x: Math.max(WALK.x + radius, Math.min(WALK.x + WALK.w - radius, x)),
    y: Math.max(WALK.y + radius, Math.min(WALK.y + WALK.h - radius, y)),
  };
}
