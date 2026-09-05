# Validation record

[← Back to the exhibit](../README.md)

Validation applies to the source snapshots in [manifest.json](../manifest.json), captured September 5, 2026.

## Automated checks

| Check | Scope |
|:--|:--|
| Source identity | All ten original game files match the captured SHA-256 manifest |
| ZIP integrity | Three packages, exact contents, correct checksums, safe archive paths |
| Documentation | Relative Markdown and HTML links resolve inside the repository |
| Runtime references | Each game's referenced CSS and JavaScript files are present |
| JavaScript syntax | Both game scripts pass `node --check` |
| LASTLIGHT engine | Movement, pause, dash, pulse, AI/shooting, all five tides, upgrades, boss, victory, lantern defeat, restart, drawing calls |
| Lancer engine | Movement, collisions, dash, shooting/spread, upgrade costs/caps, crates, enemies, pause, all six cores, extraction gate/decay, win record, defeat, restart, drawing calls |

The [CI workflow](../.github/workflows/verify.yml) reruns these checks for pushes and pull requests. See [live workflow results](https://github.com/bitofastickler/one-prompt-two-worlds/actions) for the status of the current revision.

## What these checks do not establish

The engine checks use mocked DOM/Canvas interfaces and controlled state to reach key transitions. They check that drawing code can execute, not that its pixels look correct. They do not simulate browser layout, assess audible music, prove real-time performance, or establish whether a human can complete a balanced run.

The original LASTLIGHT creation encountered a browser-policy block when trying to navigate to its local file. No completed browser playtest is claimed for that run. This exhibit does not claim new browser playthroughs for either game; use the [playtest scorecard](playtest.md) for human results.

## Preserved implementation differences worth knowing

- LASTLIGHT automatically pauses on blur/hidden-tab events; Lancer expects the player to press P.
- LASTLIGHT catches storage errors. Lancer assumes `localStorage` access is available, so restrictive storage settings can interfere with starting, music toggling, or ending a run.
- LASTLIGHT uses a fixed-step accumulator; Lancer updates with a capped variable delta.
- Neither build includes a resume-from-mid-run save.

These properties are documented, not patched, so the comparison remains about the supplied artifacts.
