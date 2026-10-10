# Claude Haiku 5.5 数据来源

核对日期：2026-10-10。仅新增 Haiku 5.5，其他模型的成绩与数据日期保持原样。

- [AA 模型对比页](https://artificialanalysis.ai/models/comparisons/claude-haiku-5-5-vs-claude-haiku-5-5-xhigh)：采用 max effort，Intelligence 43、HLE 44%、GDPval-AA v2.1 1618、AutomationBench-AA 35%、SciCode 55%、Terminal-Bench 4.0 33%；输入/输出价格 $0.10 / $0.50 每百万 tokens。
- [AA Claude Code 对比页](https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli)：Claude Code + Haiku 5.5 (max)，DeepSWE v1.1 46%、Terminal-Bench 4.0 30%、SWE-Atlas-QnA 34%、平均总 tokens/task 13.8M、平均 API cost/task $2.58。没有采用 xhigh 的 Agent 结果，也没有将 Intelligence Index 的输出 tokens/task 或 cost/task 填进 Agent 指标。
- [AA 发布分析](https://artificialanalysis.ai/articles/claude-haiku-5-5)：2026-10-07 发布文章的 GDPval 为 1620，当前模型对比页为 1618，本次采用当前对比页。AutomationBench 成绩可能受到安全拒绝影响，AA 表示将复测。文章说明分档价格的支持仍在完善，任务成本应按 AA 已发布数值理解。
- [Anthropic 发布说明](https://www.anthropic.com/claude-haiku-5-5)：提示词不超过 100K tokens 时，输入/输出价格为 $0.10 / $0.50；超过 100K 时为 $0.50 / $2.50。网页价格栏显示前一档，后一档在模型备注中说明。

AA 页面按整数百分比及百万 tokens 显示，JSON 保留这些公开显示值的精度。
