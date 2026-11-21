// Cocina Caótica · Zairene y el Palomito
// Juego cooperativo pixel art para 2 jugadores en línea (WebRTC con PeerJS).
'use strict';

/* ======================= CONSTANTES ======================= */
const T = 16, HUD = 36;
// . piso | C mostrador | T tomate | L lechuga | B pan | M carne
// K tabla de picar | F estufa | P platos | S ventanilla | X basura
const MAP = [
  'CTCLCBCMCCPCSC',
  'C............S',
  'K............C',
  'K....CCCC....F',
  'C....CCCC....F',
  'C............F',
  'X............C',
  'CCKCCCCCCCPCCC',
];
const W = MAP[0].length, H = MAP.length, VW = W * T, VH = H * T + HUD;
const ROUND_TIME = 180, SPEED = 72, ROOM_PREFIX = 'cocina-zyp-';
const CRATE = { T: 'tomato', L: 'lettuce', B: 'bread', M: 'meat' };
const RECIPES = [
  { n: 'Ensalada', ing: ['lettuce', 'tomato'], pts: 20, tm: 55 },
  { n: 'Hamburguesa', ing: ['bread', 'meat'], pts: 30, tm: 65 },
  { n: 'Burger verde', ing: ['bread', 'meat', 'lettuce'], pts: 40, tm: 75 },
  { n: 'Burger del amor', ing: ['bread', 'meat', 'lettuce', 'tomato'], pts: 55, tm: 90 },
];
const READY = { tomato: 'tomato_chop', lettuce: 'lettuce_chop', bread: 'bread_raw', meat: 'meat_cook' };

/* ======================= SPRITES ======================= */
const SP = {};
function mk(name, rows, pal) {
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); }
  }));
  SP[name] = c;
}
const PZ = { w: '#fff8f0', g: '#c9c2d6', h: '#5a3220', s: '#ffcfa8', k: '#2a1a22', p: '#ff7eb6', P: '#c4467f', r: '#ff9aa8', b: '#6b3d22' };
mk('z', [
  '...wwwwww...',
  '..wwwwwwww..',
  '..wwwwwwww..',
  '...gggggg...',
  '..hhhhhhhh..',
  '.hhsssssshh.',
  '.hhsksskshh.',
  '.hhrssssrhh.',
  '.hhhsssshhh.',
  '.hhppwwpphh.',
  '..pppwwppp..',
  '.sppwwwwpps.',
  '..ppwwwwpp..',
  '..PPPPPPPP..',
  '...PP..PP...',
  '...bb..bb...',
], PZ);
const PP = { w: '#fff8f0', g: '#c9c2d6', d: '#dfe3ee', y: '#ffb02e', n: '#231a1a', s: '#f2b88f', k: '#2a1a22', u: '#5b8cff', U: '#3352b8', b: '#6b3d22' };
mk('p', [
  '...ddddy....',
  '..wwwwwwww..',
  '..wwwwwwww..',
  '...gggggg...',
  '..nnnnnnnn..',
  '..nssssssn..',
  '..skssssks..',
  '..ssnnnnss..',
  '...ssssss...',
  '.uuuwwwwuuu.',
  '.uuuwwwwuuu.',
  '.suuwwwwuus.',
  '..uuwwwwuu..',
  '..UUUUUUUU..',
  '...UU..UU...',
  '...bb..bb...',
], PP);
const PI = {
  r: '#e8443a', R: '#a8221e', g: '#4caf3a', G: '#2f7d24', L: '#ff9c8c', p: '#ff7a6e', y: '#ffe08a',
  o: '#e9a24c', O: '#b8732e', m: '#e0707a', M: '#a8434e', w: '#ffe1e1', c: '#8a5230', C: '#5c3418', k: '#3a2a26', K: '#1d1412'
};
mk('tomato_raw', ['...gg...', '.rrggrr.', 'rrLrrrrr', 'rLrrrrrr', 'rrrrrrrR', 'rrrrrrRR', '.rrrrRR.', '..RRRR..'], PI);
mk('tomato_chop', ['........', '.rrr.rr.', 'rpyprpyr', 'ryppryyr', 'rpypRppR', '.rrr.RR.', '..rrr...', '........'], PI);
mk('lettuce_raw', ['..gggg..', '.gGggGg.', 'gGggGggg', 'ggGgggGg', 'gggGgGgg', 'gGgggggG', '.ggGggg.', '..gggg..'], PI);
mk('lettuce_chop', ['........', '.g..G.g.', '..gG.gg.', '.G.gg.G.', 'g.gG.gg.', '.gg.Gg.g', '..g..g..', '........'], PI);
mk('bread_raw', ['........', '..oooo..', '.oyoooo.', 'ooooyooo', 'oOOOOOOo', 'OOOOOOOO', '.OOOOOO.', '........'], PI);
mk('meat_raw', ['........', '.mmmm...', 'mmmmmmm.', 'mmwmmmmm', 'mmmwmmmm', '.mmmmmMM', '..MMMMM.', '........'], PI);
const PATTY = ['........', '........', '..mmmm..', '.mmmmmm.', 'mmmmmmmm', '.MMMMMM.', '..MMMM..', '........'];
mk('meat_chop', PATTY, PI);
mk('meat_cook', PATTY, { ...PI, m: PI.c, M: PI.C });
mk('meat_burn', PATTY, { ...PI, m: PI.k, M: PI.K });
mk('plate', ['..wwwwwwww..', '.wggggggggw.', 'wgwwwwwwwwgw', 'wgwwwwwwwwgw', '.wggggggggw.', '..wwwwwwww..'], { w: '#ffffff', g: '#b8c4d8' });
mk('heart', ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff4f8b' });
mk('bell', ['...yy...', '..yyyy..', '.yyyyyy.', '.yyYyyy.', 'yyyyyyyy', 'kkkkkkkk'], { y: '#ffc93c', Y: '#fff2b3', k: '#7a5a20' });
mk('coin', ['.yyyy.', 'yYyyyy', 'yYyyyy', 'yyyyyy', 'yyyyOy', '.yyyy.'], { y: '#ffc93c', Y: '#fff2b3', O: '#c98a10' });

/* ======================= ESTADO ======================= */
const cv = document.getElementById('game');
let ctx = cv.getContext('2d');
let S = 1;                    // escala de pantalla
let isHost = true, solo = false, myIdx = 0, myChar = 'z';
let peer = null, conn = null;
let phase = 'menu';           // menu | lobby | play | end
let players = [], slots = {}, orders = [], effects = [];
let score = 0, served = 0, failed = 0, timeLeft = ROUND_TIME, countdown = 0;
let nextOrder = 0, elapsed = 0, roundId = 0, seenRound = -1, sndQ = [];
let sendAcc = 0, chopSnd = 0, lastCd = 0;

function newPlayer(ch, i) {
  return { ch, x: i ? 10 * T + 8 : 3 * T + 8, y: 5 * T + 8, fx: i ? -1 : 1, fy: 0, hand: null, chop: false, mv: false, dx: 0, dy: 0 };
}

/* ======================= SONIDO ======================= */
let AC = null;
function ensureAudio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, d, type = 'square', v = 0.05, slide = 0, delay = 0) {
  if (!AC) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  pick: () => tone(660, .07), drop: () => tone(440, .07), no: () => tone(160, .15, 'sawtooth', .04),
  trash: () => tone(300, .2, 'triangle', .08, -200), chop: () => tone(1100, .03, 'square', .025),
  ding: () => { tone(988, .12, 'triangle', .12); tone(1319, .3, 'triangle', .12, 0, .1); },
  cook: () => tone(784, .15, 'triangle', .08), burn: () => tone(110, .45, 'sawtooth', .06),
  order: () => { tone(523, .08, 'square', .035); tone(659, .1, 'square', .035, 0, .08); },
  fail: () => tone(220, .35, 'square', .05, -120), go: () => tone(880, .35, 'square', .06), beep: () => tone(440, .12, 'square', .05),
};
function play(n) { SFX[n] && SFX[n](); }
function sfx(n) { if (isHost) { sndQ.push(n); play(n); } }

