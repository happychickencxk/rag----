# 前端推进路线

## P0：仓库与文档基线

目标：让项目可被人类和 AI agent 稳定接手。

- 补齐根 README。
- 建立 `.ai-agent` 文档体系。
- 明确小程序端边界和接口契约。
- 配置 `.gitignore`。
- 提交并推送到 private GitHub 仓库。

## P1：前端结构整理（已基本完成）

目标：完成 Figma Make 原型到原生微信小程序工程的首轮迁移。

- 保留 `frontend/figma_make` 作为原型来源。
- 在 `frontend/wechat_miniprogram` 中维护正式小程序页面。
- 迁移问答、知识库、历史、引用、反馈、我的页和异常状态。
- 使用 `utils/mock.js` 暂存迁移阶段数据。
- 先保持静态体验完整，再接真实接口。
- 已完成自定义导航、自定义 tabBar、主要页面迁移和图标整理。
- 已移除小程序工程内嵌 Git，由外层仓库统一管理。

## P2：接口接入准备 ✅ 已完成 (2026-06-27)

- 新增统一请求封装（`utils/request.js`），自动带 `Authorization` 和 `X-Client-Type: wechat`。
- 新增 token 存取和刷新逻辑（`utils/storage.js`）。
- 建立适配层（`adapters/index.js`），与 `03-api-contract.md` 对齐。
- 实现统一错误映射：400、401、403、404、409、413、429、500、503。
- 已接入知识库列表、用户信息、问答、会话、引用和反馈接口。
- 增加 mock/real 数据源切换（`config/api.js`），后端不可用时不让页面白屏。
- 已处理 API 基础地址重复 `/api/v1` 的风险。

## P3：问答主链路接入 ✅ 已完成

- 创建和恢复会话。
- 非流式问答（`POST /api/v1/qa/query`，stream=false）。
- SSE 流式输出（stream=true）。
- 渲染引用来源和最终 message_id。
- 处理无依据、低置信度、无权限、模型超时、敏感词拦截状态。

## P4：引用、历史和反馈闭环 ✅ 已完成

- 引用详情接入 citations 接口，含权限保护。
- 历史会话列表、消息恢复和单会话删除。
- 点赞、点踩、纠错提交到反馈接口。
- 反馈映射符合 API-Q07 枚举。

## P5：真实小程序迁移准备

目标：清理模板遗留内容，让小程序工程进入长期维护状态。

- 删除不再使用的云开发 QuickStart 旧页面、组件、图片和云函数。（待后续独立提交）
- 抽取可复用小程序组件。
- 保留 `frontend/figma_make` 作为交互验收版本和视觉参考。
- 已完成 API 合规清单 `11-api-compliance-checklist.md`。

## 当前优先级依据

详细需求和缺口以 `08-requirements-gap-analysis.md` 为准。首批实现提示词见 `09-claude-code-implementation-prompt.md`。
