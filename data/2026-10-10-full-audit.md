# AA Benchmark full data audit

Checked: 2026-10-10. This is the date the live pages were checked, not a benchmark run date.

## Scope and method

Checked all 26 model rows against their Artificial Analysis model comparison pages: AA Intelligence, HLE, GDPval-AA v2.1, AutomationBench-AA, SciCode, Terminal-Bench 4.0 model scores, and input/output API prices. The per-model comparison URLs are stored in `data/provenance.ts` and attached to each populated cell. The selected model column was matched by the model/effort shown in the page title and table.

Checked all 18 rows with published coding-agent data against the exact model/harness row in the linked AA coding-agent comparison page. This includes DeepSWE v1.1, Terminal-Bench 4.0 harness scores, SWE-Atlas-QnA, average tokens/task, average API cost/task, and the listed harness. Those values matched and were retained. Cells without a published numeric value remain blank.

The official [AA model benchmarking methodology](https://artificialanalysis.ai/methodology) describes its evaluation suite. The [Coding Agent Index methodology](https://artificialanalysis.ai/methodology/coding-agents-benchmarking) says Index v1.5 equally averages DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA. This app's derived Index applies that formula to AA's displayed component values; it is not a separately published AA score.

## Corrections

The live model comparison pages showed updated GDPval-AA v2.1 values for 21 models. The other model scores and all listed API prices matched the live comparison pages.

| Model | Previous | Current AA value |
| --- | ---: | ---: |
| Claude Sonnet 5.5 | 1840 | 1838 |
| Claude Opus 5 | 1726 | 1722 |
| Claude Sonnet 5 | 1466 | 1463 |
| Claude Fable 5.1 | 1758 | 1756 |
| GPT-6 Astra | 1542 | 1574 |
| GPT-6.1 Sol | 1575 | 1592 |
| GPT-6 Sol | 1510 | 1508 |
| GPT-5.6 Sol | 1588 | 1609 |
| GPT-5.6 Terra | 1453 | 1451 |
| GPT-6 Luna | 1437 | 1432 |
| GPT-5.6 Luna | 1464 | 1459 |
| Gemini 3.8 Flash | 1435 | 1436 |
| Grok 4.7 | 1716 | 1712 |
| Muse Spark 1.3 | 1684 | 1681 |
| Qwen3.8 Max (0902) | 1671 | 1667 |
| MiMo-V2.6-Pro | 1686 | 1685 |
| Kimi K3 | 1538 | 1533 |
| GLM-5.3 | 1653 | 1651 |
| GLM-5.3 Flash | 1647 | 1644 |
| Qwen3.8-Flash-Next | 1633 | 1629 |
| Qwen3.8 27B (xhigh) | 1423 | 1419 |

## Interpretation notes

- `checkedDate` records the source review date. `data_date` records this refreshed snapshot date and does not claim the benchmark was run on that day.
- Agent scores and efficiency values are tied to the specific harness/model/effort row linked from each cell. They should not be interpreted as model-only results.
- AA labels the Claude Code Qwen3.8 Max agent row without the `0902` suffix. The existing table note preserves that version caveat.
- Claude Haiku 5.5's AutomationBench result has AA's published caveat about possible safety-refusal effects and a planned retest; the currently displayed value is retained.
- MiMo-V2.6-Flash has current model scores and prices but no comparable AA coding-agent row, so its agent fields remain empty.