/* ======================= MAPA / FÍSICA ======================= */
const tile = (tx, ty) => (tx < 0 || ty < 0 || tx >= W || ty >= H) ? '#' : MAP[ty][tx];
const solidAt = (px, py) => tile(Math.floor(px / T), Math.floor(py / T)) !== '.';
const boxFree = (x, y) => !solidAt(x - 5, y - 4) && !solidAt(x + 5, y - 4) && !solidAt(x - 5, y + 3) && !solidAt(x + 5, y + 3);
function target(p) {
  let tx, ty;
  if (Math.abs(p.fx) >= Math.abs(p.fy)) { tx = Math.floor((p.x + Math.sign(p.fx) * 12) / T); ty = Math.floor(p.y / T); }
  else { tx = Math.floor(p.x / T); ty = Math.floor((p.y + Math.sign(p.fy) * 12) / T); }
  const ch = tile(tx, ty);
  return (ch === '.' || ch === '#') ? null : { x: tx, y: ty, ch, k: tx + ',' + ty };
}

/* ======================= LÓGICA (anfitrión) ======================= */
const canPlate = it => it && it.t !== 'plate' && READY[it.t] === it.t + '_' + it.s;
function addToPlate(pl, it) {
  if (!canPlate(it) || pl.c.includes(it.t) || pl.c.length >= 4) return false;
  pl.c.push(it.t); return true;
}
function fxText(x, y, txt, c) { effects.push({ k: 't', x, y, txt, c, l: 1.2 }); }
function fxHearts(x, y) { for (let i = 0; i < 5; i++) effects.push({ k: 'h', x: x + (Math.random() * 20 - 10), y: y + Math.random() * 6, l: 1 + Math.random() * .6 }); }

