# The brief, the builds, and the boundaries

[← Back to the exhibit](../README.md)

## The shared prompt

> Let’s try something fun. I want you to make me the best fully playable PC game you can with minimal input from me. I should be able to quickly play it locally without providing any game assets. You can write it in any language you want but I have to be able to run it from a batch file and you have to finish it in one shot. The genre, tone, and style are completely up to you. Are you up for the challenge?

The prompt was supplied in the LASTLIGHT conversation and recovered from the earlier game's saved prompt history. The recorded wording differs only in the apostrophe in “Let's.” Genre, theme, engine, mechanics, and visuals were left to the model.

## What is being compared

| Record | LASTLIGHT | Last Light Lancer |
|:--|:--|:--|
| Owner-attributed model | GPT-6 Astra | GPT-5.6 Sol |
| Owner-attributed reasoning | medium | high |
| Source folder name | `lastlight` | `game-generation-test-5.6sol` |
| Snapshot captured for this exhibit | September 5, 2026 | September 5, 2026 |
| Original Git commit available at capture | No commits in supplied repository | No commits in supplied repository |
| Snapshot identity | SHA-256 per file in [manifest](../manifest.json) | SHA-256 per file in [manifest](../manifest.json) |

The owner's attribution identifies the model settings. It is not an independent audit of generation telemetry. The original full transcripts, private workspace files, and account details are not bundled.

## What “one shot” means here

It is the **challenge instruction**: finish a playable game without an extended requirements conversation. An agent can use multiple tool calls, test its work, and fix issues within one response. It does not mean one tool call or no internal iteration.

This exhibit compares the **folders supplied by the owner**. Without complete, equivalent generation records, it cannot certify that every packaged file is the very first response's output or that neither game received any later changes. The current Sol source includes music controls and an audio test facility; those are described as properties of the supplied build, without a claim about when they were added.

## Method

1. Read both games' HTML, JavaScript, styles, README, and batch launcher.
2. Copy only the game files into this repository. Preserve their contents byte for byte.
3. Identify implemented mechanics and connect comparisons to named code functions.
4. Run syntax and isolated engine checks. Label these separately from human or browser playtesting.
5. Package deterministic ZIPs and publish their SHA-256 hashes.
6. Present the work with newly created editorial art and documentation, kept separate from the archived games.

## Interpretation limits

There is one captured build per model, different reasoning settings, and no controlled seed, repeated runs, blind judges, or standardized tool budget. Workspace context and tooling may also differ. Time, cost, token usage, and player enjoyment are not measured here. Feature counts and file sizes are descriptive facts; they are not a score for intelligence or creativity.

To turn this into a benchmark, repeat the prompt in clean environments, log configurations and costs, retain full generation artifacts, randomize play order, and collect blind playtest ratings across several runs. The [scorecard](playtest.md) is a starting point.
