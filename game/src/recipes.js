// Ingredients and dishes for Sizzle & Serve.
//
// An item the chef carries is one of:
//   bun, patty-raw, lettuce-raw, tomato-raw, cheese        (as picked up)
//   patty-grilled, lettuce-chopped, tomato-chopped          (after prep)
// A plate holds prepared components only. A dish is complete when the
// plate's component set is exactly one dish's component set.

/** Raw ingredients the bins hand out, in bin order. */
export const BIN_ITEMS = ['bun', 'patty-raw', 'lettuce-raw', 'tomato-raw', 'cheese'];

/** Human name for every carried item or plate component. */
export const ITEM_NAMES = {
  'bun': 'Bun',
  'patty-raw': 'Raw Patty',
  'patty-grilled': 'Grilled Patty',
  'lettuce-raw': 'Lettuce',
  'lettuce-chopped': 'Chopped Lettuce',
  'tomato-raw': 'Tomato',
  'tomato-chopped': 'Chopped Tomato',
  'cheese': 'Cheese',
};

/** Which station preps a raw item, or null when it needs none. */
export const PREP_STATION = {
  'patty-raw': 'grill',
  'lettuce-raw': 'chop',
  'tomato-raw': 'chop',
  'bun': null,
  'cheese': null,
};

/** What a raw item becomes after its prep finishes. */
export const PREPPED_ITEM = {
  'patty-raw': 'patty-grilled',
  'lettuce-raw': 'lettuce-chopped',
  'tomato-raw': 'tomato-chopped',
};

/** The dishes the order board can ask for. */
export const DISHES = [
  {
    id: 'burger',
    name: 'Burger',
    components: ['bun', 'patty-grilled', 'lettuce-chopped'],
    price: 12,
  },
  {
    id: 'melt',
    name: 'Cheese Melt',
    components: ['bun', 'patty-grilled', 'cheese'],
    price: 11,
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    components: ['lettuce-chopped', 'tomato-chopped', 'cheese'],
    price: 9,
  },
];

/** A dish by id, or undefined. */
export function dishById(id) {
  return DISHES.find((dish) => dish.id === id);
}

/**
 * The dish a plate of `components` (a Set or array of component ids) is,
 * when its set is exactly one dish's component set; null otherwise.
 */
export function dishForComponents(components) {
  const held = new Set(components);
  for (const dish of DISHES) {
    if (dish.components.length !== held.size) continue;
    if (dish.components.every((c) => held.has(c))) return dish;
  }
  return null;
}

/**
 * Whether `component` may be added to a plate that already holds
 * `components`: the result must still be a subset of at least one dish,
 * so a plate can never be built into a dish nobody ordered.
 */
export function canAddComponent(components, component) {
  const held = new Set(components);
  if (held.has(component)) return false;
  held.add(component);
  return DISHES.some(
    (dish) =>
      dish.components.length >= held.size &&
      [...held].every((c) => dish.components.includes(c)),
  );
}

/** The tip for serving with `fraction` of the order's patience left (0..1). */
export function tipFor(fraction) {
  return Math.round(5 * Math.max(0, Math.min(1, fraction)));
}