function interact(p) {
  if (phase !== 'play' || countdown > 0) return;
  const tg = target(p); if (!tg) return;
  const hand = p.hand, ch = tg.ch;
  const cx = tg.x * T + 8, cy = tg.y * T;
  if (CRATE[ch]) {
    const it = { t: CRATE[ch], s: 'raw', p: 0, k: 0 };
    if (!hand) { p.hand = it; sfx('pick'); }
    else if (hand.t === 'plate') { if (addToPlate(hand, it)) sfx('pick'); else sfx('no'); }
    else sfx('no');
    return;
  }
  if (ch === 'P') {
    if (!hand) { p.hand = { t: 'plate', c: [] }; sfx('pick'); }
    else if (canPlate(hand)) { p.hand = { t: 'plate', c: [hand.t] }; sfx('pick'); }
    else sfx('no');
    return;
  }
  if (ch === 'X') {
    if (!hand) return;
    if (hand.t === 'plate') hand.c = []; else p.hand = null;
    sfx('trash'); return;
  }
  if (ch === 'S') { serve(p, cx, cy); return; }
  // mostrador, tabla o estufa
  const slot = slots[tg.k];
  if (!hand && slot) { p.hand = slot; delete slots[tg.k]; sfx('pick'); return; }
  if (hand && !slot) {
    if (ch === 'F' && !(hand.t === 'meat' && hand.s !== 'raw')) { fxText(cx, cy, '?!', '#ff6b6b'); sfx('no'); return; }
    if (ch === 'K' && hand.t === 'plate') { sfx('no'); return; }
    slots[tg.k] = hand; p.hand = null; sfx('drop'); return;
  }
  if (hand && slot) {
    if (hand.t === 'plate' && slot.t !== 'plate') { if (addToPlate(hand, slot)) { delete slots[tg.k]; sfx('pick'); } else sfx('no'); return; }
    if (slot.t === 'plate' && hand.t !== 'plate') { if (addToPlate(slot, hand)) { p.hand = null; sfx('drop'); } else sfx('no'); return; }
    sfx('no');
  }
}
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
function serve(p, cx, cy) {
  const h = p.hand;
  if (!h || h.t !== 'plate' || !h.c.length) { sfx('no'); return; }
  const i = orders.findIndex(o => sameSet(RECIPES[o.r].ing, h.c));
  if (i < 0) { fxText(cx - 10, cy + 4, '?!', '#ff6b6b'); sfx('no'); return; }
  const o = orders[i], pts = RECIPES[o.r].pts + Math.ceil(10 * o.left / o.max);
  score += pts; served++; orders.splice(i, 1); p.hand = null;
  fxText(cx - 10, cy + 4, '+' + pts, '#ffc93c'); fxHearts(cx - 8, cy + 6); sfx('ding');
}
function spawnOrder() {
  const pool = elapsed < 35 ? [0, 1] : elapsed < 80 ? [0, 1, 2] : [0, 1, 2, 3, 3];
  const r = pool[Math.floor(Math.random() * pool.length)];
  orders.push({ r, left: RECIPES[r].tm, max: RECIPES[r].tm });
  sfx('order');
}
function startRound() {
  roundId++;
  slots = {}; orders = []; effects = [];
  score = 0; served = 0; failed = 0; timeLeft = ROUND_TIME; elapsed = 0; nextOrder = 0.5; countdown = 3.5; lastCd = 4;
  players.forEach((p, i) => { const n = newPlayer(p.ch, i); Object.assign(p, n); p.dx = p.x; p.dy = p.y; });
  setPhase('play');
}
function updateWorld(dt) {
  if (countdown > 0) {
    countdown -= dt;
    const c = Math.ceil(countdown);
    if (c !== lastCd) { lastCd = c; sfx(c > 0 ? 'beep' : 'go'); }
    return;
  }
  timeLeft -= dt; elapsed += dt;
  // pedidos
  nextOrder -= dt;
  if (nextOrder <= 0) {
    if (orders.length < 4) spawnOrder();
    nextOrder = Math.max(9, 16 - elapsed / 20) + Math.random() * 4;
  }
  if (orders.length === 0 && nextOrder > 2) nextOrder = 2;
  for (let i = orders.length - 1; i >= 0; i--) {
    orders[i].left -= dt;
    if (orders[i].left <= 0) {
      orders.splice(i, 1); score = Math.max(0, score - 10); failed++;
      fxText(VW - 60, -4, '-10', '#ff6b6b'); sfx('fail');
    }
  }
  // estufas
  for (const k in slots) {
    const it = slots[k], [tx, ty] = k.split(',').map(Number);
    if (tile(tx, ty) !== 'F' || it.t !== 'meat') continue;
    if (it.s === 'chop' || it.s === 'cook') {
      it.k += dt / 6;
      if (it.s === 'chop' && it.k >= 1) { it.s = 'cook'; sfx('cook'); }
      else if (it.s === 'cook' && it.k >= 2.4) { it.s = 'burn'; sfx('burn'); fxText(tx * T + 4, ty * T, '!!', '#ff6b6b'); }
    }
  }
  // picar
  let anyChop = false;
  players.forEach(p => {
    p.chopping = false;
    if (!p.chop || p.hand) return;
    const tg = target(p);
    if (!tg || tg.ch !== 'K') return;
    const it = slots[tg.k];
    if (it && it.t !== 'plate' && it.t !== 'bread' && it.s === 'raw') {
      it.p += dt / 1.6; p.chopping = true; anyChop = true;
      if (it.p >= 1) { it.s = 'chop'; it.p = 0; sfx('pick'); }
    }
  });
  chopSnd -= dt;
  if (anyChop && chopSnd <= 0) { sfx('chop'); chopSnd = 0.18; }
  if (timeLeft <= 0) { timeLeft = 0; setPhase('end'); }
}
function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]; e.l -= dt; e.y -= (e.k === 'h' ? 18 : 12) * dt;
    if (e.l <= 0) effects.splice(i, 1);
  }
}

