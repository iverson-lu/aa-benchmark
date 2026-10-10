# AA Benchmark

轻量的模型决策 Dashboard，保留搜索、厂商/模型类型/Harness 筛选、分组表格、热力图与冻结表头。新增六种列视图、2–5 模型对比面板、Terminal-Bench Harness Δ、数据来源弹窗及成本 / 能力 Pareto 图。使用原生 TypeScript 前端、Cloudflare Worker、D1（`providers`、`models` 两张表）和 R2 图标，仅保存最新数据。

基础数据保留原始 HTML 导入结果；近期补充模型的核对来源保存在 `data/*sources.md`。本次 Dashboard 升级不修改任何基准数值，也不代表历史数据已全部核验。

## 模型决策功能与计算口径

- 模型系列（Master）：默认每条系列只显示当前快照中最新的版本，勾选“显示全部版本”展开历史，开关状态保存在 localStorage。当前 GPT Sol / Luna、Claude Opus / Sonnet 共折叠 5 个历史版本，默认 21 条，完整数据仍为 26 条。表格与成本图同步，收起历史保留已勾选模型的对比状态。Reset 清除搜索和其他筛选，保留版本开关偏好。
- `src/families.ts` 显式维护系列 ID、名称和从新到旧的模型 ID 列表。新增同系列版本时将它加入对应列表的正确位置；不通过名称、NEW 标签、分数或快照日期推断版本关系。未配置的模型独立显示，不将 Astra / Terra、Argon / Flash、Pro / Flash 等不同产品线自动合并。先确定各系列最新版本，再执行搜索等筛选；查看旧版本需要打开历史开关。
- View：Overview（新用户默认）、Model Capability、Coding、Agent、Cost Efficiency、All。选择存于 localStorage；切换视图保留筛选及勾选状态。All 保留原始 15 列。
- Compare selected：选择 2–5 个模型打开对比面板，分别比较模型能力、Agent 成绩、Harness 影响、API 价格和任务效率。关闭保留勾选，移除及清空与主表同步。筛选不移除已选模型。
- Harness Δ：仅计算 Terminal-Bench 4.0 Harness − Model 的百分比点差；任一侧缺失显示 `—`，不比较其他基准。
- AA Coding Agent Index v1.5（按官方公式复算）：`(DeepSWE v1.1 + Terminal-Bench 4.0 Harness + SWE-Atlas-QnA) / 3`。采用 [AA 官方方法](https://artificialanalysis.ai/methodology/coding-agents-benchmarking) 的三项等权平均，不做 min–max 或百分位归一化。本地要求三项有效百分比分数齐全；缺失任一项显示 N/A，不用两项平均补齐。已有数据是公开显示的整数分数，复算值可能与 AA 使用完整精度计算的官方结果有少量舍入差异。模型指数不受其他模型或筛选影响。
- Value Index（内部派生）：上述复算指数 / 正数 Cost per Task，再除以完整快照的最大有效比值并乘 100。缺失、零或负成本及不完整的三项成绩不计算。这一成本效率比例仍是本 App 的内部指标，未声称为 AA 官方指数。
- Pareto：在当前图表所显示的模型中，没有另一模型成本不高于它、Coding Agent Index 不低于它，且至少一维严格更优。等成本更强的模型构成支配；完全相同的点都保留。绿色优选点始终突出，连线默认关闭，可通过“连接绿色优选点”开启；连线仅帮助观察取舍，不代表预测或连续产品。筛选 / 对比改变前沿的候选集合，不改变单个模型的指数及 Value Index 的参考快照。
- 对比摘要：Best Overall 使用 AA Intelligence；Best Model Capability 仅在五项模型指标完整且逐项占优时显示。Agent / Value 摘要需要匹配的指标覆盖；任何候选缺失相应数据时不推断赢家。单项成绩仍可标记 Best available 和并列排名。

Coding Agent Index 使用 AA 官方公式复算，未冒充 AA 直接发布的精确指数；Value Index 仍为内部计算。任务成本直接使用已有数据，不从基准分数或 API 单价推算。不同 Harness、effort 和测试设置可能影响可比性。

### 渐进补充来源

`data/provenance.ts` 是独立的模型 ID / 数据字段来源映射，由 Worker 附加到 `/api/snapshot`，无需变更 D1 结构或重新导入数值。当前只接入仓库来源文档明确记录的 Haiku 5.5、Gemini 4 Argon、MiMo-V2.6-Flash 及 Qwen Agent 版本备注；其余历史成绩尚缺逐项原始链接、测试 / 发布日期和方法论信息。

`checkedDate` 表示来源核对日期，`data_date` 表示数据快照日期，两者均不能当作测试 / 发布日期。未知缺失原因仍显示 `—`；仅有来源信息的单元格在悬停或键盘聚焦时显示 ⓘ，默认隐藏，点击数据本身也可打开详情，支持触屏。来源字段支持 `source`、`sourceUrl`、`methodologyUrl`、`date`、`checkedDate`、`harness`、`effort`、`status` 和 `notes`，只填写已知事实。

前端还兼容 `{ value: 73, source: '…', status: 'Published', … }` 结构的基准值及原有数字 / `null`。当前 D1 和 `data/latest.json` 仍保存数字 / `null`；来源信息独立维护在映射中。

模块：`src/views.ts` 管理列视图，`src/analysis.ts` 负责派生计算，`src/chart.ts` 绘制 SVG 图表，`src/compare.ts` 渲染对比面板，`src/provenance.ts` 渲染安全链接和来源弹窗。未增加图表运行依赖。

## 本地开发

### 前置条件

- 安装 Git。
- 安装 Node.js 22 或更新版本及 npm。
- 本地开发无需 Cloudflare 账号，也无需登录 Cloudflare。

### Clone 并首次启动

在终端依次执行：

```sh
git clone https://github.com/iverson-lu/aa-benchmark.git
cd aa-benchmark
npm ci
npm run setup:local
npm run dev
```

这几步分别完成：

1. 下载代码并进入项目目录。
2. 按 `package-lock.json` 安装依赖。
3. 创建本地 D1 数据表，将 `data/latest.json` 中的数据导入，并将 `icons/` 中的图标写入本地模拟 R2。
4. 构建前端并启动本地 Worker。

服务启动后打开 http://localhost:8787 。保持该终端运行，按 `Ctrl+C` 停止服务。

本地开发可以直接使用仓库中的 `wrangler.jsonc`，无需修改数据库 ID。上述本地命令使用 Wrangler 模拟存储，不会访问或修改云端 D1 和 R2。

### 后续启动与修改

本地数据会保留，后续启动只需运行：

```sh
npm run dev
```

前端 TypeScript、CSS 和 HTML 修改后，停止服务并重新运行 `npm run dev`，再刷新页面。当前脚本在启动时构建前端，不提供前端热更新。

如果拉取的代码修改了依赖，重新运行 `npm ci`。如果需要加载更新后的数据、图标，或重新初始化本地存储，运行 `npm run setup:local`。

### 本地文件与数据

| 路径 | 用途 |
| --- | --- |
| `src/`、`index.html` | 前端代码和页面 |
| `worker/` | Worker API 和图标访问逻辑 |
| `data/latest.json` | 最新模型及厂商数据源 |
| `icons/` | SVG 图标源文件 |
| `migrations/` | D1 表结构迁移 |
| `.wrangler/state/v3/d1/` | 本地 D1 存储 |
| `.wrangler/state/v3/r2/` | 本地 R2 存储 |
| `dist/` | 前端构建输出 |

更新数据时编辑 `data/latest.json`，保持数值为数字、缺失值为 `null`；更新图标时编辑 `icons/` 下对应文件。然后运行：

```sh
npm run setup:local
```

该命令会替换本地当前模型和厂商数据，并上传图标到本地 R2。它不会更新云端存储。

`.wrangler`、`node_modules`、`dist` 和登录凭据不进入 Git。直接修改本地 D1 或 R2 的内容也不会随 Git 保存；需要共享或保留的修改应写入数据、图标源文件。

`npm run data:extract` 用于从原始 HTML 重新提取数据及页面，会覆盖 `data/latest.json`、`index.html`、`src/style.css` 和对应图标。日常开发或数据更新无需运行它。

### 验证

```sh
npm run check
npm test
npm run build
```

本地服务启动后，可以在另一个终端运行：

```sh
npm run test:smoke
```

`npm test` 验证 Harness Δ、官方 Coding Agent Index 等权公式（含零分 / 满分 / 不完整覆盖）、指数独立于参考人群、Value Index、Pareto（含等价点 / 相同成本）、缺失值、排名及视图映射，使用 Node.js 22.13 或更新版本的类型剥离功能。`test:smoke` 验证原始模型数据未变化、R2 图标、静态资源、缓存条件请求和只读 API。

## 部署到自己的 Cloudflare 账号

本地开发完成后，如果需要发布到公网，再执行本节。需要可使用 Workers、D1 和 R2 的 Cloudflare 账号；R2 未启用时，先在控制台完成开通。

### 首次部署

```sh
npx wrangler login
npx wrangler d1 create aa-benchmark-db
npx wrangler r2 bucket create aa-benchmark-icons
```

在浏览器完成登录授权。创建数据库后，将命令返回的 `database_id` 填入 `wrangler.jsonc` 的 `d1_databases` 配置，替换仓库中示例部署的 ID。保留绑定名称 `DB` 和 `ICONS`。

如果使用上述资源名称，现有脚本可以直接运行。若修改数据库或 bucket 名称，还需同步修改 `wrangler.jsonc` 与 `scripts/setup.mjs` 中的名称。

接着创建云端表结构、导入数据、上传图标并发布：

```sh
npm run data:remote
npm run assets:remote
npm run deploy
```

部署命令会输出该账号下的访问地址。GitHub 登录与 Cloudflare 登录独立，Cloudflare 凭据不会包含在仓库中。

### 后续更新

| 修改内容 | 执行命令 |
| --- | --- |
| 页面、样式、交互或 Worker 代码 | `npm run deploy` |
| 模型及厂商数据 | `npm run data:remote` |
| 图标 | `npm run assets:remote` |

`data:remote` 会替换已配置云端数据库中的当前模型和厂商数据。`deploy` 仅发布页面和 Worker，不会重新导入数据或图标。图标缓存一小时。

### 可选：GitHub 自动部署

在 Cloudflare Workers Builds 中连接自己的仓库，选择部署分支（例如 `main`），Worker 名称与 `wrangler.jsonc` 的 `name` 保持一致。

- 构建命令：`npm run check && npm run build`
- 部署命令：`npx wrangler deploy`

先完成账号资源创建、配置与数据导入，再启用自动部署。连接完成后，推送到选定分支会触发代码部署；D1 数据和 R2 图标仍需单独更新。未配置该集成时，`git push` 只更新 Git 仓库。

## API

- `GET /api/snapshot`：读取 D1 最新模型数据。
- `GET /icons/providers/<id>.svg`：读取 R2 品牌图标。

公开 API 只读，不提供数据修改接口。

## 示例站点

https://aa-benchmark.iverson-lu.workers.dev

示例站点的云端资源由维护者管理；本地开发无需访问这些资源。部署到自己的账号时，请使用自己创建的 D1 数据库 ID。
