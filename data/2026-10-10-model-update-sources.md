# 2026-10-10 model update

Live AA comparison checked through the browser:
https://artificialanalysis.ai/models/comparisons/gemini-4-argon-vs-mimo-v2-6-flash

| Field | Gemini 4 Argon (high) | MiMo-V2.6-Flash |
| --- | ---: | ---: |
| Intelligence v4.3.2 | 53 | 38 |
| HLE (%) | 57 | 35 |
| GDPval-AA v2.1 (Elo) | 1624 | 1605 |
| AutomationBench (%) | 78 | 64 |
| SciCode (%) | 62 | 51 |
| Terminal-Bench 4.0 model (%) | 57 | 23 |
| Input price ($/1M) | 2 | 0.14 |
| Output price ($/1M) | 10 | 0.28 |

MiMo GDPval search cache varies between 1605 and 1611; use the live comparison's 1605. MiMo has MIT open weights. Its Intelligence Index task cost is not the coding-agent task cost.

Gemini agent source:
https://artificialanalysis.ai/agents/coding-agents/comparisons/antigravity-cli-vs-claude-code

Antigravity CLI / Gemini 4 Argon: DeepSWE 79%, Terminal-Bench 56%, SWE-Atlas-QnA 56%, tokens/task 13.7M, cost/task $5.84. Cost/time chart labels the model high. Antigravity SDK only lists Gemini 3.8 Flash; do not use those results for Argon. MiMo is absent from the available agent comparison families and its agent fields remain null.

Muse max denotes effort and remains recorded in the harness and note:
https://artificialanalysis.ai/models/muse-spark-1-3

Qwen's asterisk is a provenance caveat, not NEW. AA still labels the Claude Code result Qwen3.8 Max without 0902, so the caveat and suffix remain:
https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli

Grok icon replaced the wide SpaceXAI mark with the square Grok symbol from Lobe Icons (MIT), version 1.90.0:
https://unpkg.com/@lobehub/icons-static-svg@1.90.0/icons/grok.svg
https://github.com/lobehub/lobe-icons
Copyright 2023 LobeHub. MIT license text: https://github.com/lobehub/lobe-icons/blob/master/LICENSE
