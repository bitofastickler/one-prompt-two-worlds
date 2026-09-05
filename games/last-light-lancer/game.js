(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const startButton = document.getElementById("startButton");
  const objectiveEl = document.getElementById("objective");
  const runStatsEl = document.getElementById("runStats");
  const upgradeHintEl = document.getElementById("upgradeHint");
  const audioStatusEl = document.getElementById("audioStatus");
  const toastEl = document.getElementById("toast");
  const hullBar = document.getElementById("hullBar");
  const shieldBar = document.getElementById("shieldBar");

  const TAU = Math.PI * 2;
  const WORLD = { w: 3600, h: 2600 };
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };
  const camera = { x: 0, y: 0, shake: 0 };

  let dpr = 1;
  let width = 0;
  let height = 0;
  let last = performance.now();
  let state = "title";
  let audio = null;
  let run = null;
  const musicScale = [0, 3, 5, 7, 10, 12, 15, 17];
  const musicChords = [0, -5, -2, -7, 3, -2, -9, -5];

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(a, b, c, d) {
    const dx = a - c;
    const dy = b - d;
    return Math.hypot(dx, dy);
  }

  function angleTo(a, b, c, d) {
    return Math.atan2(d - b, c - a);
  }

  function screenToWorld(x, y) {
    return { x: x + camera.x, y: y + camera.y };
  }

  function initAudio() {
    if (audio) {
      if (audio.context.state === "suspended") audio.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const master = context.createGain();
    const sfxGain = context.createGain();
    const musicGain = context.createGain();
    master.gain.value = 0.95;
    sfxGain.gain.value = 0.08;
    musicGain.gain.value = 0.16;
    sfxGain.connect(master);
    musicGain.connect(master);
    master.connect(context.destination);
    audio = {
      context,
      master,
      sfxGain,
      musicGain,
      music: {
        enabled: localStorage.getItem("lll-music-muted") !== "true",
        started: false,
        nextTime: 0,
        step: 0,
      },
    };
  }

  function beep(freq, duration, type = "sine", volume = 1, slide = 0) {
    if (!audio) return;
    const now = audio.context.currentTime;
    const osc = audio.context.createOscillator();
    const g = audio.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + duration);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(audio.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  function testAudio() {
    initAudio();
    if (!audio) return;
    if (audio.context.state === "suspended") audio.context.resume();
    beep(262, 0.12, "triangle", 0.9, 80);
    setTimeout(() => beep(392, 0.14, "triangle", 0.85, 120), 120);
    setTimeout(() => beep(524, 0.18, "triangle", 0.8, 0), 260);
    if (run) flashMessage("Audio test.", 1.5);
  }

  function midiToFreq(note) {
    return 440 * 2 ** ((note - 69) / 12);
  }

  function scheduleTone(freq, start, duration, type, volume, attack = 0.015, slide = 0) {
    if (!audio || !audio.music.enabled) return;
    if (!Number.isFinite(freq) || freq <= 0) return;
    const osc = audio.context.createOscillator();
    const g = audio.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + duration);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(volume, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(g);
    g.connect(audio.musicGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function startMusic() {
    if (!audio) return;
    if (audio.context.state === "suspended") audio.context.resume();
    audio.music.started = true;
    audio.music.nextTime = audio.context.currentTime + 0.04;
  }

  function toggleMusic() {
    initAudio();
    if (!audio) return;
    audio.music.enabled = !audio.music.enabled;
    localStorage.setItem("lll-music-muted", String(!audio.music.enabled));
    if (audio.music.enabled) {
      startMusic();
      if (run) flashMessage("Music online.", 1.8);
    } else {
      if (run) flashMessage("Music muted.", 1.8);
    }
  }

  function pumpMusic() {
    if (!audio || !audio.music.started) return;
    const targetGain = audio.music.enabled ? (state === "paused" ? 0.055 : 0.16) : 0.0001;
    audio.musicGain.gain.setTargetAtTime(targetGain, audio.context.currentTime, 0.08);
    if (!audio.music.enabled) return;

    const now = audio.context.currentTime;
    const playing = state === "playing" && run;
    const extraction = playing && run.extractionOpen;
    const bpm = extraction ? 126 : playing ? 100 + Math.min(18, run.threat * 3) : 82;
    const stepDur = 60 / bpm / 2;
    while (audio.music.nextTime < now + 0.28) {
      scheduleMusicStep(audio.music.step, audio.music.nextTime, stepDur);
      audio.music.step += 1;
      audio.music.nextTime += stepDur;
    }
  }

  function scheduleMusicStep(step, time, stepDur) {
    const playing = state === "playing" && run;
    const extraction = playing && run.extractionOpen;
    const threat = playing ? clamp((run.threat - 1) / 7, 0, 1) : 0;
    const root = extraction ? 50 : 47;
    const chord = musicChords[Math.floor(step / 8) % musicChords.length];
    const degree = musicScale[(step * 3 + Math.floor(step / 8)) % musicScale.length];
    const pulse = extraction ? 0.018 : 0.011;

    if (step % 8 === 0) {
      scheduleTone(midiToFreq(root + chord - 12), time, stepDur * 6.5, "sine", 0.038 + threat * 0.012, 0.04);
      scheduleTone(midiToFreq(root + chord), time + stepDur * 0.08, stepDur * 5, "triangle", 0.015, 0.08);
    }

    if (step % 2 === 0) {
      scheduleTone(midiToFreq(root + chord + degree + 12), time, stepDur * 1.55, "triangle", 0.012 + threat * 0.011, 0.01);
    }

    if (playing && (step + 3) % 4 === 0) {
      const runNote = musicScale[Math.floor(step / 2) % musicScale.length];
      scheduleTone(midiToFreq(root + chord + runNote + 24), time, stepDur * 0.7, "sine", 0.01 + threat * 0.012, 0.008);
    }

    if (extraction || threat > 0.45) {
      scheduleTone(midiToFreq(root + 24), time, stepDur * 0.18, "square", pulse + threat * 0.012, 0.004, -30);
    }
  }

  function makeRun() {
    const obstacles = [];
    const cores = [];
    const crates = [];
    const particles = [];
    const bullets = [];
    const enemyBullets = [];
    const enemies = [];
    const start = { x: WORLD.w / 2, y: WORLD.h / 2 };

    const awayFromStart = (x, y, radius) => dist(x, y, start.x, start.y) > radius;
    for (let i = 0; i < 46; i += 1) {
      const w = rand(70, 230);
      const h = rand(45, 170);
      let x = rand(130, WORLD.w - 130 - w);
      let y = rand(130, WORLD.h - 130 - h);
      if (!awayFromStart(x + w / 2, y + h / 2, 420)) {
        i -= 1;
        continue;
      }
      obstacles.push({ x, y, w, h, hue: rand(185, 225), rot: rand(-0.06, 0.06) });
    }

    function freePoint(margin = 120, minStart = 420) {
      for (let tries = 0; tries < 400; tries += 1) {
        const x = rand(margin, WORLD.w - margin);
        const y = rand(margin, WORLD.h - margin);
        if (!awayFromStart(x, y, minStart)) continue;
        if (obstacles.some((o) => circleRect(x, y, 34, o))) continue;
        return { x, y };
      }
      return { x: rand(margin, WORLD.w - margin), y: rand(margin, WORLD.h - margin) };
    }

    for (let i = 0; i < 6; i += 1) {
      const p = freePoint(180, 560);
      cores.push({ ...p, found: false, attune: 0, pulse: rand(0, TAU) });
    }

    for (let i = 0; i < 18; i += 1) {
      const p = freePoint(100, 340);
      crates.push({ ...p, hp: 28, open: false, r: rand(16, 22) });
    }

    return {
      time: 0,
      score: 0,
      wave: 0,
      spawnTimer: 2.5,
      threat: 1,
      extraction: 0,
      extractionOpen: false,
      extractionDone: false,
      message: "Recover six signal cores.",
      messageTimer: 4,
      player: {
        x: start.x,
        y: start.y,
        r: 17,
        hp: 100,
        hpMax: 100,
        shield: 65,
        shieldMax: 65,
        shieldDelay: 0,
        speed: 250,
        dash: 0,
        dashCooldown: 0,
        fireCooldown: 0,
        invuln: 0,
        scrap: 0,
        cores: 0,
        upgrades: { cannon: 0, engine: 0, shield: 0 },
      },
      start,
      obstacles,
      cores,
      crates,
      particles,
      bullets,
      enemyBullets,
      enemies,
      stars: Array.from({ length: 260 }, () => ({
        x: rand(0, WORLD.w),
        y: rand(0, WORLD.h),
        s: rand(0.5, 2.1),
        a: rand(0.2, 0.95),
      })),
    };
  }

  function circleRect(cx, cy, cr, rect) {
    const x = clamp(cx, rect.x, rect.x + rect.w);
    const y = clamp(cy, rect.y, rect.y + rect.h);
    return dist(cx, cy, x, y) < cr;
  }

  function canMoveTo(x, y, r) {
    if (x < r || y < r || x > WORLD.w - r || y > WORLD.h - r) return false;
    return !run.obstacles.some((o) => circleRect(x, y, r, o));
  }

  function moveCircle(entity, dx, dy, r) {
    if (canMoveTo(entity.x + dx, entity.y, r)) entity.x += dx;
    if (canMoveTo(entity.x, entity.y + dy, r)) entity.y += dy;
    entity.x = clamp(entity.x, r, WORLD.w - r);
    entity.y = clamp(entity.y, r, WORLD.h - r);
  }

  function flashMessage(text, seconds = 3) {
    run.message = text;
    run.messageTimer = seconds;
  }

  function startGame() {
    initAudio();
    startMusic();
    run = makeRun();
    state = "playing";
    overlay.classList.add("hidden");
    beep(220, 0.09, "triangle", 0.9, 220);
    beep(440, 0.11, "triangle", 0.55, 180);
  }

  function endGame(victory) {
    state = victory ? "win" : "lose";
    const best = Number(localStorage.getItem("lll-best") || "0");
    if (victory && (!best || run.time < best)) {
      localStorage.setItem("lll-best", String(Math.round(run.time * 10) / 10));
    }
    overlay.classList.remove("hidden");
    const bestLine = localStorage.getItem("lll-best")
      ? `Best extraction: ${localStorage.getItem("lll-best")}s.`
      : "No extraction logged yet.";
    overlay.querySelector("h1").textContent = victory ? "Signal Delivered" : "Lost in Static";
    overlay.querySelector("p").textContent = victory
      ? `You recovered the cores and punched a route through the debris in ${Math.round(run.time)} seconds. ${bestLine}`
      : `Your lancer broke apart with ${run.player.cores}/6 cores recovered. The relay is still calling.`;
    startButton.textContent = "Launch Another Run";
    beep(victory ? 520 : 110, 0.24, victory ? "triangle" : "sawtooth", 0.85, victory ? 260 : -50);
  }

  function spawnEnemy(forceType = "") {
    const p = run.player;
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 80; tries += 1) {
      const side = Math.floor(rand(0, 4));
      x = side === 0 ? 40 : side === 1 ? WORLD.w - 40 : rand(60, WORLD.w - 60);
      y = side === 2 ? 40 : side === 3 ? WORLD.h - 40 : rand(60, WORLD.h - 60);
      if (dist(x, y, p.x, p.y) > 560 && canMoveTo(x, y, 22)) break;
    }
    const roll = Math.random();
    const type = forceType || (roll < 0.63 ? "hound" : roll < 0.88 ? "spitter" : "bulwark");
    const stats = {
      hound: { r: 18, hp: 34 + run.threat * 3, speed: 116 + run.threat * 6, color: "#ff5770" },
      spitter: { r: 20, hp: 44 + run.threat * 4, speed: 82 + run.threat * 3, color: "#9fe4c6" },
      bulwark: { r: 28, hp: 96 + run.threat * 8, speed: 54 + run.threat * 2, color: "#ffd166" },
    }[type];
    run.enemies.push({ x, y, type, hp: stats.hp, hpMax: stats.hp, r: stats.r, speed: stats.speed, color: stats.color, fire: rand(0.5, 1.8), hit: 0 });
  }

  function spawnParticles(x, y, color, count, power = 1) {
    for (let i = 0; i < count; i += 1) {
      const a = rand(0, TAU);
      const sp = rand(45, 290) * power;
      run.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.24, 0.8),
        max: rand(0.24, 0.8),
        size: rand(1.5, 5.5) * power,
        color,
      });
    }
  }

  function firePlayer() {
    const p = run.player;
    if (p.fireCooldown > 0) return;
    const a = angleTo(p.x, p.y, mouse.worldX, mouse.worldY);
    const spread = p.upgrades.cannon >= 2 ? [-0.09, 0, 0.09] : [0];
    spread.forEach((offset) => {
      const aa = a + offset;
      run.bullets.push({
        x: p.x + Math.cos(aa) * 23,
        y: p.y + Math.sin(aa) * 23,
        vx: Math.cos(aa) * 720,
        vy: Math.sin(aa) * 720,
        life: 0.82,
        r: 4,
        damage: 22 + p.upgrades.cannon * 6,
      });
    });
    p.fireCooldown = Math.max(0.08, 0.19 - p.upgrades.cannon * 0.035);
    spawnParticles(p.x + Math.cos(a) * 25, p.y + Math.sin(a) * 25, "#ffe8a6", 4, 0.6);
    beep(520 + p.upgrades.cannon * 80, 0.035, "square", 0.32, -120);
  }

  function damagePlayer(amount, x, y) {
    const p = run.player;
    if (p.invuln > 0) return;
    p.shieldDelay = 1.8;
    p.invuln = 0.12;
    let remaining = amount;
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, remaining);
      p.shield -= absorbed;
      remaining -= absorbed;
    }
    p.hp -= remaining;
    camera.shake = Math.max(camera.shake, remaining > 0 ? 18 : 8);
    spawnParticles(x || p.x, y || p.y, remaining > 0 ? "#ff5770" : "#54d6ff", 12, remaining > 0 ? 1 : 0.7);
    beep(remaining > 0 ? 90 : 180, 0.08, "sawtooth", 0.55, remaining > 0 ? -30 : 40);
    if (p.hp <= 0) endGame(false);
  }

  function update(dt) {
    if (state !== "playing") return;
    const p = run.player;
    run.time += dt;
    run.threat = 1 + run.player.cores * 0.75 + run.time / 95 + (run.extractionOpen ? 2.4 : 0);
    run.messageTimer = Math.max(0, run.messageTimer - dt);

    const aim = screenToWorld(mouse.x, mouse.y);
    mouse.worldX = aim.x;
    mouse.worldY = aim.y;

    let mx = 0;
    let my = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
    const mag = Math.hypot(mx, my) || 1;
    mx /= mag;
    my /= mag;

    if (pressed.has("Space") && p.dashCooldown <= 0 && (mx || my)) {
      p.dash = 0.15;
      p.dashCooldown = Math.max(0.5, 1.15 - p.upgrades.engine * 0.12);
      p.invuln = 0.18;
      spawnParticles(p.x, p.y, "#54d6ff", 18, 1.2);
      beep(260, 0.08, "triangle", 0.55, 180);
    }

    const dashBoost = p.dash > 0 ? 3.2 : 1;
    moveCircle(p, mx * p.speed * dashBoost * dt, my * p.speed * dashBoost * dt, p.r);
    p.dash = Math.max(0, p.dash - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.shieldDelay = Math.max(0, p.shieldDelay - dt);
    if (p.shieldDelay <= 0) p.shield = Math.min(p.shieldMax, p.shield + (10 + p.upgrades.shield * 6) * dt);
    if (mouse.down) firePlayer();

    updateCores(dt);
    updateUpgrades();
    updateCrates(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateExtraction(dt);
    updateParticles(dt);
    updateSpawner(dt);

    camera.x += (p.x - width / 2 - camera.x) * Math.min(1, 8 * dt);
    camera.y += (p.y - height / 2 - camera.y) * Math.min(1, 8 * dt);
    camera.x = clamp(camera.x, 0, Math.max(0, WORLD.w - width));
    camera.y = clamp(camera.y, 0, Math.max(0, WORLD.h - height));
    camera.shake = Math.max(0, camera.shake - 40 * dt);
    pressed.clear();
  }

  function updateCores(dt) {
    const p = run.player;
    let nearest = null;
    run.cores.forEach((core) => {
      if (core.found) return;
      core.pulse += dt * 2.6;
      const d = dist(p.x, p.y, core.x, core.y);
      if (d < 72) nearest = core;
    });

    if (!nearest) return;
    if (keys.has("KeyE")) {
      nearest.attune += dt;
      spawnParticles(nearest.x, nearest.y, "#ffe8a6", 2, 0.4);
      if (nearest.attune >= 1.15) {
        nearest.found = true;
        p.cores += 1;
        p.scrap += 3;
        run.score += 450;
        camera.shake = Math.max(camera.shake, 10);
        spawnParticles(nearest.x, nearest.y, "#ffe8a6", 34, 1.2);
        flashMessage(p.cores < 6 ? `Signal core recovered: ${p.cores}/6.` : "All cores recovered. Return to the yellow extraction ring.", 3.6);
        beep(330, 0.12, "triangle", 0.7, 420);
        if (p.cores >= 6) run.extractionOpen = true;
        for (let i = 0; i < 2 + Math.floor(run.threat / 2); i += 1) spawnEnemy();
      }
    } else {
      nearest.attune = Math.max(0, nearest.attune - dt * 0.7);
    }
  }

  function updateUpgrades() {
    const p = run.player;
    const cost = (kind) => 3 + p.upgrades[kind] * 3;
    const buy = (kind, label) => {
      if (p.scrap < cost(kind) || p.upgrades[kind] >= 3) return;
      p.scrap -= cost(kind);
      p.upgrades[kind] += 1;
      if (kind === "engine") p.speed += 28;
      if (kind === "shield") {
        p.shieldMax += 22;
        p.shield = p.shieldMax;
      }
      flashMessage(`${label} upgraded.`, 2.4);
      beep(640, 0.08, "triangle", 0.55, 240);
    };
    if (pressed.has("Digit1")) buy("cannon", "Cannon");
    if (pressed.has("Digit2")) buy("engine", "Engine");
    if (pressed.has("Digit3")) buy("shield", "Shield");
  }

  function updateCrates() {
    run.crates.forEach((crate) => {
      if (crate.open) return;
      if (dist(run.player.x, run.player.y, crate.x, crate.y) < crate.r + run.player.r + 4) {
        crate.open = true;
        run.player.scrap += 1;
        run.score += 80;
        spawnParticles(crate.x, crate.y, "#9fe4c6", 16, 0.8);
        beep(460, 0.04, "square", 0.42, 90);
      }
    });
  }

  function updateBullets(dt) {
    for (let i = run.bullets.length - 1; i >= 0; i -= 1) {
      const b = run.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || !canMoveTo(b.x, b.y, b.r)) {
        spawnParticles(b.x, b.y, "#ffe8a6", 3, 0.4);
        run.bullets.splice(i, 1);
        continue;
      }
      let hit = false;
      for (const enemy of run.enemies) {
        if (dist(b.x, b.y, enemy.x, enemy.y) < b.r + enemy.r) {
          enemy.hp -= b.damage;
          enemy.hit = 0.08;
          spawnParticles(b.x, b.y, enemy.color, 7, 0.65);
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const crate of run.crates) {
          if (!crate.open && dist(b.x, b.y, crate.x, crate.y) < b.r + crate.r) {
            crate.hp -= b.damage;
            spawnParticles(b.x, b.y, "#9fe4c6", 5, 0.55);
            if (crate.hp <= 0) {
              crate.open = true;
              run.player.scrap += 2;
              run.score += 120;
              spawnParticles(crate.x, crate.y, "#9fe4c6", 20, 0.85);
            }
            hit = true;
            break;
          }
        }
      }
      if (hit) run.bullets.splice(i, 1);
    }

    for (let i = run.enemyBullets.length - 1; i >= 0; i -= 1) {
      const b = run.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || !canMoveTo(b.x, b.y, b.r)) {
        run.enemyBullets.splice(i, 1);
        continue;
      }
      if (dist(b.x, b.y, run.player.x, run.player.y) < b.r + run.player.r) {
        damagePlayer(b.damage, b.x, b.y);
        run.enemyBullets.splice(i, 1);
      }
    }
  }

  function updateEnemies(dt) {
    const p = run.player;
    for (let i = run.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = run.enemies[i];
      if (enemy.hp <= 0) {
        run.enemies.splice(i, 1);
        p.scrap += enemy.type === "bulwark" ? 2 : 1;
        run.score += enemy.type === "bulwark" ? 220 : 110;
        spawnParticles(enemy.x, enemy.y, enemy.color, enemy.type === "bulwark" ? 30 : 18, 1);
        beep(enemy.type === "bulwark" ? 180 : 260, 0.05, "sawtooth", 0.35, -80);
        continue;
      }
      enemy.hit = Math.max(0, enemy.hit - dt);
      const a = angleTo(enemy.x, enemy.y, p.x, p.y);
      const d = dist(enemy.x, enemy.y, p.x, p.y);
      let desired = 0;
      if (enemy.type === "hound" || enemy.type === "bulwark") desired = 1;
      if (enemy.type === "spitter") desired = d > 360 ? 1 : d < 240 ? -0.65 : 0;
      moveCircle(enemy, Math.cos(a) * enemy.speed * desired * dt, Math.sin(a) * enemy.speed * desired * dt, enemy.r);

      if (d < enemy.r + p.r + 4) {
        damagePlayer(enemy.type === "bulwark" ? 24 : 15, enemy.x, enemy.y);
        const push = angleTo(enemy.x, enemy.y, p.x, p.y);
        moveCircle(p, Math.cos(push) * 32, Math.sin(push) * 32, p.r);
      }

      enemy.fire -= dt;
      if ((enemy.type === "spitter" || enemy.type === "bulwark") && enemy.fire <= 0 && d < 620) {
        enemy.fire = enemy.type === "bulwark" ? rand(2.0, 2.8) : rand(1.1, 1.8);
        const shots = enemy.type === "bulwark" ? [-0.18, 0, 0.18] : [0];
        shots.forEach((offset) => {
          const aa = a + offset;
          run.enemyBullets.push({
            x: enemy.x + Math.cos(aa) * enemy.r,
            y: enemy.y + Math.sin(aa) * enemy.r,
            vx: Math.cos(aa) * 285,
            vy: Math.sin(aa) * 285,
            life: 2.3,
            r: 5,
            damage: enemy.type === "bulwark" ? 13 : 11,
          });
        });
        spawnParticles(enemy.x, enemy.y, enemy.color, 8, 0.55);
      }
    }
  }

  function updateExtraction(dt) {
    if (!run.extractionOpen || run.extractionDone) return;
    const p = run.player;
    const d = dist(p.x, p.y, run.start.x, run.start.y);
    if (d < 112) {
      run.extraction += dt;
      if (Math.floor(run.extraction * 5) % 3 === 0) spawnParticles(run.start.x, run.start.y, "#ffe8a6", 1, 0.5);
      if (run.extraction >= 10) {
        run.extractionDone = true;
        endGame(true);
      }
    } else {
      run.extraction = Math.max(0, run.extraction - dt * 0.7);
    }
  }

  function updateParticles(dt) {
    for (let i = run.particles.length - 1; i >= 0; i -= 1) {
      const p = run.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.055, dt);
      p.vy *= Math.pow(0.055, dt);
      p.life -= dt;
      if (p.life <= 0) run.particles.splice(i, 1);
    }
  }

  function updateSpawner(dt) {
    run.spawnTimer -= dt;
    if (run.spawnTimer > 0) return;
    run.wave += 1;
    const count = Math.min(9, 2 + Math.floor(run.threat) + (run.extractionOpen ? 2 : 0));
    for (let i = 0; i < count; i += 1) spawnEnemy();
    run.spawnTimer = Math.max(4.4, 10.5 - run.threat * 0.55);
    if (run.extractionOpen) flashMessage("Static surge incoming. Hold the extraction ring.", 2.8);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!run) {
      drawTitleBackdrop();
      updateHud();
      return;
    }
    const sx = camera.shake ? rand(-camera.shake, camera.shake) : 0;
    const sy = camera.shake ? rand(-camera.shake, camera.shake) : 0;
    ctx.save();
    ctx.translate(-camera.x + sx, -camera.y + sy);
    drawWorld();
    ctx.restore();
    drawVignette();
    updateHud();
  }

  function drawTitleBackdrop() {
    const g = ctx.createRadialGradient(width / 2, height / 2, 30, width / 2, height / 2, Math.max(width, height) * 0.7);
    g.addColorStop(0, "#123044");
    g.addColorStop(0.5, "#07121a");
    g.addColorStop(1, "#05070a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 120; i += 1) {
      const x = (i * 97) % width;
      const y = (i * 193) % height;
      ctx.fillStyle = `rgba(233,244,255,${0.12 + (i % 7) * 0.04})`;
      ctx.fillRect(x, y, 1 + (i % 2), 1 + (i % 2));
    }
  }

  function drawWorld() {
    const bg = ctx.createLinearGradient(0, 0, WORLD.w, WORLD.h);
    bg.addColorStop(0, "#071018");
    bg.addColorStop(0.46, "#0b1722");
    bg.addColorStop(1, "#0a0d13");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);

    ctx.strokeStyle = "rgba(84, 214, 255, 0.055)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.w; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.h);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD.h; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.w, y);
      ctx.stroke();
    }

    run.stars.forEach((s) => {
      ctx.fillStyle = `rgba(231, 244, 255, ${s.a})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });

    drawExtraction();
    run.obstacles.forEach(drawObstacle);
    run.crates.forEach(drawCrate);
    run.cores.forEach(drawCore);
    run.bullets.forEach((b) => drawBullet(b, "#ffe8a6", "#ffffff"));
    run.enemyBullets.forEach((b) => drawBullet(b, "#9fe4c6", "#eafff6"));
    run.enemies.forEach(drawEnemy);
    drawPlayer();
    run.particles.forEach(drawParticle);
    drawMinimap();
  }

  function drawExtraction() {
    const x = run.start.x;
    const y = run.start.y;
    ctx.save();
    ctx.globalAlpha = run.extractionOpen ? 1 : 0.28;
    ctx.strokeStyle = "#ffe8a6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 112, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,232,166,0.2)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(x, y, 112, -Math.PI / 2, -Math.PI / 2 + TAU * (run.extraction / 10));
    ctx.stroke();
    ctx.fillStyle = "rgba(255,232,166,0.12)";
    ctx.beginPath();
    ctx.arc(x, y, 46 + Math.sin(run.time * 3) * 4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawObstacle(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.rot);
    ctx.fillStyle = `hsl(${o.hue} 24% 15%)`;
    ctx.strokeStyle = `hsl(${o.hue} 44% 32%)`;
    ctx.lineWidth = 2;
    ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    ctx.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(-o.w / 2 + 10, -o.h / 2 + 9, Math.max(14, o.w - 20), 5);
    ctx.restore();
  }

  function drawCrate(crate) {
    if (crate.open) return;
    ctx.save();
    ctx.translate(crate.x, crate.y);
    ctx.fillStyle = "rgba(159,228,198,0.15)";
    ctx.strokeStyle = "#9fe4c6";
    ctx.lineWidth = 2;
    ctx.rotate(Math.sin((run.time + crate.x) * 0.9) * 0.04);
    ctx.fillRect(-crate.r, -crate.r, crate.r * 2, crate.r * 2);
    ctx.strokeRect(-crate.r, -crate.r, crate.r * 2, crate.r * 2);
    ctx.beginPath();
    ctx.moveTo(-crate.r, 0);
    ctx.lineTo(crate.r, 0);
    ctx.moveTo(0, -crate.r);
    ctx.lineTo(0, crate.r);
    ctx.stroke();
    ctx.restore();
  }

  function drawCore(core) {
    if (core.found) return;
    const r = 18 + Math.sin(core.pulse) * 4;
    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.strokeStyle = "rgba(255,232,166,0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 58 + Math.sin(core.pulse) * 6, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "#ffe8a6";
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.78, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.78, 0);
    ctx.closePath();
    ctx.fill();
    if (core.attune > 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 33, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(core.attune / 1.15, 0, 1));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = run.player;
    const a = angleTo(p.x, p.y, mouse.worldX, mouse.worldY);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    if (p.invuln > 0) {
      ctx.globalAlpha = 0.65 + Math.sin(run.time * 60) * 0.25;
    }
    ctx.fillStyle = "#54d6ff";
    ctx.strokeStyle = "#e9f4ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(-16, -13);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-16, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe8a6";
    ctx.fillRect(4, -3, 13, 6);
    if (p.dash > 0) {
      ctx.fillStyle = "rgba(84,214,255,0.45)";
      ctx.beginPath();
      ctx.moveTo(-17, -10);
      ctx.lineTo(-48, 0);
      ctx.lineTo(-17, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (p.shield > 1) {
      ctx.strokeStyle = `rgba(84,214,255,${0.18 + p.shield / p.shieldMax * 0.38})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 27, 0, TAU);
      ctx.stroke();
    }
  }

  function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const a = angleTo(enemy.x, enemy.y, run.player.x, run.player.y);
    ctx.rotate(a);
    ctx.globalAlpha = enemy.hit > 0 ? 0.65 : 1;
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = "#081018";
    ctx.lineWidth = 3;
    if (enemy.type === "hound") {
      ctx.beginPath();
      ctx.moveTo(enemy.r, 0);
      ctx.lineTo(-enemy.r * 0.75, -enemy.r * 0.72);
      ctx.lineTo(-enemy.r * 0.42, 0);
      ctx.lineTo(-enemy.r * 0.75, enemy.r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.type === "spitter") {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#071018";
      ctx.fillRect(0, -4, enemy.r + 8, 8);
    } else {
      ctx.fillRect(-enemy.r, -enemy.r * 0.72, enemy.r * 2, enemy.r * 1.44);
      ctx.strokeRect(-enemy.r, -enemy.r * 0.72, enemy.r * 2, enemy.r * 1.44);
      ctx.fillStyle = "#071018";
      ctx.fillRect(4, -5, enemy.r + 9, 10);
    }
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 11, enemy.r * 2, 4);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 11, enemy.r * 2 * Math.max(0, enemy.hp / enemy.hpMax), 4);
  }

  function drawBullet(b, color, core) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(b.x, b.y, Math.max(1, b.r - 1), 0, TAU);
    ctx.fill();
  }

  function drawParticle(p) {
    const alpha = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMinimap() {
    const pad = 18;
    const mw = 170;
    const mh = 122;
    const x = camera.x + width - mw - pad;
    const y = camera.y + height - mh - pad;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(4,8,12,0.68)";
    ctx.strokeStyle = "rgba(233,244,255,0.2)";
    ctx.fillRect(0, 0, mw, mh);
    ctx.strokeRect(0, 0, mw, mh);
    const sx = mw / WORLD.w;
    const sy = mh / WORLD.h;
    run.cores.forEach((core) => {
      if (core.found) return;
      ctx.fillStyle = "#ffe8a6";
      ctx.fillRect(core.x * sx - 2, core.y * sy - 2, 4, 4);
    });
    ctx.fillStyle = run.extractionOpen ? "#ffe8a6" : "rgba(255,232,166,0.45)";
    ctx.beginPath();
    ctx.arc(run.start.x * sx, run.start.y * sy, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff5770";
    run.enemies.forEach((enemy) => ctx.fillRect(enemy.x * sx - 1.5, enemy.y * sy - 1.5, 3, 3));
    ctx.fillStyle = "#54d6ff";
    ctx.beginPath();
    ctx.arc(run.player.x * sx, run.player.y * sy, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.25, width / 2, height / 2, Math.max(width, height) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.58)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function updateHud() {
    if (!run) {
      objectiveEl.textContent = "Press Enter to launch";
      runStatsEl.textContent = "";
      upgradeHintEl.textContent = "";
      audioStatusEl.textContent = audio ? `Audio ${audio.context.state}; music ${audio.music.enabled ? "on" : "muted"}` : "Audio waits for launch";
      toastEl.textContent = "";
      hullBar.style.width = "100%";
      shieldBar.style.width = "100%";
      return;
    }
    const p = run.player;
    const nearCore = run.cores.find((core) => !core.found && dist(p.x, p.y, core.x, core.y) < 72);
    if (run.extractionOpen) {
      objectiveEl.textContent = `Hold extraction ring: ${Math.floor(run.extraction)}/10s`;
    } else if (nearCore) {
      objectiveEl.textContent = `Hold E to attune core (${Math.round(clamp(nearCore.attune / 1.15, 0, 1) * 100)}%)`;
    } else {
      objectiveEl.textContent = `Recover signal cores: ${p.cores}/6`;
    }
    runStatsEl.textContent = `Scrap ${p.scrap} | Score ${run.score} | Threat ${run.threat.toFixed(1)} | ${Math.floor(run.time)}s`;
    const cost = (kind) => 3 + p.upgrades[kind] * 3;
    const maxed = (kind) => (p.upgrades[kind] >= 3 ? "MAX" : cost(kind));
    upgradeHintEl.textContent = `1 Cannon ${maxed("cannon")} | 2 Engine ${maxed("engine")} | 3 Shield ${maxed("shield")}`;
    audioStatusEl.textContent = audio ? `Audio ${audio.context.state}; music ${audio.music.enabled ? "on" : "muted"} | M mute | T test` : "Audio off | T test";
    toastEl.textContent = run.messageTimer > 0 ? run.message : "";
    hullBar.style.width = `${clamp(p.hp / p.hpMax, 0, 1) * 100}%`;
    shieldBar.style.width = `${clamp(p.shield / p.shieldMax, 0, 1) * 100}%`;
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    pumpMusic();
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (!keys.has(event.code)) pressed.add(event.code);
    keys.add(event.code);
    if (event.code === "Enter" && (state === "title" || state === "win" || state === "lose")) startGame();
    if (event.code === "KeyM") toggleMusic();
    if (event.code === "KeyT") testAudio();
    if (event.code === "KeyP" && run && (state === "playing" || state === "paused")) {
      state = state === "playing" ? "paused" : "playing";
      overlay.classList.toggle("hidden", state === "playing");
      overlay.querySelector("h1").textContent = "Paused";
      overlay.querySelector("p").textContent = "The relay can wait for a moment. Press P or the button to resume.";
      startButton.textContent = "Resume";
    }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  window.addEventListener("mousedown", () => {
    initAudio();
    mouse.down = true;
  });
  window.addEventListener("mouseup", () => {
    mouse.down = false;
  });
  startButton.addEventListener("click", () => {
    if (state === "paused") {
      state = "playing";
      overlay.classList.add("hidden");
      return;
    }
    startGame();
  });

  resize();
  requestAnimationFrame(loop);
})();
