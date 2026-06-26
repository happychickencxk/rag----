# 企业知识库 RAG 问答系统小程序前端原型

本目录是微信小程序端高保真前端原型。代码由 Figma Make 初版生成后继续维护，当前使用 React + Vite 模拟 375px x 812px 手机界面，用于验证小程序端问答、引用、反馈和权限状态。

## 当前实现

- 问答首页：知识库选择、示例问题、用户消息、AI 回答、引用折叠卡片、反馈操作和底部输入栏。
- 知识库页：列表、搜索入口、选中态、无权限态。
- 历史页：按时间分组的会话列表。
- 引用详情页：文档信息、章节路径、分数、命中高亮、权限提示。
- 反馈页：原问题摘要、回答摘要、反馈类型、补充说明、提交成功态。
- 我的页：用户身份、知识库权限、设置入口。
- 异常状态预览：Loading、NoEvidence、LowConfidence、NoPermission、ModelTimeout、SensitiveBlocked、EmptyHistory、EmptyKnowledgeBase。

## 重要文件

```text
frontend/
├─ src/main.tsx                  # React 挂载入口
├─ src/app/App.tsx               # 当前主应用和页面组件
├─ src/styles/index.css          # 样式入口
├─ src/styles/theme.css          # 设计 token 与基础样式
├─ src/imports/rag_miniprogram_context.md
└─ plans/ui-misty-firefly.md     # UI 规划与组件规范
```

## 运行方式

```powershell
npm install
npm run dev
```

构建检查：

```powershell
npm run build
```

如果使用 pnpm，也可以执行：

```powershell
pnpm install
pnpm dev
```

## 开发边界

- 本目录当前是 Web 原型，不是真实微信小程序工程。
- 页面应保持微信小程序单列体验，避免 Web 后台布局。
- 后续接入接口时以根目录 `.ai-agent/03-api-contract.md` 为准。
- 修改前端代码后，需要同步更新根目录 `.ai-agent` 中相关文档。