/* ======================= ENTRADA ======================= */
const keys = {};
let joyX = 0, joyY = 0, chopTouch = false;
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (phase === 'play' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!e.repeat && (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'Enter')) doInteract();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function doInteract() {
  ensureAudio();
  if (phase !== 'play') return;
  if (isHost) interact(players[myIdx]);
  else if (conn && conn.open) { sendPos(); conn.send({ t: 'a' }); }
}
function inputVec() {
  let x = 0, y = 0;
  if (keys.ArrowLeft || keys.KeyA) x -= 1;
  if (keys.ArrowRight || keys.KeyD) x += 1;
  if (keys.ArrowUp || keys.KeyW) y -= 1;
  if (keys.ArrowDown || keys.KeyS) y += 1;
  x += joyX; y += joyY;
  const d = Math.hypot(x, y);
  return d > 1 ? [x / d, y / d] : [x, y];
}
const chopHeld = () => !!(keys.KeyE || keys.KeyK || keys.ShiftLeft || keys.ShiftRight || chopTouch);

// palanca táctil
const joy = document.getElementById('joy'), knob = document.getElementById('knob');
let joyId = null, jcx = 0, jcy = 0;
function joyMove(e) {
  let dx = e.clientX - jcx, dy = e.clientY - jcy; const R = 55, d = Math.hypot(dx, dy);
  if (d > R) { dx *= R / d; dy *= R / d; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  joyX = dx / R; joyY = dy / R;
  if (Math.hypot(joyX, joyY) < 0.25) joyX = joyY = 0;
}
joy.addEventListener('pointerdown', e => {
  ensureAudio(); joyId = e.pointerId; joy.setPointerCapture(e.pointerId);
  const r = joy.getBoundingClientRect(); jcx = r.left + r.width / 2; jcy = r.top + r.height / 2; joyMove(e);
});
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId === joyId) { joyId = null; joyX = joyY = 0; knob.style.transform = ''; } };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
const bA = document.getElementById('bA'), bB = document.getElementById('bB');
bA.addEventListener('pointerdown', e => { e.preventDefault(); bA.classList.add('on'); doInteract(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => bA.addEventListener(ev, () => bA.classList.remove('on')));
bB.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); bB.setPointerCapture(e.pointerId); chopTouch = true; bB.classList.add('on'); });
['pointerup', 'pointercancel'].forEach(ev => bB.addEventListener(ev, () => { chopTouch = false; bB.classList.remove('on'); }));
addEventListener('contextmenu', e => e.preventDefault());

function moveLocal(dt) {
  const p = players[myIdx]; if (!p) return;
  const [vx, vy] = (phase === 'play' && countdown <= 0) ? inputVec() : [0, 0];
  p.mv = !!(vx || vy);
  if (p.mv) {
    p.fx = vx; p.fy = vy;
    const nx = p.x + vx * SPEED * dt, ny = p.y + vy * SPEED * dt;
    if (boxFree(nx, p.y)) p.x = nx;
    if (boxFree(p.x, ny)) p.y = ny;
  }
  p.chop = chopHeld();
}

/* ======================= RED ======================= */
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const randCode = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
let roomCode = '';

