# AA Benchmark

轻量的模型基准对比 App：原生 TypeScript 前端、Cloudflare Worker、D1（两张表）和 R2 图标。只保存最新数据，原始下载 HTML 保留供参考。当前数据来自原始 HTML，尚未核验来源数值。

线上地址：https://aa-benchmark.iverson-lu.workers.dev

当前账号的云端 D1 和 R2 已初始化，`wrangler.jsonc` 已配置真实 D1 ID。日常代码更新运行 `npm run deploy`；数据更新运行 `npm run data:remote`；图标更新运行 `npm run assets:remote`，无需再次创建资源。GitHub 自动部署尚未连接。

## 本地预览

需要 Node.js 22 或更新版本。

```powershell
npm ci
npm run setup:local
npm run dev
```

打开 http://localhost:8787 。本地 D1 和 R2 使用 Wrangler 模拟并持久化到 `.wrangler`，无需登录 Cloudflare。

支持搜索、厂商/模型类型/Harness 筛选、多模型勾选对比、最佳值高亮、Escape 退出对比。缺失值显示为 `—`。

## 更新数据

编辑 `data/latest.json`，保持数值为数字、缺失值为 `null`，再运行 `npm run setup:local` 更新本地资源。这个操作替换当前模型和厂商数据。

`npm run data:extract` 是从原始 HTML 重新提取数据及页面的工具，会覆盖 `data/latest.json`、`index.html`、`src/style.css` 和对应图标；日常更新不要运行它。

## 首次部署 Cloudflare

```powershell
npx wrangler login
npx wrangler d1 create aa-benchmark-db
npx wrangler r2 bucket create aa-benchmark-icons
```

如果部署到其他账号，将新创建的真实 D1 `database_id` 填入 `wrangler.jsonc`，替换当前 ID。若账号尚未启用 R2，需要先在 Cloudflare 控制台启用。

```powershell
npm run data:remote
npm run assets:remote
npm run deploy
```

`data:remote` 替换远端当前模型/厂商数据，`assets:remote` 上传图标，`deploy` 仅发布页面和 Worker。图标缓存一小时。

## GitHub 自动部署

在 Workers Builds 连接本仓库，部署分支设为 `main`，Worker 名称为 `aa-benchmark`。构建命令 `npm run check && npm run build`，部署命令 `npx wrangler deploy`。先完成真实 D1 ID 配置和资源初始化，再开启自动部署。

代码 push 后自动上线；D1 数据和 R2 图标不会随代码部署自动导入。

## 检查

```powershell
npm run check
npm run build
```

本地服务启动后，运行 `npm run test:smoke` 检查导入的数据、R2 图标、静态资源和只读 API。

API：`GET /api/snapshot` 读取 D1 最新数据，`GET /icons/providers/<id>.svg` 读取 R2 图标。公开 API 只读，不提供数据修改接口。
