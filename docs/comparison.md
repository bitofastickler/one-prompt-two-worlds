# Same prompt. Different design priorities.

[← Back to the exhibit](../README.md)

## 1. A place to protect versus a place to cross

LASTLIGHT makes one landmark do several jobs. The lighthouse anchors the composition, emits a sweeping beam, takes damage, and gives gold salvage a purpose. The player must choose between personal safety and saving a shared objective. Its fixed arena keeps that tradeoff visible.

Lancer puts its complexity into traversing a space. The world exceeds the viewport, obstacles restrict movement and shots, and six cores give the player destinations. A minimap makes the larger map legible. Returning to the starting ring closes the route with a timed stand.

**Source:** LASTLIGHT [`background`, `update`, `hud`](../games/lastlight/game.js); Lancer [`makeRun`, `moveCircle`, `canMoveTo`, `drawMinimap`, `updateExtraction`](../games/last-light-lancer/game.js).

## 2. Different kinds of combat attention

LASTLIGHT's default auto-fire frees attention for steering and pickup runs. Holding the mouse switches to manual aiming. Dashes also hurt creatures, and E trades a cooldown for damage and a cleared patch of hostile projectiles.

Lancer requires manual aiming and firing. Its dash is an escape tool, and its regenerating shield rewards finding breathing room. E is an interaction rather than a weapon: it makes the player linger beside a core while danger continues to build.

**Source:** LASTLIGHT [`fire`, `dash`, `pulse`, `hurt`](../games/lastlight/game.js); Lancer [`firePlayer`, `damagePlayer`, `update`, `updateCores`](../games/last-light-lancer/game.js).

## 3. Two approaches to progression

LASTLIGHT offers four intermissions before the final tide. Each repairs hull and lantern and samples three choices from an eight-type upgrade pool, subject to eligibility. Damage, rate, extra projectiles, hull, speed, pulse, salvage/regen, and piercing let a player push a build in several directions. The sampler uses random sorting; it is not a rigorously uniform shuffle.

Lancer lets the player buy improvements while moving. Cannon, engine, and shield each have three levels, costing 3, 6, and 9 scrap. Cores, crates, and defeated enemies feed the economy. This creates a simpler upgrade menu but a continuous decision about when and where to earn the next purchase.

**Source:** LASTLIGHT [`upgrades`, `dock`, `choose`](../games/lastlight/game.js); Lancer [`updateUpgrades`, `updateCrates`, `updateCores`, `updateEnemies`](../games/last-light-lancer/game.js).

## 4. A surprisingly strong distinction: sound

Both synthesize audio with Web Audio and require no sound assets. LASTLIGHT's music is a recurring eight-note pattern with an occasional bass tone. Its effects mark shots, hits, pickups, abilities, and transitions.

Lancer builds music from an eight-chord progression and a scale, scheduling overlapping tones with different envelopes and waveforms. Tempo increases with threat and jumps during extraction; additional rhythmic layers appear under pressure. Its M key toggles music, while T plays an audio test. LASTLIGHT's M key mutes both effects and music.

This makes **Sol's supplied build more elaborate in adaptive musical behavior**, even though Astra's build contains more discrete combat and intermission features. Complexity is distributed differently.

**Source:** LASTLIGHT [`sound`, `music`](../games/lastlight/game.js); Lancer [`scheduleTone`, `pumpMusic`, `scheduleMusicStep`, `toggleMusic`, `testAudio`](../games/last-light-lancer/game.js).

## 5. Presentation and finishing touches

LASTLIGHT has a dedicated title, upgrade, pause, victory, and defeat presentation; named tides; a native fullscreen shortcut; and an easier Navigator mode. It stores a best score and catches local-storage errors so denied storage does not stop the game.

Lancer uses a shared overlay for title, pause, and outcomes. Its HUD includes objectives, scrap, score, threat, purchase costs, audio state, hull, and shield. Its best record is **fastest successful extraction**, and its source is spread across HTML, CSS, and a conventionally formatted JavaScript file. Browser storage calls are not guarded against denial.

**Source:** LASTLIGHT [`index.html`](../games/lastlight/index.html), [`finish`, input listeners](../games/lastlight/game.js); Lancer [`index.html`](../games/last-light-lancer/index.html), [`styles.css`](../games/last-light-lancer/styles.css), [`endGame`, `updateHud`](../games/last-light-lancer/game.js).

## 6. What “creative” can mean here

Our editorial reading: Astra's strongest move is making a lantern into both story and responsibility. Sol's strongest move is making recovery, navigation, purchasing, and rising musical tension reinforce an extraction loop.

The games are not opposite ends of the genre spectrum. They share small ships, luminous objects, procedural enemies, dark palettes, and even related titles. That is evidence of aesthetic convergence in these two examples—not proof of copying or a general limit on either model's creativity.

Play both before deciding which choices matter more to you. A fixed arena and a larger world serve different goals; neither wins simply by being larger or having more features.

## Verification lens

This comparison is grounded in source inspection and isolated engine checks. Those checks deliberately control game state to exercise progression; they do not prove a human can win a balanced run, certify music quality, or replace a browser playtest. Preserved quirks remain part of the captured artifacts. See the [validation record](validation.md).
