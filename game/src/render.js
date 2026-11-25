// Drawing for Sizzle & Serve: every pixel of the kitchen is drawn here
// in code — the floor, the stations, the food, the chef, the order board
// and the menus. No images are loaded; the game has no assets at all.
//
// drawGame(ctx, state) paints one frame. `state` is the object main.js
// keeps: phase, clock, money, orders, grill, board, plate, chef, flashes.

import { VIEW, STATIONS, WALK, nearestStation } from './kitchen.js';
import { ITEM_NAMES, dishById } from './recipes.js';
import { GRILL_SECONDS, CHOP_SECONDS } from './cooking.js';
import { starsFor } from './orders.js';

/** Food colours, one per item id. */
const FOOD_COLORS = {
  'bun': '#e8b06a',
  'patty-raw': '#d98a94',
  'patty-grilled': '#7a4a2b',
  'patty-burnt': '#2b2b2b',
  'lettuce-raw': '#5da244',
  'lettuce-chopped': '#79c25e',
  'tomato-raw': '#d9382b',
  'tomato-chopped': '#e85d4a',
  'cheese': '#f2c230',
};

/** Small helper: a filled rounded rectangle. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** A progress ring around (x, y): `fraction` 0..1 done, in `color`. */
function progressRing(ctx, x, y, r, fraction, color) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
  ctx.stroke();
}

