# WattWise — Electricity Cost Calculator

面向海外英文用户的免费电费计算器。无需账号、数据库或付费 API。

## 已实现

- 最多 20 种电器，功率、每日小时数、数量均可编辑。
- 自定义每 kWh 电价、币种、1–366 天计费周期。
- 每日、周期、全年费用，耗电量和电器费用占比。
- 常见电器示例、减少使用时间的节省估算。
- CSV 导出、包含输入的分享链接、可选本地保存。
- 手机适配、英文说明、FAQ、标题与描述、canonical、网站地图、robots.txt、WebApplication 结构化数据。

## 本地查看

在此目录运行 `node preview.cjs`，打开 http://127.0.0.1:4173/ 。
计算验证：`node tests/calculator.test.cjs`。
浏览器验证：`node tests/browser.cjs`（依赖本机已安装的 Edge 和当前环境的 Playwright）。

发布文件位于 `dist/`。可部署到静态托管服务，当前 Sites 身份保存在 `.openai/hosting.json`。如换域名，需同步修改 HTML canonical、og:url、结构化数据、robots.txt 与 sitemap.xml。

## 计算边界

周期费用 = Σ(瓦数 / 1000 × 每日等效运行小时 × 数量) × 每 kWh 电价 × 周期天数。
全年按相同每日使用量 × 365 天计算，不将任意周期称为自然月。
不包含固定服务费、税、阶梯电价、分时电价。0.16 USD/kWh 和预设功率仅为示例，不是实时价格或官方平均值。币种切换不换汇。

## 上线后 SEO

1. 确保站点允许公众访问；私有预览不能用于搜索收录。
2. 在 Google Search Console 添加 URL-prefix property，使用 Google 给出的 HTML 文件或 meta 标签完成所有权验证（需网站所有者的 Google 账户）。
3. 提交 `/sitemap.xml`，用 URL Inspection 检查首页，按实际状态申请收录。
4. 检查站点可访问性、抓取和索引状态。观察 impressions/clicks/query 数据；两周不足以判断 SEO 成败。
5. 根据真实搜索问题补充内容。先保持低成本，不接广告和付费服务。

本次未接入 Search Console 或任何统计服务。搜索引擎收录没有时间保证。
