# 当前任务接力说明

> 给下一位 AI agent 使用。开始继续开发前，先读本文件，再读本目录其它文档。

## 2026-06-27 Claude Code 最终实现提示词 - 阶段1完成

- 已创建请求基础设施：`config/api.js`、`utils/storage.js`、`utils/request.js`、`utils/upload.js`、`utils/sse.js`。
- 已创建服务层：`services/auth.js`、`services/knowledge.js`、`services/qa.js`、`services/document.js`。
- 已创建适配层：`adapters/index.js`，含 snake_case → camelCase 映射和反馈原因映射。
- 已更新 `app.js`：移除云开发初始化，集成 storage 持久化和 auth 失效监听。
- 已编写 51 项纯 Node 单元测试，全部通过。覆盖：URL 规范化、响应解析、401 刷新队列、SSE 解析、反馈映射、引用权限、文件校验和字段适配。
- JS 语法检查和 JSON 解析检查全部通过。
- 后续阶段：阶段2 微信登录和用户信息。

## 2026-06-27 原始需求与缺口审计

- 已只读提取并核对 `docs` 下 5 份 Word 文档，形成 `08-requirements-gap-analysis.md`。
- 当前小程序已完成主要页面和视觉迁移，但真实请求、微信登录、Token 刷新、知识库接口、问答接口、SSE、历史恢复、引用接口和反馈接口均未接入。
- 发现 P0 问题：受限引用仍可能展示完整 `excerpt`；历史会话点击后没有恢复消息；问答发送会覆盖而不是追加消息。
- 发现接口冲突：基础 URL 可能重复 `/api/v1`、反馈枚举不一致、知识库权限展示缺少字段、引用详情字段不足、文件类型和下载接口不匹配。
- 已新增 `09-claude-code-implementation-prompt.md`，用于低成本 Claude Code 分批实现首个功能批次。
- 本轮只建立需求和缺口基线，不修改运行时代码。

## 2026-06-27 引用宽度运行时修复

- Computer Use 已恢复并成功连接微信开发者工具。
- WXML 检查器实测 `.citation-list` 宽度为 `279px`，但原生 `button.citation-item` 仅为 `184px`，左右各出现约 `41.5px` 自动外边距。
- 已将展开引用行从 `button` 改为 `view bindtap`，与知识库、历史列表采用相同的全宽处理方式。
- 修复后 WXML 检查器实测 `.citation-excerpt` 宽度为 `263px`，相较修复前的 `180px` 已基本铺满列表可用宽度。

## 2026-06-27 自定义导航与文件中心

- 全局导航已改为 `navigationStyle: custom`，新增 `components/custom-nav`，所有业务页面标题统一略微上移，二级页使用自定义返回按钮。
- tabBar 已改为官方自定义模式，新增 `custom-tab-bar`；四个图标的普通态统一为灰色，选中态统一为企业蓝，不再受原始 PNG 黑灰差异影响。
- 四个主页面已在 `onShow` 中同步 tabBar 选中索引。
- 问答输入栏在语音键和文本框之间新增纯图标文件入口，使用 `/images/icons/upload-file.png`。
- 新增 `pages/files/index` 文件中心：支持 `wx.chooseMessageFile` 选择文件，展示待上传、处理中、可下载状态；下载按钮当前提示等待接口。
- 问答页展开引用中，编号改为绝对定位，路径和摘要使用完整内容宽度。
- 问答输入栏与知识库弹层已抬到自定义 tabBar 上方，知识库、历史和我的页增加底部安全留白。
- 用户在本轮开始前已修改 `images/icons/profile.png` 和问答页部分引用样式，本轮保留并纳入当前实现。
- 已执行页面文件、组件文件、JSON、JS 和 21 个图标路径静态检查。Computer Use 启动失败，错误为原生管道不存在，尚未完成开发者工具截图复验。

## 2026-06-27 标注布局与交互过渡

- 引用详情页的展开控制已左对齐，并在右侧增加可随展开状态翻转的箭头。
- 提交反馈页的反馈类型已从 `button` 改为全宽 `view` 点击行，内容靠左并保留少量内边距。
- 提交反馈按钮改为由补充说明中的非空文本控制蓝色状态，灰蓝切换使用 `200ms ease`。
- 问答发送按钮、答案有用/没用反馈、反馈类型单选和展开箭头也统一使用约 200ms 状态过渡。
- 我的页设置项已从 `button` 改为全宽 `view`，卡片高度不变，左右仅保留少量余量。
- 问答页“切换”下拉箭头已改为 CSS 图形以修正基线，知识库弹层关闭按钮进一步靠右，展开后的引用列表减少左侧留白。
- “提交反馈”原生导航栏标题无法通过页面 WXSS 单独上移；若必须调整，需要将该页改为自定义导航栏。
- 本轮 JSON、JS、WXSS 和 `git diff --check` 静态检查通过。Windows 控制助手原生管道不可用，因此本轮未完成自动仿真截图复验，后续需在微信开发者工具中人工确认上述位置。

## 2026-06-27 图标体系整理

- 用户新增的中文图标已统一改为小写英文连字符命名，并归档到 `miniprogram/images/icons/`。
- 已新增 `07-icon-assets.md`，记录完整命名映射、页面用途、语义色和资源引用规则。
- 问答、知识库、历史、我的、引用详情、异常状态和原生 tabBar 已使用新图标。
- 普通图标使用中性灰或企业蓝，低置信度使用黄色，无权限、超时、拦截和点踩选中态使用红色。
- 已在微信开发者工具中检查问答、知识库、历史、我的和异常状态页；图标正常显示，列表宽度未回退。
- 原生 tabBar 不支持页面 WXSS 滤镜，当前普通态与选中态复用同一图片，由选中文字颜色区分；如后续提供成套灰色和蓝色资源，再拆分两套路径。

## 2026-06-27 图标资源引用

- 问答页答案反馈栏的“复制”按钮使用本地图片 `/images/icons/copy.png`。
- WXML 中以 `/` 表示 `miniprogram` 根目录，资源路径统一使用正斜杠。
- 原始图片为半透明白色，当前通过 `.feedback-action-icon` 的亮度与透明度样式适配白色背景。

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
