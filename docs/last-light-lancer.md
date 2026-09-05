# Last Light Lancer

[← Back to the exhibit](../README.md) · [Download ZIP](https://github.com/bitofastickler/one-prompt-two-worlds/releases/latest/download/last-light-lancer.zip)

![Last Light Lancer editorial cover art](../assets/lancer.svg)

**Built with GPT-5.6 Sol · high reasoning** — owner-attributed configuration.

A dead relay is still calling. Recover six signal cores from a debris field, then return to the extraction ring before the static tears your ship apart.

## Start playing

Extract the ZIP and double-click **`run-game.bat`**. Click **Launch Run** or press Enter. Sound begins after interaction; use T if you want a short audio test.

| Control | Action |
|:--|:--|
| WASD / arrows | Move |
| Mouse | Aim |
| Hold left mouse | Fire |
| Space while moving | Dash with brief invulnerability |
| Hold E near a core | Attune and recover the core |
| 1 | Buy a cannon upgrade with scrap |
| 2 | Buy an engine upgrade with scrap |
| 3 | Buy a shield upgrade with scrap |
| P | Pause / resume |
| M | Toggle music; effects remain active |
| T | Play a short audio test |

## How a run works

1. Use the minimap to find the **six gold signal cores** scattered around the map.
2. Get close and hold E to attune each core. Enemies continue moving while you work.
3. Collect scrap from cores, crates, and defeated enemies. Buy improvements at any time using 1–3.
4. Once all six are recovered, return to the **yellow ring at the starting point**.
5. Hold the ring for ten seconds. Leaving the ring drains accumulated extraction progress.

The threat rises with time and recovered cores; extraction adds further pressure. Your shield regenerates after a period without damage, but losing all hull ends the run.

## A few useful instincts

- Move around debris rather than trying to push through it. Obstacles also block bullets.
- Each core awards enough scrap for an initial upgrade. Watch the costs in the HUD.
- Cannon level two adds a three-shot spread. Engine helps traverse the map; shield improves protection and regeneration.
- Shoot crates for more scrap than simply touching them.
- Plan a route home before recovering the final core. The minimap marks the extraction location.
- Press P before switching away from the game; this build does not automatically pause on window blur.

The game stores the fastest successful extraction in browser storage, alongside the music preference. There is no online leaderboard or mid-run save. If restrictive browser storage settings prevent a run from starting or ending correctly, use a normal browser profile; the original source does not catch storage-access exceptions.

## What's in the box

`index.html`, `styles.css`, `game.js`, `run-game.bat`, and the original `README.md`. They are unmodified snapshots of the owner's supplied folder. The illustration above belongs to the comparison exhibit and is not an in-game screenshot.

[See the source](../games/last-light-lancer) · [Compare with LASTLIGHT](comparison.md) · [Testing details](validation.md)