function snapshot() {
  const s = {
    t: 's', ph: phase, rid: roundId, tl: timeLeft, cd: countdown, sc: score, sv: served, fl: failed,
    or: orders.map(o => [o.r, +o.left.toFixed(1), o.max]),
    sl: slots, fx: effects, snd: sndQ,
    pl: players.map(p => ({ ch: p.ch, x: +p.x.toFixed(1), y: +p.y.toFixed(1), fx: +p.fx.toFixed(2), fy: +p.fy.toFixed(2), hand: p.hand, chopping: !!p.chopping, mv: p.mv })),
  };
  sndQ = [];
  return s;
}
function applySnap(s) {
  timeLeft = s.tl; countdown = s.cd; score = s.sc; served = s.sv; failed = s.fl;
  orders = s.or.map(([r, left, max]) => ({ r, left, max }));
  slots = s.sl; effects = s.fx;
  s.snd.forEach(play);
  const reset = s.rid !== seenRound; seenRound = s.rid;
  s.pl.forEach((sp, i) => {
    let p = players[i];
    if (!p) { p = players[i] = newPlayer(sp.ch, i); p.dx = sp.x; p.dy = sp.y; }
    if (i === myIdx && !reset) { p.hand = sp.hand; p.ch = sp.ch; p.chopping = sp.chopping; }
    else { const { dx, dy } = p; Object.assign(p, sp); p.dx = reset ? sp.x : dx; p.dy = reset ? sp.y : dy; }
  });
  players.length = s.pl.length;
  if (s.ph !== phase) setPhase(s.ph);
}
function sendPos() {
  const p = players[myIdx];
  if (p && conn && conn.open) conn.send({ t: 'p', x: p.x, y: p.y, fx: p.fx, fy: p.fy, chop: p.chop, mv: p.mv });
}
function closeNet() {
  try { conn && conn.close(); } catch (e) { }
  try { peer && peer.destroy(); } catch (e) { }
  conn = null; peer = null;
}
function hostRoom() {
  if (!window.Peer) { setStatus('No cargó la conexión. Revisa tu internet.'); return; }
  closeNet(); isHost = true; solo = false; myIdx = 0;
  players = [newPlayer(myChar, 0)];
  roomCode = randCode();
  setStatus('Creando sala…');
  peer = new Peer(ROOM_PREFIX + roomCode, { debug: 0 });
  peer.on('open', () => {
    document.getElementById('roomCode').textContent = roomCode;
    document.getElementById('hostBox').classList.remove('hidden');
    lobbyStatus('Esperando a tu pareja… 💌');
    document.getElementById('bStart').classList.add('hidden');
    setPhase('lobby');
  });
  peer.on('connection', c => {
    if (conn && conn.open) { c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); }); return; }
    conn = c;
    c.on('open', () => {
      const other = myChar === 'z' ? 'p' : 'z';
      players[1] = newPlayer(other, 1); players[1].dx = players[1].x; players[1].dy = players[1].y;
      c.send({ t: 'hello', ch: other, host: myChar });
      lobbyStatus('¡' + nameOf(other) + ' se conectó! ♥');
      document.getElementById('bStart').classList.remove('hidden');
      play('ding');
    });
    c.on('data', d => onHostData(d));
    c.on('close', () => onGuestLeft());
    c.on('error', () => onGuestLeft());
  });
  peer.on('error', err => {
    if (err.type === 'unavailable-id') { hostRoom(); return; }
    setStatus('Error de conexión: ' + err.type);
    if (phase === 'lobby' && !conn) { setPhase('menu'); }
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { } });
}
function onGuestLeft() {
  if (!conn) return;
  conn = null; players.length = 1;
  if (phase !== 'menu') {
    setPhase('lobby');
    lobbyStatus('Tu pareja se desconectó. Esperando que vuelva…');
    document.getElementById('bStart').classList.add('hidden');
  }
}
function onHostData(d) {
  const p = players[1]; if (!p) return;
  if (d.t === 'p') { p.x = d.x; p.y = d.y; p.fx = d.fx; p.fy = d.fy; p.chop = d.chop; p.mv = d.mv; }
  else if (d.t === 'a') interact(p);
  else if (d.t === 'again' && phase === 'end') startRound();
}
function joinRoom(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { setStatus('Escribe el código de 4 letras'); return; }
  if (!window.Peer) { setStatus('No cargó la conexión. Revisa tu internet.'); return; }
  closeNet(); isHost = false; solo = false; myIdx = 1; seenRound = -1; players = [];
  setStatus('Conectando…');
  peer = new Peer({ debug: 0 });
  let opened = false;
  const timer = setTimeout(() => { if (!opened) { setStatus('No pude conectar. ¿El código es correcto?'); closeNet(); } }, 15000);
  peer.on('open', () => {
    const c = peer.connect(ROOM_PREFIX + code, { reliable: true, serialization: 'json' });
    conn = c;
    c.on('open', () => { opened = true; clearTimeout(timer); });
    c.on('data', d => {
      if (d.t === 'hello') {
        myChar = d.ch;
        document.getElementById('hostBox').classList.add('hidden');
        document.getElementById('bStart').classList.add('hidden');
        lobbyStatus('¡Conectado! Eres ' + nameOf(d.ch) + '. Esperando a que ' + nameOf(d.host) + ' empiece…');
        setPhase('lobby'); play('ding');
      } else if (d.t === 's') applySnap(d);
      else if (d.t === 'full') { setStatus('Esa sala ya está llena'); }
    });
    c.on('close', () => { if (phase !== 'menu') { setPhase('menu'); setStatus('Se perdió la conexión 💔'); } closeNet(); });
  });
  peer.on('error', err => {
    clearTimeout(timer);
    setStatus(err.type === 'peer-unavailable' ? 'No encontré esa sala 🤔' : 'Error de conexión: ' + err.type);
    if (phase !== 'menu') setPhase('menu');
  });
}
function startSolo() {
  closeNet(); isHost = true; solo = true; myIdx = 0;
  players = [newPlayer(myChar, 0)];
  startRound();
}

