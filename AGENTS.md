# Exhibit maintenance

- Work only in this comparison repository. The original game repositories are independent.
- Treat `games/` as preserved snapshots. Do not silently repair or improve them; new variants belong in a separately labeled edition.
- Keep model attribution (owner-provided), source observations, and subjective analysis distinct.
- Do not invent timing, cost, token usage, human playtest results, or first-turn provenance.
- Rebuild ZIPs with `python scripts/package.py`; verify with `python scripts/verify.py`.
- Run `node games/lastlight/test-game.cjs` and `node tests/lancer.cjs`.
- Label editorial artwork as illustration, never as a screenshot.
- Keep local usernames, absolute source paths, credentials, and private conversations out of published files.
