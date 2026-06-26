# 企业知识库 RAG 问答系统小程序前端

本仓库当前只负责企业知识库 RAG 问答系统的微信小程序前端设计与对接准备。现有 `frontend` 是 Figma Make 生成后的 React/Vite 高保真原型，用于验证小程序端页面结构、交互路径和接口字段映射；不是后端服务，也不是 Web 管理后台。

## 当前阶段

- 阶段目标：维护本地 git 基线，补齐项目说明，并建立面向 AI agent 的持续文档体系。
- 已有原型：问答首页、知识库选择、历史会话、引用详情、反馈纠错、我的页、异常状态预览。
- 接口依据：`docs/06-企业知识库RAG问答系统-前后端对接API接口文档.docx`。
- GitHub 仓库：`happychickencxk/rag----`，当前远程为 private。

## 目录结构

```text
.
├─ .ai-agent/       # 给后续 AI agent 读取和持续更新的项目上下文
├─ docs/            # 需求、设计、接口等 Word 文档原件
└─ frontend/        # React + Vite 小程序风格前端原型
```

重点文件：

- `.ai-agent/README.md`：AI agent 阅读入口。
- `.ai-agent/03-api-contract.md`：小程序端优先接口契约摘要。
- `frontend/src/app/App.tsx`：当前原型主应用，包含页面、组件、模拟数据和交互状态。
- `frontend/src/imports/rag_miniprogram_context.md`：小程序端产品背景压缩说明。
- `frontend/plans/ui-misty-firefly.md`：已有 UI 规划与设计 token。

## 本地运行

进入前端目录后安装依赖并启动开发服务：

```powershell
cd frontend
npm install
npm run dev
```

如果本机已使用 pnpm，也可以在 `frontend` 下执行：

```powershell
pnpm install
pnpm dev
```

构建检查：

```powershell
cd frontend
npm run build
```

本阶段没有修改运行时代码，因此基线维护提交不强制运行构建。后续只要改动 `frontend/src`，应至少运行一次构建检查。

## 开发约定

- 文档、注释、提交说明优先使用汉语。
- 当前工作范围限定为微信小程序前端体验与前后端接口对接准备。
- 不在小程序端实现文档上传、权限管理后台、模型配置、审计日志、统计大屏等 Web 管理功能。
- 每完成一个明确功能点，先更新对应 `.ai-agent` Markdown，再提交代码和文档。
- `.ai-agent` 是专门给 AI agent 使用的目录，避免把长期协作说明散落到主目录。

## Git 维护规则

- 直接维护 `main` 分支，当前远程为 `origin/main`。
- 单个功能完成后使用清晰中文 commit，例如：`完善项目说明与AI协作文档`。
- 提交前检查：

```powershell
git status -sb
git diff --check
```

- 推送后可验证：

```powershell
git ls-remote --heads origin main
```
