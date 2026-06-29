# rag小程序代码

本仓库当前只负责企业知识库 RAG 问答系统的微信小程序前端设计与对接准备。`frontend/figma_make` 保留 Figma Make 生成的 React/Vite 高保真原型，`frontend/wechat_miniprogram` 是后续实际开发使用的微信小程序工程；本仓库不是后端服务，也不是 Web 管理后台。

该代码为 39 组成员制作。

## 当前阶段

- 阶段目标：将 Figma Make 原型迁移为原生微信小程序页面，并持续维护 git 与 AI agent 文档。
- 已有小程序页面：问答首页、知识库选择、历史会话、引用详情、反馈纠错、我的页、异常状态预览。
- 接口依据：`docs/06-企业知识库RAG问答系统-前后端对接API接口文档.docx`。
- GitHub 仓库：`happychickencxk/rag----`，当前远程为 private。

## 目录结构

```text
.
├─ .ai-agent/       # 给后续 AI agent 读取和持续更新的项目上下文
├─ docs/            # 需求、设计、接口等 Word 文档原件
├─ mock-server/     # 按接口文档实现的本地模拟后端与契约测试
└─ frontend/
   ├─ figma_make/          # Figma Make 生成的 React/Vite 原型源码
   └─ wechat_miniprogram/  # 后续实际开发的微信小程序工程
```

重点文件：

- `.ai-agent/README.md`：AI agent 阅读入口。
- `.ai-agent/06-handoff-current-task.md`：当前任务接力说明。
- `.ai-agent/03-api-contract.md`：小程序端优先接口契约摘要。
- `frontend/figma_make/src/app/App.tsx`：Figma Make 原型主应用，作为迁移来源。
- `frontend/figma_make/src/imports/rag_miniprogram_context.md`：小程序端产品背景压缩说明。
- `frontend/figma_make/plans/ui-misty-firefly.md`：已有 UI 规划与设计 token。
- `frontend/wechat_miniprogram/miniprogram/pages/chat/index.*`：当前小程序问答首页入口。
- `mock-server/server.js`：小程序联调使用的本地模拟后端。
- `mock-server/contract.test.js`：接口字段、鉴权和 SSE 契约测试。

## 本地运行

查看 Figma Make 原型：

```powershell
cd frontend\figma_make
npm install
npm run dev
```

后续主要开发目录是微信小程序工程：

```powershell
cd frontend\wechat_miniprogram
```

用微信开发者工具打开 `frontend/wechat_miniprogram`，预览和调试小程序页面。

真实后端就绪前，可先启动本地 Mock：

```powershell
node mock-server\server.js
```

Mock 地址为 `http://localhost:8000`，与当前小程序
`miniprogram/config/api.js` 的开发配置一致。

## 开发约定

- 文档、注释、提交说明优先使用汉语。
- 当前工作范围限定为微信小程序前端体验、原型迁移与前后端接口对接准备。
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
