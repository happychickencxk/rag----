# AI Agent 阅读入口

本目录是后续 AI agent 的项目上下文目录。开始任何实现前，先读这里，再读业务代码。主目录只保留面向人类和仓库维护的说明，长期协作细节集中在 `.ai-agent`。

## 推荐阅读顺序

1. `06-handoff-current-task.md`：先了解当前进度、已完成提交、下一步任务和待确认事项。
2. `01-project-overview.md`：确认项目目标、边界和成功标准。
3. `02-frontend-structure.md`：了解当前前端代码结构、入口和已有组件。
4. `03-api-contract.md`：查看微信小程序端需要优先对接的后端接口。
5. `04-development-workflow.md`：遵守中文文档、git、测试和更新流程。
6. `05-roadmap.md`：按优先级推进后续前端工作。
7. `07-icon-assets.md`：查看小程序图标命名、用途、颜色和引用规范。

## 当前事实

- 仓库只负责微信小程序前端设计与对接准备。
- `frontend/figma_make` 是 React/Vite 视觉原型，`frontend/wechat_miniprogram` 是后续实际开发的小程序工程。
- 接口规范来自 `docs/06-企业知识库RAG问答系统-前后端对接API接口文档.docx`。
- 当前接力状态以 `06-handoff-current-task.md` 为准。
- 后续每完成一个功能点，都要同步更新本目录中相关文档。

## 更新规则

- 代码结构变化时更新 `02-frontend-structure.md`。
- 接口字段、请求路径、错误处理策略变化时更新 `03-api-contract.md`。
- 开发流程或提交策略变化时更新 `04-development-workflow.md`。
- 里程碑、优先级或任务拆分变化时更新 `05-roadmap.md`。
- 当前任务状态、已知风险或接力说明变化时更新 `06-handoff-current-task.md`。
- 图标命名、用途或颜色规则变化时更新 `07-icon-assets.md`。
- 文档更新应和对应功能代码放在同一个 commit 中；纯文档基线可以单独 commit。
