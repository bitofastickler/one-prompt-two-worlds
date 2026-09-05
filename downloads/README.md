# Download desk

[← Back to the exhibit](../README.md)

| Package | What you get | Download |
|:--|:--|:--|
| LASTLIGHT | Original game, Windows launcher, README, engine check | [Release ZIP](https://github.com/bitofastickler/one-prompt-two-worlds/releases/latest/download/lastlight.zip) · [Repository copy](https://github.com/bitofastickler/one-prompt-two-worlds/raw/refs/heads/main/downloads/lastlight.zip) |
| Last Light Lancer | Original game, Windows launcher, README | [Release ZIP](https://github.com/bitofastickler/one-prompt-two-worlds/releases/latest/download/last-light-lancer.zip) · [Repository copy](https://github.com/bitofastickler/one-prompt-two-worlds/raw/refs/heads/main/downloads/last-light-lancer.zip) |
| Both games | Both originals plus a combined Windows selection menu | [Release ZIP](https://github.com/bitofastickler/one-prompt-two-worlds/releases/latest/download/both-games.zip) · [Repository copy](https://github.com/bitofastickler/one-prompt-two-worlds/raw/refs/heads/main/downloads/both-games.zip) |

**Extract all before launching.** No server or development tools are needed. For controls, visit the [LASTLIGHT guide](../docs/lastlight.md) or [Lancer guide](../docs/last-light-lancer.md).

Every archive has a digest in [SHA256SUMS.txt](SHA256SUMS.txt). On Windows, `Get-FileHash .\both-games.zip -Algorithm SHA256` prints the value to compare. Archive contents match the [snapshot manifest](../manifest.json).

The release's ZIPs are the same bytes as these committed copies. Packaging is deterministic and rebuildable using [the packaging script](../scripts/package.py).
