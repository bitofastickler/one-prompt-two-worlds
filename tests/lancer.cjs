// Comparison-era isolated engine checks; no edits to the preserved game.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = new Map();
const events = {};
const saved = new Map();
const context = new Proxy({
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
}, { get: (target, key) => target[key] || (() => {}) });
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    style: {}, textContent: '',
    classList: { add() {}, remove() {}, toggle() {} },
    getContext: () => context,
    addEventListener() {},
    querySelector: selector => element(id + selector),
  });
  return elements.get(id);
}
// Seed map generation so assertions are repeatable.
let seed = 8128;
const seededMath = Object.create(Math);
seededMath.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
const sandbox = {
  console, Math: seededMath, Set, innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1,
  performance: { now: () => 0 }, requestAnimationFrame() {}, setTimeout() {},
  document: { getElementById: element },
  localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
  addEventListener: (name, callback) => { events[name] = callback; },
};
sandbox.window = sandbox;
const original = fs.readFileSync(path.join(__dirname, '../games/last-light-lancer/game.js'), 'utf8');
const instrumented = original.replace('  resize();\n  requestAnimationFrame(loop);', `
  window.test = {
    startGame, update, draw, firePlayer, damagePlayer, updateCores, updateExtraction,
    updateUpgrades, updateCrates, updateBullets, updateEnemies, spawnEnemy, canMoveTo,
    keys, pressed, mouse, camera, get: () => ({ state, run })
  };
  resize();
  requestAnimationFrame(loop);`);
assert.notEqual(instrumented, original, 'Test insertion point must exist');
vm.runInNewContext(instrumented, sandbox);
const t = sandbox.test;
t.draw();
t.startGame();
assert.equal(t.get().state, 'playing');
assert.equal(t.get().run.cores.length, 6);
assert.equal(t.get().run.obstacles.length, 46);
assert.equal(t.get().run.crates.length, 18);
let run = t.get().run;
const startX = run.player.x;
t.keys.add('KeyD');
for (let i = 0; i < 30; i++) t.update(1 / 60);
assert(run.player.x > startX + 120);
t.pressed.add('Space'); t.update(1 / 60);
assert(run.player.dashCooldown > 0 && run.player.invuln > 0);
t.keys.clear();
const obstacle = run.obstacles[0];
assert.equal(t.canMoveTo(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2, 17), false);
assert.equal(t.canMoveTo(-1, 100, 17), false);
t.mouse.worldX = run.player.x + 200; t.mouse.worldY = run.player.y;
run.player.fireCooldown = 0; t.firePlayer();
assert.equal(run.bullets.length, 1);
run.player.scrap = 100;
for (const [key, kind] of [['Digit1', 'cannon'], ['Digit2', 'engine'], ['Digit3', 'shield']]) {
  for (let level = 1; level <= 3; level++) {
    t.pressed.clear(); t.pressed.add(key); t.updateUpgrades();
    assert.equal(run.player.upgrades[kind], level);
  }
  t.updateUpgrades(); assert.equal(run.player.upgrades[kind], 3);
}
assert.equal(run.player.scrap, 46, 'Each path costs 3 + 6 + 9');
t.pressed.clear();
run.player.fireCooldown = 0; const bulletCount = run.bullets.length; t.firePlayer();
assert.equal(run.bullets.length - bulletCount, 3, 'Upgraded cannon uses spread');
const crate = run.crates[0];
run.player.x = crate.x; run.player.y = crate.y;
t.updateCrates(); assert(crate.open);
for (const type of ['hound', 'spitter', 'bulwark']) t.spawnEnemy(type);
assert(run.enemies.some(e => e.type === 'bulwark'));
run.player.invuln = 20;
for (let i = 0; i < 120; i++) t.update(1 / 60);
t.draw();
events.keydown({ code: 'KeyP', preventDefault() {} });
assert.equal(t.get().state, 'paused');
const stopped = run.time; t.update(1); assert.equal(run.time, stopped);
events.keyup({ code: 'KeyP' }); events.keydown({ code: 'KeyP', preventDefault() {} });
assert.equal(t.get().state, 'playing');
t.keys.clear(); t.pressed.clear();
// A controlled progression test, not a human skill/balance test.
t.startGame(); run = t.get().run;
t.updateExtraction(20); assert.equal(t.get().state, 'playing', 'No extraction before all cores');
t.keys.add('KeyE');
for (const core of run.cores) {
  run.player.x = core.x; run.player.y = core.y;
  for (let i = 0; i < 70; i++) t.updateCores(1 / 60);
}
t.keys.clear();
assert.equal(run.player.cores, 6); assert(run.extractionOpen);
run.player.x = run.start.x; run.player.y = run.start.y;
t.updateExtraction(3); assert.equal(run.extraction, 3);
run.player.x += 300; t.updateExtraction(1); assert(run.extraction < 3);
run.player.x = run.start.x; run.time = 75;
t.updateExtraction(10); assert.equal(t.get().state, 'win'); assert(run.extractionDone);
assert.equal(saved.get('lll-best'), '75'); t.draw();
t.startGame(); run = t.get().run;
t.damagePlayer(1000); assert.equal(t.get().state, 'lose'); t.draw();
t.startGame(); assert.equal(t.get().run.player.cores, 0); assert.equal(t.get().run.score, 0); t.draw();
console.log('PASS: Lancer movement, collisions, dash, fire, upgrades/costs, crates, enemies, pause, six-core gate, extraction/decay, saved record, defeat, restart, draw calls.');
