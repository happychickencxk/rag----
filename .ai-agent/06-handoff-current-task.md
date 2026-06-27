# 当前任务接力说明

> 给下一位 AI agent 使用。开始继续开发前，先读本文件，再读本目录其它文档。

## 2026-06-27 图标资源引用

- 问答页答案反馈栏的“复制”按钮已改用本地图片 `/images/icons/copy.png`。
- WXML 中以 `/` 表示 `miniprogram` 根目录，资源路径统一使用正斜杠。
- 原始图片为半透明白色，当前通过 `.feedback-image-icon` 的亮度与透明度样式适配白色背景。

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
- 用户已确认：`frontend/wechat_miniprogram/` 是后续实际开发的小程序项目，当前内部只是模板。
- 用户已将 Figma Make 生成代码放入 `frontend/figma_make/`。
- 当前迁移方向：从 `frontend/figma_make` 提取页面、数据和视觉规则，迁移到 `frontend/wechat_miniprogram` 的原生小程序页面。
- `frontend/wechat_miniprogram/` 原本内部有独立 `.git`，且仅包含模板初始提交、无远程。为让外层仓库统一管理正式小程序源码，本轮已移除该内嵌 `.git`。
- 最新进展：`pages/chat/index` 已按 Figma Make 问答页的对话态截图重做视觉，包括知识库连接条、用户问题气泡、AI 回答卡片、来源折叠、反馈栏和底部图标化输入栏。
- 最新修正：`pages/chat/index` 底部输入栏已改为稳定三段式布局，语音键和发送键固定为 `72rpx`，输入框通过外层容器占据剩余宽度，避免微信 `button/textarea` 默认样式导致宽度异常。
- 最新修正：`pages/chat/index` 顶部“切换”已改为当前页底部弹层选择知识库，不再跳转到知识库 tab；`pages/knowledge/index` 与 `pages/history/index` 已按 Figma Make 截图改为全宽列表，并重点修正右侧箭头、时间、勾选、权限标签挤占内容宽度的问题。
- 最新修正：小程序仿真中全宽列表被 `button` 默认样式压缩，已将问答顶部知识库条、底部弹层知识库行、知识库列表行、历史会话行改为 `view` 点击容器；知识库 logo 暂改为空占位方块，避免 CSS 绘制图标在仿真中显示成“□□”。
- 视觉限制：当前保留微信小程序原生导航栏，因此顶部状态栏、右上角微信胶囊按钮、导航栏右侧自定义图标无法完全复刻 Figma 手机壳里的静态效果；若后续必须像 Figma 一样控制顶部区域，需要改为自定义导航栏，但微信胶囊按钮仍不能移除。

## 下一阶段建议实现内容

优先顺序如下：

1. 小程序迁移基线
   - 已在 `frontend/wechat_miniprogram/miniprogram/pages` 下新增问答、知识库、历史、引用、反馈、我的页和状态预览页面。
   - 已在 `frontend/wechat_miniprogram/miniprogram/utils/mock.js` 中集中放置迁移阶段模拟数据。
   - 已将 `app.json` 启动页和 tabBar 指向新的 RAG 小程序页面。
   - 已将微信开发者工具项目名改为 `rag小程序代码`，并忽略本地私有配置 `project.private.config.json`。
   - 已将问答页默认展示调整为 Figma 对话态，默认显示一轮“试用期请假是否影响转正？”问答，来源默认收起，回答支持局部加粗展示。
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
- 改 Figma Make React 代码后，在 `frontend/figma_make` 下执行构建检查。
- 改微信小程序代码后，用微信开发者工具打开 `frontend/wechat_miniprogram` 做编译预览；CLI 环境下至少检查 JSON 和 JS 语法。
- 遇到未跟踪文件时先判断是否属于本任务；不属于本任务就不要暂存。
