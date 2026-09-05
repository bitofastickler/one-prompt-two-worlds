# Preserve the games. Reproduce the exhibit.

[← Back to the exhibit](../README.md)

## Repository layout

```text
README.md                 The visual comparison and download links
games/lastlight/           Unmodified Astra game snapshot
games/last-light-lancer/   Unmodified Sol game snapshot
assets/                   Editorial SVG illustrations
docs/                     Guides, analysis, method, validation
downloads/                Ready-to-play ZIPs and SHA-256 checksums
manifest.json             Per-file snapshot identity and attribution
scripts/                  Artwork, packaging, and verification tools
tests/                    Comparison-era checks for Lancer
PLAY BOTH.bat             Windows menu for choosing either game
```

## Playing versus maintaining

Players need only a desktop browser. The following commands are for contributors who want to verify or rebuild the exhibit. Use Python 3.11+ and Node 20+ from the repository root; there are no pip or npm dependencies.

```sh
python scripts/verify.py
node --check games/lastlight/game.js
node --check games/last-light-lancer/game.js
node games/lastlight/test-game.cjs
node tests/lancer.cjs
```

To rebuild the exact downloadable packages:

```sh
python scripts/package.py
python scripts/verify.py
```

To regenerate the editorial illustrations:

```sh
python scripts/artwork.py
```

## Snapshot rules

Game files were copied byte for byte. The original repositories had no commits at capture, so file digests identify the preserved versions. [manifest.json](../manifest.json) contains source-folder labels, owner-attributed model settings, file byte counts, and SHA-256 hashes; it deliberately omits private filesystem paths.

The LASTLIGHT engine test was already present in the supplied folder. `tests/lancer.cjs` was added for this exhibit. Tests expose game functions inside an isolated Node VM without modifying the archived files. Test state manipulation is limited to the harness and is not shipped as a gameplay feature.

`.gitattributes` prevents Git from normalizing line endings in `games/`. ZIP timestamps, paths, and permissions are fixed. The verifier checks each archived file, each package digest, directory contents, and relative documentation links.

No imported build tools or external assets are needed to play either game. A new improved game edition should be labeled separately instead of changing this capture silently.