/** One food item drawn at (x, y), about `size` pixels across. */
export function drawFoodIcon(ctx, item, x, y, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (item === 'bun') {
    ctx.fillStyle = '#c98f4e';
    roundRect(ctx, -s, -s * 0.15, s * 2, s * 0.6, s * 0.25);
    ctx.fillStyle = FOOD_COLORS.bun;
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(-s * 0.5, -s * 0.55, s * 0.18, s * 0.12);
    ctx.fillRect(s * 0.1, -s * 0.7, s * 0.18, s * 0.12);
  } else if (item === 'patty-raw' || item === 'patty-grilled' || item === 'patty-burnt') {
    ctx.fillStyle = FOOD_COLORS[item];
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    if (item === 'patty-grilled') {
      ctx.strokeStyle = '#4a2c17';
      ctx.lineWidth = 2;
      for (const off of [-0.4, 0, 0.4]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, off * s);
        ctx.lineTo(s * 0.7, off * s);
        ctx.stroke();
      }
    }
    if (item === 'patty-burnt') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.3);
      ctx.lineTo(s * 0.3, s * 0.3);
      ctx.moveTo(s * 0.3, -s * 0.3);
      ctx.lineTo(-s * 0.3, s * 0.3);
      ctx.stroke();
    }
  } else if (item === 'lettuce-raw') {
    ctx.fillStyle = FOOD_COLORS['lettuce-raw'];
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.2, -s * 0.2, s * 0.7, s * 0.45, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f7a2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, s * 0.2);
    ctx.quadraticCurveTo(0, -s * 0.5, s * 0.6, -s * 0.1);
    ctx.stroke();
  } else if (item === 'lettuce-chopped') {
    ctx.fillStyle = FOOD_COLORS['lettuce-chopped'];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      roundRect(ctx, -s * 0.15, -s, s * 0.3, s * 1.1, s * 0.15);
      ctx.restore();
    }
  } else if (item === 'tomato-raw') {
    ctx.fillStyle = FOOD_COLORS['tomato-raw'];
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f7a2e';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(-s * 0.35, -s * 0.25);
    ctx.lineTo(0, -s * 0.4);
    ctx.lineTo(s * 0.35, -s * 0.25);
    ctx.closePath();
    ctx.fill();
  } else if (item === 'tomato-chopped') {
    ctx.fillStyle = FOOD_COLORS['tomato-chopped'];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i - 1) * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, s * 0.9, -0.5, 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (item === 'cheese') {
    ctx.fillStyle = FOOD_COLORS.cheese;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6);
    ctx.lineTo(s, s * 0.6);
    ctx.lineTo(0, -s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a41f';
    ctx.beginPath();
    ctx.arc(-s * 0.25, s * 0.2, s * 0.14, 0, Math.PI * 2);
    ctx.arc(s * 0.3, s * 0.35, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A finished dish (a plate with its components) at (x, y). */
function drawPlatedDish(ctx, dish, x, y, size) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.62, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b9c0cc';
  ctx.lineWidth = 2;
  ctx.stroke();
  const comps = dish.components;
  comps.forEach((comp, i) => {
    drawFoodIcon(ctx, comp, x + (i - (comps.length - 1) / 2) * size * 0.32, y - size * 0.08, size * 0.42);
  });
}

/** The checkerboard kitchen floor. */
function drawFloor(ctx) {
  const tile = 48;
  for (let ty = 0; ty < 11; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#f2e3c6' : '#e6cf9f';
      ctx.fillRect(tx * tile, 100 + ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(120, 85, 40, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(WALK.x, WALK.y, WALK.w, WALK.h);
}

/** The top wall: the order board on the left, the clock and score on the right. */
function drawTopWall(ctx, state) {
  ctx.fillStyle = '#7a4a26';
  ctx.fillRect(0, 0, VIEW.width, 100);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, 92, VIEW.width, 8);
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ORDER BOARD', 16, 22);
  state.orders.orders.forEach((order, i) => {
    const x = 16 + i * 208;
    const y = 28;
    const w = 196;
    const h = 62;
    ctx.fillStyle = '#fffdf6';
    roundRect(ctx, x, y, w, h, 8);
    ctx.strokeStyle = order.patience / order.maxPatience < 0.35 ? '#d9382b' : '#b9a06a';
    ctx.lineWidth = 2;
    ctx.stroke();
    const dish = dishById(order.dishId);
    ctx.fillStyle = '#33302a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(dish.name, x + 10, y + 20);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b6257';
    ctx.fillText(`$${dish.price} + tip`, x + 10, y + 36);
    dish.components.forEach((comp, j) => {
      ctx.fillStyle = FOOD_COLORS[comp] ?? '#999';
      ctx.beginPath();
      ctx.arc(x + 16 + j * 20, y + 50, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e3d5b8';
    ctx.fillRect(x + 10, y + 52, w - 20, 5);
    ctx.fillStyle = frac > 0.5 ? '#5da244' : frac > 0.25 ? '#e8a13a' : '#d9382b';
    ctx.fillRect(x + 10, y + 52, (w - 20) * frac, 5);
  });
  if (state.orders.orders.length === 0) {
    ctx.fillStyle = '#f7ead0';
    ctx.font = '14px sans-serif';
    ctx.fillText('No orders — breathe!', 16, 60);
  }
  const right = 944;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 26px sans-serif';
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, right, 34);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`$${state.money}`, right, 60);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#f7ead0';
  ctx.fillText(`Served ${state.served}`, right, 82);
  for (let i = 0; i < 3; i++) {
    const hx = 668 + i * 26;
    const hy = 52;
    ctx.fillStyle = i < state.hearts ? '#e84a5f' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 10, hy - 4, hx - 5, hy - 12, hx, hy - 5);
    ctx.bezierCurveTo(hx + 5, hy - 12, hx + 10, hy - 4, hx, hy + 6);
    ctx.fill();
  }
  ctx.textAlign = 'left';
}

/** One ingredient bin: a counter with its food and label. */
function drawBin(ctx, station) {
  ctx.fillStyle = '#aeb6c2';
  roundRect(ctx, station.x, station.y, station.w, station.h, 6);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(station.x, station.y, station.w, 8);
  drawFoodIcon(ctx, station.item, station.x + 34, station.y + station.h / 2 + 4, 44);
  ctx.fillStyle = '#2c2a26';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(station.label, station.x + 62, station.y + 30);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#5b5348';
  ctx.fillText(ITEM_NAMES[station.item], station.x + 62, station.y + 48);
}

/** The grill with its two slots, cooking rings and smoke. */
function drawGrill(ctx, state) {
  const g = STATIONS.find((s) => s.id === 'grill');
  ctx.fillStyle = '#3a3f47';
  roundRect(ctx, g.x, g.y, g.w, g.h, 8);
  ctx.strokeStyle = '#202329';
  ctx.lineWidth = 3;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(g.x + 12, g.y + (i * g.h) / 5);
    ctx.lineTo(g.x + g.w - 12, g.y + (i * g.h) / 5);
    ctx.stroke();
  }
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GRILL', g.x + g.w / 2, g.y + 18);
  state.grill.forEach((slot, i) => {
    const cx = g.x + 62 + i * 96;
    const cy = g.y + 52;
    if (slot.state === 'empty') {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    drawFoodIcon(ctx, slot.state === 'burnt' ? 'patty-burnt' : slot.state === 'cooked' ? 'patty-grilled' : 'patty-raw', cx, cy, 40);
    if (slot.state === 'cooking') {
      progressRing(ctx, cx, cy, 28, 1 - slot.timer / GRILL_SECONDS, '#ffb347');
    } else if (slot.state === 'cooked') {
      ctx.fillStyle = '#7ee081';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('READY', cx, cy - 32);
    } else {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('BURNT!', cx, cy - 32);
    }
  });
  ctx.textAlign = 'left';
}

/** The chopping board with its timer ring. */
function drawChopBoard(ctx, state) {
  const c = STATIONS.find((s) => s.id === 'chop');
  ctx.fillStyle = '#c89b62';
  roundRect(ctx, c.x, c.y, c.w, c.h, 8);
  ctx.fillStyle = '#e8c795';
  roundRect(ctx, c.x + 14, c.y + 22, c.w - 28, c.h - 34, 6);
  ctx.fillStyle = '#2c2a26';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHOP', c.x + c.w / 2, c.y + 16);
  const board = state.chop;
  if (board.state !== 'empty') {
    drawFoodIcon(
      ctx,
      board.state === 'done' ? { 'lettuce-raw': 'lettuce-chopped', 'tomato-raw': 'tomato-chopped' }[board.item] : board.item,
      c.x + c.w / 2,
      c.y + 56,
      40,
    );
    if (board.state === 'chopping') {
      progressRing(ctx, c.x + c.w / 2, c.y + 56, 28, 1 - board.timer / CHOP_SECONDS, '#79c25e');
    } else {
      ctx.fillStyle = '#5da244';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('READY', c.x + c.w / 2, c.y + 26);
    }
  }
  ctx.textAlign = 'left';
}

/** The assembly plate, with the components already on it. */
function drawPlate(ctx, state) {
  const p = STATIONS.find((s) => s.id === 'plate');
  ctx.fillStyle = '#aeb6c2';
  roundRect(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fillStyle = '#2c2a26';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PLATE — BUILD THE DISH', p.x + p.w / 2, p.y + 16);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 56, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a94a3';
  ctx.lineWidth = 2;
  ctx.stroke();
  const comps = state.plate.components;
  comps.forEach((comp, i) => {
    drawFoodIcon(ctx, comp, p.x + p.w / 2 + (i - (comps.length - 1) / 2) * 30, p.y + 52, 30);
  });
  if (comps.length === 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.fillText('empty', p.x + p.w / 2, p.y + 60);
  }
  ctx.textAlign = 'left';
}

/** The serve window and the trash bin on the right wall. */
function drawServeAndTrash(ctx, state) {
  const serve = STATIONS.find((s) => s.id === 'serve');
  ctx.fillStyle = '#7a4a26';
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 6);
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE', serve.x + serve.w / 2, serve.y + 20);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(serve.x + serve.w / 2, serve.y + 52, 14, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(serve.x + serve.w / 2 - 16, serve.y + 52, 32, 4);
  ctx.fillStyle = '#2c2a26';
  ctx.font = '11px sans-serif';
  ctx.fillText('window', serve.x + serve.w / 2, serve.y + 84);
  ctx.fillText(`served ${state.served}`, serve.x + serve.w / 2, serve.y + 102);
  if (state.servedPlates && state.servedPlates.length > 0) {
    state.servedPlates.slice(-3).forEach((dish, i) => {
      drawPlatedDish(ctx, dish, serve.x + serve.w / 2, serve.y + 44 - i * 4, 34);
    });
  }
  const trash = STATIONS.find((s) => s.id === 'trash');
  ctx.fillStyle = '#4a4f57';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 6);
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TRASH', trash.x + trash.w / 2, trash.y + 20);
  ctx.strokeStyle = '#2c2f34';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(trash.x + 18, trash.y + 34);
  ctx.lineTo(trash.x + trash.w - 18, trash.y + 34);
  ctx.moveTo(trash.x + 22, trash.y + 34);
  ctx.lineTo(trash.x + 26, trash.y + trash.h - 12);
  ctx.moveTo(trash.x + trash.w - 22, trash.y + 34);
  ctx.lineTo(trash.x + trash.w - 26, trash.y + trash.h - 12);
  ctx.stroke();
  ctx.textAlign = 'left';
}

/** The chef, with a hat and whatever they are carrying overhead. */
function drawChef(ctx, chef, now) {
  const bob = chef.moving ? Math.sin(now / 90) * 2 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 16, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y + 4, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e07840';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y + 4, 15, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - 12, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 7, y - 20, 6, 0, Math.PI * 2);
  ctx.arc(x, y - 23, 7, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 10, y - 20, 20, 5);
  ctx.fillStyle = '#2c2a26';
  const look = chef.facing === 'left' ? -2 : chef.facing === 'right' ? 2 : 0;
  ctx.beginPath();
  ctx.arc(x - 4 + look, y - 13, 1.6, 0, Math.PI * 2);
  ctx.arc(x + 4 + look, y - 13, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c2a26';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + look, y - 9, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y - 40, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b9a06a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (chef.carrying.startsWith('dish:')) {
      drawPlatedDish(ctx, dishById(chef.carrying.slice(5)), x, y - 40, 26);
    } else {
      drawFoodIcon(ctx, chef.carrying, x, y - 40, 26);
    }
  }
}

/** Smoke puffs above the grill. */
function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.fillStyle = `rgba(200,200,200,${Math.max(0, p.ttl / p.max) * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Floating flash messages ("Served! +$14"). */
function drawFlashes(ctx, state) {
  ctx.textAlign = 'center';
  state.flashes.forEach((flash, i) => {
    const alpha = Math.max(0, flash.ttl / 1.6);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = `rgba(44,42,38,${alpha})`;
    ctx.fillText(flash.text, VIEW.width / 2, 130 + i * 24 - (1.6 - flash.ttl) * 12);
  });
  ctx.textAlign = 'left';
}

/** The "E — do this" hint above the nearest station. */
function drawHint(ctx, state) {
  if (state.phase !== 'playing') return;
  const station = nearestStation(state.chef.x, state.chef.y);
  if (!station) return;
  const hint = stationHint(state, station);
  if (!hint) return;
  ctx.font = 'bold 13px sans-serif';
  const w = ctx.measureText(hint).width + 18;
  const x = Math.max(8, Math.min(VIEW.width - w - 8, station.anchor.x - w / 2));
  const y = station.y - 26 < 104 ? station.y + station.h + 8 : station.y - 26;
  ctx.fillStyle = 'rgba(44,42,38,0.88)';
  roundRect(ctx, x, y, w, 24, 12);
  ctx.fillStyle = '#ffe9b0';
  ctx.textAlign = 'center';
  ctx.fillText(hint, x + w / 2, y + 17);
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  ctx.strokeRect(station.x - 2, station.y - 2, station.w + 4, station.h + 4);
}

/** What the E key does at this station right now, in a few words. */
function stationHint(state, station) {
  const chef = state.chef;
  if (station.kind === 'bin') {
    return chef.carrying ? 'Hands full' : `E — Take ${ITEM_NAMES[station.item]}`;
  }
  if (station.kind === 'grill') {
    if (chef.carrying === 'patty-raw') return 'E — Grill patty';
    if (state.grill.some((s) => s.state === 'cooked')) return 'E — Take grilled patty';
    if (state.grill.some((s) => s.state === 'burnt')) return 'E — Clear burnt patty';
    return 'E — Grill a raw patty';
  }
  if (station.kind === 'chop') {
    if (chef.carrying && (chef.carrying === 'lettuce-raw' || chef.carrying === 'tomato-raw')) {
      return 'E — Chop it';
    }
    if (state.chop.state === 'done') return 'E — Take chopped veg';
    return 'E — Chop lettuce / tomato';
  }
  if (station.kind === 'plate') {
    if (state.plate.components.length > 0 && !chef.carrying) {
      return 'E — Take dish';
    }
    return 'E — Add to plate';
  }
  if (station.kind === 'serve') {
    return chef.carrying && chef.carrying.startsWith('dish:') ? 'E — Serve dish!' : 'E — Serve a dish';
  }
  if (station.kind === 'trash') {
    return chef.carrying ? 'E — Throw it away' : 'E — Trash';
  }
  return null;
}

/** The start screen: title, how to play, and the start prompt. */
function drawMenu(ctx, now) {
  ctx.fillStyle = 'rgba(40,26,12,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fffdf6';
  roundRect(ctx, 210, 110, 540, 360, 16);
  ctx.strokeStyle = '#e07840';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#2c2a26';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('SIZZLE & SERVE', 480, 178);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#6b6257';
  ctx.fillText('One chef. One rush hour. Feed the lunch crowd.', 480, 206);
  ctx.textAlign = 'left';
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#2c2a26';
  const lines = [
    'Move: WASD / arrows, or click the floor to walk there',
    'Use a station: E or Space, or click the station',
    'Grill patties — take them off before they burn!',
    'Chop lettuce and tomato, build dishes on the plate',
    'Serve before the order ticket runs out of patience',
    '3 failed orders end the shift — survive 3 minutes!',
  ];
  lines.forEach((line, i) => ctx.fillText('•  ' + line, 250, 244 + i * 26));
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#e07840';
  const blink = Math.floor(now / 500) % 2 === 0;
  if (blink) ctx.fillText('Press Enter or click to start the shift', 480, 432);
  ctx.textAlign = 'left';
}

/** The end-of-shift screen: win or lose, stars and stats. */
function drawEnd(ctx, state, now) {
  ctx.fillStyle = 'rgba(40,26,12,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fffdf6';
  roundRect(ctx, 230, 120, 500, 330, 16);
  ctx.strokeStyle = state.won ? '#e8a13a' : '#d9382b';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2c2a26';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(state.won ? 'SHIFT COMPLETE!' : 'SHIFT FAILED', 480, 180);
  if (state.won) {
    const stars = starsFor(state.money);
    ctx.font = '40px sans-serif';
    let starText = '';
    for (let i = 0; i < 3; i++) starText += i < stars ? '★' : '☆';
    ctx.fillStyle = '#e8a13a';
    ctx.fillText(starText, 480, 232);
  } else {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#6b6257';
    ctx.fillText('Too many customers walked out hungry.', 480, 226);
  }
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#2c2a26';
  ctx.fillText(`Money earned: $${state.money}`, 480, 282);
  ctx.fillText(`Dishes served: ${state.served}    Orders lost: ${state.failed}`, 480, 312);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#e07840';
  const blink = Math.floor(now / 500) % 2 === 0;
  if (blink) ctx.fillText('Press R to work another shift', 480, 410);
  ctx.textAlign = 'left';
}

/** One frame of the game. */
export function drawGame(ctx, state) {
  // Shot states freeze the clock so a screenshot renders the same every
  // time; the live game uses the real clock for its blinking prompts.
  const now = state.frozenNow !== undefined ? state.frozenNow : performance.now();
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  for (const station of STATIONS) {
    if (station.kind === 'bin') drawBin(ctx, station);
  }
  drawGrill(ctx, state);
  drawChopBoard(ctx, state);
  drawPlate(ctx, state);
  drawServeAndTrash(ctx, state);
  drawParticles(ctx, state);
  drawChef(ctx, state.chef, now);
  drawTopWall(ctx, state);
  drawHint(ctx, state);
  drawFlashes(ctx, state);
  if (state.phase === 'menu') drawMenu(ctx, now);
  if (state.phase === 'over') drawEnd(ctx, state, now);
  if (state.phase === 'paused') {
    ctx.fillStyle = 'rgba(40,26,12,0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fffdf6';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — press P to resume', 480, 300);
    ctx.textAlign = 'left';
  }
}