/* ======================= DIBUJO ======================= */
const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function drawTile(ch, tx, ty) {
  const X = tx * T, Y = ty * T + HUD;
  if (ch === '.') { r(X, Y, T, T, (tx + ty) % 2 ? '#f2d7ae' : '#e9cc9d'); r(X, Y + 15, T, 1, '#dcbc8a'); return; }
  if (ch === 'F') {
    const it = slots[tx + ',' + ty], hot = it && it.t === 'meat' && (it.s === 'chop' || it.s === 'cook');
    r(X, Y, T, T, '#2b2b36'); r(X, Y, T, 12, '#5e5e70'); r(X, Y, T, 1, '#8a8aa0');
    r(X + 3, Y + 2, 10, 8, '#2b2b36'); r(X + 4, Y + 3, 8, 6, hot ? '#b8401e' : '#454556');
    if (hot && Math.floor(performance.now() / 120) % 2) { r(X + 5, Y + 4, 2, 3, '#ffb02e'); r(X + 9, Y + 4, 2, 3, '#ffb02e'); }
    r(X + 3, Y + 13, 2, 2, '#ff5050'); r(X + 11, Y + 13, 2, 2, '#ff5050');
    return;
  }
  if (ch === 'S') {
    r(X, Y, T, T, '#33203f'); r(X, Y, T, 12, '#6b3f7a'); r(X + 1, Y + 1, 14, 10, '#2a1830');
    for (let i = 0; i < 14; i += 4) r(X + 1 + i, Y + 1, 2, 2, '#ff7eb6');
    ctx.drawImage(SP.bell, X + 4, Y + 4);
    return;
  }
  // mostrador base
  r(X, Y, T, T, '#7a4528'); r(X, Y, T, 12, '#d9a066'); r(X, Y, T, 1, '#efc58e'); r(X, Y + 11, T, 1, '#b07a46'); r(X + 15, Y, 1, 12, '#c08850');
  r(X + 2, Y + 13, 12, 1, '#5e321c');
  if (CRATE[ch]) {
    r(X + 1, Y + 1, 14, 10, '#7a4a20'); r(X + 2, Y + 2, 12, 8, '#b8773d'); r(X + 2, Y + 5, 12, 1, '#9a5f2c');
    ctx.drawImage(SP[CRATE[ch] + '_raw'], X + 4, Y + 1);
  } else if (ch === 'K') {
    r(X + 2, Y + 2, 12, 8, '#b48a52'); r(X + 3, Y + 2, 10, 7, '#f3dcaa'); r(X + 12, Y + 3, 1, 1, '#c9a46a');
    if (!slots[tx + ',' + ty]) { r(X + 5, Y + 5, 6, 1, '#d8dde8'); r(X + 11, Y + 5, 2, 1, '#6b3d22'); }
  } else if (ch === 'P') {
    ctx.drawImage(SP.plate, X + 2, Y + 5); ctx.drawImage(SP.plate, X + 2, Y + 3); ctx.drawImage(SP.plate, X + 2, Y + 1);
  } else if (ch === 'X') {
    r(X + 3, Y + 1, 10, 10, '#55606a'); r(X + 4, Y + 2, 8, 8, '#8794a1'); r(X + 3, Y + 1, 10, 2, '#b0bcc8');
    r(X + 6, Y + 4, 1, 5, '#55606a'); r(X + 9, Y + 4, 1, 5, '#55606a');
  }
}
function drawBurger(x, y, c) {
  let yy = y;
  r(x + 2, yy, 4, 1, '#e9a24c'); r(x + 1, yy + 1, 6, 1, '#e9a24c'); r(x, yy + 2, 8, 1, '#d9913f');
  r(x + 2, yy + 1, 1, 1, '#ffe08a'); r(x + 5, yy + 1, 1, 1, '#ffe08a');
  yy += 3;
  if (c.includes('lettuce')) { r(x, yy, 8, 1, '#5fbf3f'); r(x + 1, yy + 1, 1, 1, '#5fbf3f'); r(x + 5, yy + 1, 1, 1, '#5fbf3f'); yy += 1; }
  if (c.includes('tomato')) { r(x, yy, 8, 1, '#e8443a'); yy += 1; }
  if (c.includes('meat')) { r(x, yy, 8, 2, '#7a4422'); r(x, yy + 1, 8, 1, '#5c3418'); yy += 2; }
  r(x, yy, 8, 1, '#d9913f'); r(x + 1, yy + 1, 6, 1, '#b8732e');
}
function drawDish(x, y, c) {   // 8x8 aprox
  if (c.includes('bread')) { drawBurger(x, y, c); return; }
  const offs = [[[0, 0]], [[-2, 0], [2, -1]], [[-3, 0], [3, 0], [0, -2]], [[-3, -2], [3, -2], [-3, 1], [3, 1]]][c.length - 1];
  c.forEach((t, i) => ctx.drawImage(SP[READY[t]], x + offs[i][0], y + offs[i][1]));
}
function drawItem(it, x, y) {  // x,y = esquina 8x8
  if (it.t === 'plate') {
    ctx.drawImage(SP.plate, x - 2, y + 3);
    if (it.c.length) drawDish(x, y - 1, it.c);
  } else ctx.drawImage(SP[it.t + '_' + it.s], x, y);
}
function bar(x, y, w, v, c) { r(x - 1, y - 1, w + 2, 4, '#000'); r(x, y, w, 2, '#3a2140'); r(x, y, Math.round(w * Math.min(1, v)), 2, c); }
function drawPlayer(p, i) {
  const x = Math.round(p.dx), y = Math.round(p.dy) + HUD;
  const bob = p.mv ? (Math.floor(performance.now() / 110) % 2) : 0;
  r(x - 5, y + 2, 10, 2, 'rgba(0,0,0,.25)');
  const spr = SP[p.ch], flip = p.fx < -0.1;
  ctx.save();
  if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.drawImage(spr, -6, y - 13 - bob); }
  else ctx.drawImage(spr, x - 6, y - 13 - bob);
  ctx.restore();
  if (p.chopping) {
    const k = Math.floor(performance.now() / 90) % 2;
    const kx = x + (Math.abs(p.fx) >= Math.abs(p.fy) ? Math.sign(p.fx) * 7 : 0);
    r(kx - 1, y - 6 - k * 2, 2, 4, '#d8dde8'); r(kx - 1, y - 2 - k * 2, 2, 2, '#6b3d22');
  }
  if (p.hand) {
    const hx = x - 4 + (Math.abs(p.fx) >= Math.abs(p.fy) ? Math.sign(p.fx) * 5 : 0);
    drawItem(p.hand, hx, y - 5 - bob);
  }
  if (i === myIdx && !solo) {
    const a = Math.floor(performance.now() / 300) % 2;
    const c = p.ch === 'z' ? '#ff7eb6' : '#5b8cff';
    r(x - 2, y - 19 - a, 5, 1, c); r(x - 1, y - 18 - a, 3, 1, c); r(x, y - 17 - a, 1, 1, c);
  }
}
function text(s, x, y, c, size = 8, align = 'left') {
  ctx.font = size + "px 'Press Start 2P', monospace"; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = c; ctx.fillText(s, x, y);
}
const dishCanvas = document.createElement('canvas'); dishCanvas.width = 12; dishCanvas.height = 12;
function drawHUD() {
  r(0, 0, VW, HUD, '#3a2140'); r(0, HUD - 2, VW, 2, '#000');
  orders.forEach((o, i) => {
    const x = 3 + i * 38, y = 3, rec = RECIPES[o.r];
    const urgent = o.left / o.max < 0.25 && Math.floor(performance.now() / 200) % 2;
    r(x - 1, y - 1, 36, 32, '#000'); r(x, y, 34, 30, urgent ? '#ffd0d0' : '#fff4e0');
    // plato grande x2
    const prev = ctx; const dc = dishCanvas.getContext('2d'); dc.clearRect(0, 0, 12, 12);
    ctx = dc; ctx.drawImage(SP.plate, 0, 6); drawDish(2, 2, rec.ing); ctx = prev;
    ctx.drawImage(dishCanvas, x + 5, y - 1, 24, 24);
    rec.ing.forEach((t, j) => ctx.drawImage(SP[READY[t]], x + 1 + j * 8, y + 19));
    const v = o.left / o.max;
    r(x, y + 27, 34, 3, '#3a2140'); r(x, y + 27, Math.round(34 * v), 3, v > .5 ? '#4caf3a' : v > .25 ? '#ffc93c' : '#e8443a');
  });
  const t = Math.ceil(timeLeft), mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
  text(mm + ':' + ss, VW - 4, 5, t <= 20 && Math.floor(performance.now() / 300) % 2 ? '#ff6b6b' : '#fff4e0', 8, 'right');
  ctx.drawImage(SP.coin, VW - 52, 20);
  text(String(score), VW - 4, 20, '#ffc93c', 8, 'right');
}
function render(dt) {
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.imageSmoothingEnabled = false;
  r(0, 0, VW, VH, '#1e1226');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawTile(MAP[y][x], x, y);
  // objetos en mostradores
  for (const k in slots) {
    const [tx, ty] = k.split(',').map(Number), it = slots[k];
    const X = tx * T, Y = ty * T + HUD;
    drawItem(it, X + 4, Y + 2);
    if (tile(tx, ty) === 'K' && it.s === 'raw' && it.p > 0) bar(X + 2, Y - 3, 12, it.p, '#4caf3a');
    if (tile(tx, ty) === 'F' && it.t === 'meat') {
      if (it.s === 'chop') bar(X + 2, Y - 3, 12, it.k, '#ffc93c');
      else if (it.s === 'cook') {
        const danger = (it.k - 1) / 1.4;
        bar(X + 2, Y - 3, 12, 1, danger > .5 && Math.floor(performance.now() / 150) % 2 ? '#e8443a' : '#4caf3a');
      } else if (it.s === 'burn') {
        const s = Math.floor(performance.now() / 200) % 3;
        r(X + 6 + s, Y - 4 - s, 3, 3, 'rgba(80,80,80,.7)'); r(X + 4 - s, Y - 8, 2, 2, 'rgba(80,80,80,.5)');
      }
    }
  }
  // resaltar objetivo
  const me = players[myIdx];
  if (me && phase === 'play') {
    const tg = target(me);
    if (tg) {
      const X = tg.x * T, Y = tg.y * T + HUD, c = 'rgba(255,255,255,.85)';
      r(X, Y, 4, 1, c); r(X, Y, 1, 4, c); r(X + 12, Y, 4, 1, c); r(X + 15, Y, 1, 4, c);
      r(X, Y + 15, 4, 1, c); r(X, Y + 12, 1, 4, c); r(X + 12, Y + 15, 4, 1, c); r(X + 15, Y + 12, 1, 4, c);
    }
  }
  // jugadores (suavizado)
  players.forEach((p, i) => {
    if (i === myIdx) { p.dx = p.x; p.dy = p.y; }
    else { const f = Math.min(1, dt * 14); p.dx += (p.x - p.dx) * f; p.dy += (p.y - p.dy) * f; }
  });
  players.map((p, i) => [p, i]).sort((a, b) => a[0].dy - b[0].dy).forEach(([p, i]) => drawPlayer(p, i));
  // efectos
  effects.forEach(e => {
    ctx.globalAlpha = Math.min(1, e.l * 2);
    if (e.k === 'h') ctx.drawImage(SP.heart, Math.round(e.x), Math.round(e.y + HUD));
    else text(e.txt, Math.round(e.x), Math.round(e.y + HUD), e.c);
    ctx.globalAlpha = 1;
  });
  drawHUD();
  if (phase === 'play' && countdown > 0) {
    r(0, HUD, VW, VH - HUD, 'rgba(30,18,38,.45)');
    const c = Math.ceil(countdown);
    text(c > 0 ? String(Math.min(3, c)) : 'YA!', VW / 2, VH / 2 + 4, '#ffc93c', 24, 'center');
    text('Zairene y el Palomito', VW / 2, VH / 2 + 36, '#ff7eb6', 6, 'center');
  }
}

