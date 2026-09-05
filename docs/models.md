# Meet the models

[← Back to the exhibit](../README.md)

The exhibit compares **GPT-6 Astra with medium reasoning** against **GPT-5.6 Sol with high reasoning**, as identified by the challenge owner. These are different models at different reasoning settings.

## Official model facts

Facts below were checked against OpenAI's model documentation on **September 5, 2026**. Documentation and prices can change.

| Specification | GPT-6 Astra | GPT-5.6 Sol |
|:--|:--|:--|
| Model ID | `gpt-6-astra` | `gpt-5.6-sol` |
| Positioning | OpenAI's most capable model for difficult end-to-end work | Flagship model for complex professional work |
| Published context window | 1,050,000 tokens | 1,050,000 tokens |
| Published maximum output | 128,000 tokens | 128,000 tokens |
| Knowledge cutoff | April 30, 2026 | February 16, 2026 |
| Documented API reasoning settings | low, medium, high, xhigh, max | none, low, medium, high, xhigh, max |
| Standard input / output price per million tokens | $10 / $50 | $4 / $20 |

Sources: [OpenAI — GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [OpenAI — GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol).

These are published API specifications, not measurements of the Codex runs. Pricing in the table excludes caching, tool fees, and the different rates for prompts above 272K input tokens. Sol's documented prices are promotional through at least November 21, 2026. The actual cost of either game-generation run is unknown.

## How to read medium versus high

The reasoning setting configures how a model reasons. A higher label does not make two models directly comparable, and neither setting establishes an observed token count, latency, or dollar cost. This experiment does not show whether Astra used more or less compute than Sol.

The useful question is narrower: **what did each model choose to build under the owner's chosen settings?**

In these artifacts, Astra delivered a more explicitly staged defense game, with discrete build choices, a boss, and accessibility options. Sol delivered an exploration/extraction game with world navigation, a resource economy, and a more elaborate adaptive soundtrack. Those observations come from [the source comparison](comparison.md), not from the model specification pages.

## Claims we can and cannot support

- **Supported:** the shipped files contain the specific mechanics described in the comparison.
- **Owner-attributed:** which model and reasoning level generated each game.
- **Interpretation:** which design feels more coherent, surprising, or appealing.
- **Not established:** a universal winner, relative generation speed, relative cost, bug-free operation, or a general creativity ranking.

The games need no model or API connection when played. AI generated the source; ordinary JavaScript runs the game.
