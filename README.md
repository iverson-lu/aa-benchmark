# AA Benchmark

轻量的模型基准对比 App，支持搜索、厂商/模型类型/Harness 筛选、多模型对比和最佳值高亮。使用原生 TypeScript 前端、Cloudflare Worker、D1（`providers`、`models` 两张表）和 R2 图标，仅保存最新数据。

当前数据从仓库保留的原始 HTML 导入，尚未核验来源数值。

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
npm run build
```

本地服务启动后，可以在另一个终端运行：

```sh
npm run test:smoke
```

该检查验证模型数据、R2 图标、静态资源、缓存条件请求和只读 API。

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