/* ======================= UI ======================= */
const $ = id => document.getElementById(id);
const nameOf = ch => ch === 'z' ? 'Zairene' : 'el Palomito';
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
function setStatus(s) { $('status').textContent = s; }
function lobbyStatus(s) { $('lobbyStatus').textContent = s; }
function setPhase(p) {
  phase = p;
  ['menu', 'lobby', 'end'].forEach(id => $(id).classList.toggle('hidden', id !== p));
  $('help').classList.add('hidden');
  $('touch').classList.toggle('hidden', !(isTouch && p === 'play'));
  if (p === 'end') showEnd();
  if (p === 'menu') { players = []; }
  resize();
}
function showEnd() {
  const stars = score >= 250 ? 3 : score >= 150 ? 2 : score >= 60 ? 1 : 0;
  $('endStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
  $('endScore').textContent = `${score} monedas · ${served} platos servidos · ${failed} perdidos`;
  $('endMsg').textContent = [
    '¡Ánimo! El amor también se cocina a fuego lento ♥',
    '¡Buen equipo! Zairene y el Palomito van mejorando ♥',
    '¡Qué buena pareja en la cocina! ♥',
    '¡Chefs legendarios! El mejor equipo del mundo ♥',
  ][stars];
  $('bAgain').classList.toggle('hidden', !isHost);
  $('endWait').textContent = isHost ? '' : 'Esperando otra ronda…';
  if (!isHost) { $('bAgain').classList.remove('hidden'); $('bAgain').textContent = 'Pedir otra ronda'; }
  else $('bAgain').textContent = 'Otra ronda';
  play(stars >= 2 ? 'ding' : 'order');
}

function drawPreview(id, ch) {
  const c = $(id), x = c.getContext('2d'); x.clearRect(0, 0, 12, 16); x.drawImage(SP[ch], 0, 0);
}
drawPreview('cvz', 'z'); drawPreview('cvp', 'p');
document.querySelectorAll('.char').forEach(b => b.addEventListener('click', () => {
  myChar = b.dataset.ch;
  document.querySelectorAll('.char').forEach(o => o.classList.toggle('sel', o === b));
  ensureAudio(); play('pick');
}));
$('bCreate').onclick = () => { ensureAudio(); hostRoom(); };
$('bJoin').onclick = () => { ensureAudio(); joinRoom($('code').value); };
$('code').addEventListener('keydown', e => { if (e.key === 'Enter') { ensureAudio(); joinRoom($('code').value); } });
$('bSolo').onclick = () => { ensureAudio(); startSolo(); };
$('bHelp').onclick = () => $('help').classList.remove('hidden');
$('bHelpClose').onclick = () => $('help').classList.add('hidden');
$('bStart').onclick = () => { ensureAudio(); if (conn && conn.open) startRound(); };
$('bLeave').onclick = () => { closeNet(); setPhase('menu'); setStatus(''); };
$('bMenu').onclick = () => { closeNet(); setPhase('menu'); setStatus(''); };
$('bAgain').onclick = () => {
  ensureAudio();
  if (isHost) { if (solo || (conn && conn.open)) startRound(); else setPhase('lobby'); }
  else if (conn && conn.open) { conn.send({ t: 'again' }); $('endWait').textContent = 'Pedido enviado ♥'; }
};
$('bShare').onclick = async () => {
  const url = location.origin + location.pathname + '?sala=' + roomCode;
  const msg = `¡Ven a cocinar conmigo! 🍔 Código: ${roomCode}\n${url}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Cocina Caótica', text: msg, url });
    else { await navigator.clipboard.writeText(msg); lobbyStatus('¡Enlace copiado! Pégalo en WhatsApp 💌'); }
  } catch (e) {
    try { await navigator.clipboard.writeText(msg); lobbyStatus('¡Enlace copiado! Pégalo en WhatsApp 💌'); } catch (e2) { lobbyStatus('Código: ' + roomCode); }
  }
};
$('fs').onclick = () => {
  const d = document;
  if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => { })).call(d.documentElement); try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }
  else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
};
// ?sala=XXXX en el enlace
const qs = new URLSearchParams(location.search).get('sala');
if (qs) { $('code').value = qs.toUpperCase(); setStatus('Te invitaron 💌 Elige quién eres y toca Unirse'); }

function resize() {
  const vw = innerWidth, vh = innerHeight, portrait = vh > vw;
  let aw = vw - 24, ah = vh - 24, top = 12;
  if (isTouch && phase === 'play') {
    if (portrait) { ah = vh * 0.58; top = Math.max(12, vh * 0.06); }
    else { aw = vw - 2 * 150; }
  }
  const sc = Math.max(1, Math.min(aw / VW, ah / VH));
  const cw = Math.floor(VW * sc), ch = Math.floor(VH * sc);
  const dpr = Math.min(3, devicePixelRatio || 1);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.style.left = Math.floor((vw - cw) / 2) + 'px';
  cv.style.top = (isTouch && phase === 'play' && portrait ? top : Math.floor((vh - ch) / 2)) + 'px';
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  S = cv.width / VW;
  $('rot').classList.toggle('hidden', !(isTouch && portrait));
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

/* ======================= BUCLE ======================= */
// La lógica corre con setInterval (sigue viva aunque la pestaña esté en segundo plano);
// el dibujo va con requestAnimationFrame.
let last = performance.now(), lastR = performance.now();
function tick() {
  const now = performance.now();
  let dt = Math.min(1.2, (now - last) / 1000); last = now;
  while (dt > 0) {
    const step = Math.min(0.05, dt); dt -= step;
    if (phase === 'play') moveLocal(step);
    if (isHost && phase === 'play') updateWorld(step);
    if (isHost) updateEffects(step);
  }
  sendAcc += (now - (tick.prev || now)) / 1000; tick.prev = now;
  if (sendAcc >= 0.05) {
    sendAcc = 0;
    if (conn && conn.open) {
      if (isHost) conn.send(snapshot()); else if (phase === 'play') sendPos();
    } else if (isHost) sndQ = [];
  }
}
setInterval(tick, 1000 / 60);
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastR) / 1000); lastR = ts;
  render(dt);
  requestAnimationFrame(loop);
}
if (document.fonts && document.fonts.load) document.fonts.load("8px 'Press Start 2P'");
requestAnimationFrame(loop);
