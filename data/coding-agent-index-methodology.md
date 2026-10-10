# Coding Agent Index method verification

Checked: 2026-10-10. This is a source-check date, not a benchmark run date.

- [AA Coding Agent leaderboard](https://artificialanalysis.ai/agents/coding-agents/)
- [AA Coding Agent Index v1.5 methodology](https://artificialanalysis.ai/methodology/coding-agents-benchmarking)

The current v1.5 index equally averages DeepSWE v1.1, Terminal-Bench 4.0 and SWE-Atlas-QnA. Each component is a task-level average pass@1 percentage, with three evaluated attempts averaged per task. The component benchmark scores receive equal weight; this is not a task-count-weighted average or population-relative min–max normalization.

This app recomputes `(deepswe + terminal_harness + swe_atlas) / 3` from the existing percentage display values. It requires all three valid components; partial coverage is shown as N/A. That completeness rule is the app's safeguard against inventing a partial index. Values may differ slightly from AA's published index due to rounding of the stored component scores. Rankings use unrounded recomputation.

Chart points represent the model plus its recorded harness/effort configuration. Existing task costs are retained rather than reconstructed: the official efficiency methodology pools task/attempt telemetry and accounts for cache pricing; the repository does not contain that raw telemetry.

Value Index remains an explicitly internal cost-efficiency ratio based on this recomputation. No source scores, task costs, dates or model metadata were changed.
