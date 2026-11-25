// Seeded random numbers for Sizzle & Serve.
//
// Every random choice in the game (which dish an order asks for, the shot
// scenes) comes from one of these, so a shot renders exactly the same every
// time for the same seed. The live game uses a time-based seed; the shots
// use the seed from the URL query.

/** mulberry32: a tiny deterministic generator. `seed` is any integer. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A small random helper built on one generator.
 * - next() -> [0, 1)
 * - int(min, max) -> whole number in [min, max]
 * - pick(list) -> one element of list
 * - chance(p) -> true with probability p
 */
export function makeRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    chance(p) {
      return next() < p;
    },
  };
}

/** A seed from the current time, for a fresh live game. */
export function timeSeed() {
  return (Date.now() % 2147483647) | 0;
}
