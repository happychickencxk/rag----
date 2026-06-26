# 当前任务接力说明

> 给下一位 AI agent 使用。开始继续开发前，先读本文件，再读本目录其它文档。

## 当前进度

截至当前接力点，仓库已经完成初阶段文档和 git 基线维护：

- 已新增根目录 `README.md`，说明项目定位、运行方式、开发约定和 git 规则。
- 已建立 `.ai-agent` 文档体系，包含项目概览、前端结构、API 契约、开发流程和路线图。
- 已新增 `.gitignore`，忽略依赖目录、构建产物、环境变量、本地缓存、编辑器文件和微信开发者工具本地配置。
- 已更新 `frontend/README.md`，替换 Figma Make 默认说明。
- 已推送到 GitHub private 仓库 `happychickencxk/rag----`。
- 本轮新增要求：根 README 标题使用“rag小程序代码”，并注明“该代码为 39 组成员制作”。

## 已完成提交

- `4cca812`：`完善项目说明与AI协作文档`
  - 新增根 README。
  - 新增 `.ai-agent` 前 5 份文档和入口 README。
  - 新增 `.gitignore`。
  - 更新 `frontend/README.md`。
- `8ce1bda`：`忽略本地小程序工具配置`
  - 在 `.gitignore` 中忽略 `frontend/project.config.json` 和 `frontend/project.private.config.json`。

## 当前仓库状态要点

- 当前工作分支：`main`。
- 当前远程：`origin` 指向 `https://github.com/happychickencxk/rag----.git`。
- 用户已明确：暂不修改 GitHub 仓库名。
- 当前任务只做文档维护，不修改 `frontend/src` 运行时代码。
- 执行本轮任务前发现 `frontend/wechat_miniprogram/` 是未跟踪目录，且里面有独立 `.git`。本轮不处理、不暂存、不删除；后续 agent 需要先向用户确认它是正式小程序工程、临时生成物还是应独立管理的子仓库。

## 下一阶段建议实现内容

优先顺序如下：

1. 前端结构拆分
   - 将 `frontend/src/app/App.tsx` 中的类型、模拟数据、布局组件、页面组件拆分到独立文件。
   - 保持视觉和交互行为不变。
2. 请求层准备
   - 新增统一 API client。
   - 自动附带 `Authorization` 和 `X-Client-Type: wechat`。
   - 统一处理 401、403、404、429、500、503。
3. 微信登录
   - 对接 `POST /api/v1/auth/wechat-login`。
   - 保存 `access_token`、`refresh_token` 和过期时间。
   - 对接 `POST /api/v1/auth/refresh` 和 `GET /api/v1/auth/profile`。
4. 知识库接口
   - 对接 `GET /api/v1/knowledge-bases`。
   - 对接 `GET /api/v1/knowledge-bases/{kbId}`。
   - 渲染无权限、空知识库和搜索无结果状态。
5. 问答主链路
   - 对接 `POST /api/v1/qa/query`。
   - 先支持非流式，再支持 `stream=true` 的 SSE 流式输出。
   - 处理 `NoEvidence`、`LowConfidence`、`NoPermission`、`ModelTimeout`、`SensitiveBlocked`。
6. 引用、历史和反馈闭环
   - 引用详情：`GET /api/v1/qa/sessions/{sessionId}/messages/{messageId}/citations`。
   - 历史会话：`GET /api/v1/qa/sessions`、`GET /api/v1/qa/sessions/{sessionId}/messages`、`DELETE /api/v1/qa/sessions/{sessionId}`。
   - 反馈：`POST /api/v1/qa/sessions/{sessionId}/messages/{messageId}/feedback`。

## 小程序端优先接口摘要

认证：

- `POST /api/v1/auth/wechat-login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/profile`
- `POST /api/v1/auth/logout`

知识库：

- `GET /api/v1/knowledge-bases`
- `GET /api/v1/knowledge-bases/{kbId}`

问答：

- `POST /api/v1/qa/query`
- 非流式：一次性返回回答和引用。
- 流式：`stream=true`，使用 SSE 追加 `content`，结束时返回 `citations` 和 `message_id`。

会话：

- `GET /api/v1/qa/sessions`
- `POST /api/v1/qa/sessions`
- `GET /api/v1/qa/sessions/{sessionId}/messages`
- `DELETE /api/v1/qa/sessions/{sessionId}`

引用：

- `GET /api/v1/qa/sessions/{sessionId}/messages/{messageId}/citations`

反馈：

- `POST /api/v1/qa/sessions/{sessionId}/messages/{messageId}/feedback`

## 接力规则

- 文档、注释、commit 信息全部使用汉语。
- 每完成一个明确功能点，就同步更新 `.ai-agent` 中相关文档并单独 commit。
- 不要把密钥、token、`.env` 或本地工具配置提交到仓库。
- 不要把小程序端做成 Web 管理后台。
- 改前端运行时代码后至少执行 `frontend` 下的构建检查。
- 遇到未跟踪文件时先判断是否属于本任务；不属于本任务就不要暂存。
