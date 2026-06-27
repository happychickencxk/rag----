# Claude Code 最终实现与验证提示词

## 使用方式

在仓库根目录启动 Claude Code，然后发送：

```text
请完整读取并严格执行 .ai-agent/10-claude-code-final-implementation-prompt.md 中“正式提示词”代码块内的任务。按阶段实现、验证、更新文档并提交，不要只给计划。
```

## 正式提示词

```text
你是本项目最后阶段的微信小程序前端实现代理。你需要直接修改代码、执行验证、维护中文文档和 Git 提交，不能只分析或输出计划。

仓库路径：
C:\Users\gaoan\Desktop\rag正式开发

正式小程序工程：
frontend/wechat_miniprogram

视觉参考：
frontend/figma_make

接口权威来源：
docs/06-企业知识库RAG问答系统-前后端对接API接口文档.docx

一、先理解项目

开始修改前必须依次完整读取：

1. .ai-agent/06-handoff-current-task.md
2. .ai-agent/08-requirements-gap-analysis.md
3. .ai-agent/03-api-contract.md
4. .ai-agent/02-frontend-structure.md
5. .ai-agent/04-development-workflow.md
6. .ai-agent/05-roadmap.md
7. frontend/wechat_miniprogram/README.md
8. frontend/wechat_miniprogram/miniprogram/app.json
9. frontend/wechat_miniprogram/miniprogram/app.js
10. frontend/wechat_miniprogram/miniprogram/utils/mock.js
11. miniprogram 下所有已注册页面、组件和自定义 tabBar

然后执行：

- git status -sb
- git log -5 --oneline
- 确认当前分支、现有改动和最新接力状态。
- 不得回退、覆盖或格式化与任务无关的用户改动。

对项目的正确理解：

- 本仓库只实现微信小程序前端，不实现 FastAPI 后端、Web 管理后台、文档解析、向量库、模型服务或管理端页面。
- `docs` 中的 Word 文档只读，不修改、不重命名。
- frontend/figma_make 只作为视觉和交互参考，不在本轮修改。
- frontend/wechat_miniprogram 是正式代码。
- 当前页面视觉迁移基本完成，但多数业务数据仍来自 utils/mock.js。
- 最终目标是让小程序代码严格按 API 文档发起请求，并在后端不可用时明确报告阻塞，不能用假成功掩盖联调失败。
- 文档、必要注释和 commit 信息全部使用汉语。

二、实施边界

必须完成：

1. 统一 API 配置、请求封装、Token 管理和错误映射。
2. 微信登录、Token 刷新、当前用户和退出登录。
3. 知识库列表、搜索、切换和详情数据适配。
4. 会话创建、非流式问答、多轮消息追加和重新生成。
5. SSE 流式问答。
6. 历史会话列表、恢复消息和单会话删除。
7. 引用列表、引用详情和严格权限保护。
8. 点赞、点踩、无引用和详细纠错反馈。
9. 文件选择、格式校验、知识库选择、上传和状态展示。
10. 加载、空数据、错误、重试、无依据、低置信、无权限、超时和敏感拦截状态。
11. 自动化静态检查、纯逻辑测试、微信开发者工具验证和 API 合规清单。
12. 同步更新 .ai-agent 文档并按功能拆分中文 commit。

本轮不实现：

- 用户、部门、角色、权限策略等后台管理页面。
- 文档解析、切分、索引重建、质量工单和统计看板。
- 模型配置、敏感词管理和审计日志后台。
- 真实语音识别；需求只要求保留入口。
- 消息通知和个人统计，除非后端已有文档化接口。
- 未在接口文档中定义的文件下载；禁止把 storage_path 当作下载地址。
- 会话导出和分享，属于可弱化能力。
- 擅自删除 QuickStart 遗留文件；清理应放到独立提交且确认不影响工程。

三、接口约定

基础规则：

- 推荐配置 API_ORIGIN，例如 http://localhost:8000。
- 具体请求路径使用 /api/v1/...。
- 只能保留一次 /api/v1，严禁生成 /api/v1/api/v1。
- 所有普通请求自动带：
  Authorization: Bearer {access_token}
  Content-Type: application/json
  X-Client-Type: wechat
  X-Request-Id: 前端生成的请求标识
- 登录和刷新 Token 不要求已有 Authorization。
- 文件上传使用 multipart/form-data，由 wx.uploadFile 设置边界，不要手写错误的 Content-Type。
- 统一响应为：
  { "code": 200, "message": "操作成功", "data": ... }
- HTTP 成功但 code 非 200 仍按业务失败处理。
- 分页结构为 records、total、page、size、pages。

必须实现的接口：

认证：

- POST /api/v1/auth/wechat-login
  请求：code、nick_name、avatar_url
  响应：user_id、name、role、is_new_user、access_token、refresh_token、expires_in
- POST /api/v1/auth/refresh
  请求：refresh_token
- GET /api/v1/auth/profile
- POST /api/v1/auth/logout

知识库：

- GET /api/v1/knowledge-bases
  参数：page、size、keyword、department_id、status
- GET /api/v1/knowledge-bases/{kbId}

问答和会话：

- POST /api/v1/qa/query
  请求：session_id 可选、kb_id 必填、question 必填、stream
- GET /api/v1/qa/sessions
  参数：page、size、kb_id
- POST /api/v1/qa/sessions
  请求：kb_id
- GET /api/v1/qa/sessions/{sessionId}/messages
  参数：page、size
- DELETE /api/v1/qa/sessions/{sessionId}
- GET /api/v1/qa/sessions/{sessionId}/messages/{messageId}/citations
- POST /api/v1/qa/sessions/{sessionId}/messages/{messageId}/feedback
  请求：feedback_type、description

文档：

- GET /api/v1/documents
  小程序文件页必须带 kb_id。
- POST /api/v1/documents/upload
  使用 wx.uploadFile，字段为 file、kb_id、source、version、tags、permission_scope。
- 支持类型严格限制为 pdf、docx、md、txt、html、csv，单文件最大 20MB。
- 当前契约没有安全下载接口。没有明确 download_url 时，下载按钮必须禁用并说明原因，不能伪造下载成功。

状态码：

- 400：输入或参数问题。
- 401：尝试刷新 Token；刷新失败后清理登录态并进入登录流程。
- 403：无权限，清理当前受限正文，展示权限状态。
- 404：资源失效或已删除。
- 409：资源冲突。
- 413：文件超过限制。
- 429：请求频繁，允许稍后重试。
- 500：服务异常。
- 503：知识库重建或服务暂不可用。
- 网络超时、断网和请求取消要与服务端错误区分。

四、必须解决的契约差异

1. SSE 与 WebSocket：
   - 以 API-Q02 的 POST SSE 为准。
   - 不自行改成 WebSocket。

2. 反馈类型：
   - API-Q07 只保证 like、dislike、no_citation。
   - 不发送未确认的 correction。
   - “没有引用”映射为 no_citation。
   - 答案错误、引用错误、答案不完整、敏感内容和其他问题使用 dislike，并把细分原因作为 description 前缀提交。
   - 把该映射集中在适配层并写入 .ai-agent/03-api-contract.md。

3. 知识库权限：
   - API 文档说明普通用户只返回有权访问的知识库。
   - API 模式下不要继续伪造“无访问权限”的知识库记录。
   - 若服务端返回 403，展示权限状态；不要凭前端 permission 字段做安全判断。

4. 引用详情字段：
   - 接口未返回知识库名称、更新时间、授权状态和命中高亮时，页面应条件渲染或隐藏。
   - 禁止用 mock 数据补齐真实接口缺失字段。
   - 403 后必须清除正文和缓存的完整 excerpt，只保留后端允许展示的元信息。

5. 文件能力：
   - 移除 Excel、PPT 和 xlsx 的支持文案与模拟记录。
   - 未提供下载 URL 时不得调用 storage_path。

6. 个人中心：
   - profile 接口可驱动姓名、头像、部门和角色。
   - 历史问答数、反馈记录数、常用知识库没有明确接口时显示“--”或隐藏，不得继续展示固定假数字。
   - “清空全部历史”没有批量接口，不得循环静默删除全部会话；可隐藏、禁用或明确提示暂不支持。

五、建议代码结构

保持原生微信小程序 CommonJS 风格，避免引入大型框架。根据现有结构选择最少但清晰的模块：

- config/api.js：API 地址、数据源模式和超时配置。
- utils/storage.js：Token、用户、当前知识库和会话状态持久化。
- utils/request.js：普通请求、统一响应、错误对象、刷新队列。
- utils/upload.js：wx.uploadFile、Token 和统一响应处理。
- utils/sse.js：纯函数 SSE 解码与事件解析。
- services/auth.js
- services/knowledge.js
- services/qa.js
- services/document.js
- adapters/：后端 snake_case 到现有页面视图模型的集中映射。
- components/state-view：只有在多个页面确实复用时再抽取。

不要为了目录完整而创建空文件。页面不得直接散落 API URL、Token 拼接和字段转换。

数据源规则：

- 提供显式 mock 和 api 模式，不允许请求失败后自动用 mock 冒充真实成功。
- mock 模式用于无后端时验证页面和契约测试。
- api 模式请求失败必须展示真实错误。
- 默认模式和切换方式写入 README，不包含密钥。
- 若仓库中没有真实后端地址，先检查配置和文档；仍无法确定时使用明显的开发占位配置，并把“真实联调未完成”列为阻塞，不能猜测生产域名。

六、分阶段实现

阶段 1：请求与 Token 基础

- 实现 URL 规范化、请求头、统一响应、错误分类、超时和请求取消。
- Token 使用 wx storage 持久化，保存 expires_at。
- 401 刷新必须使用共享 Promise 或队列，多个并发 401 只能调用一次 refresh。
- 原请求刷新成功后只重放一次，避免无限循环。
- 刷新失败统一清理登录态。

完成后：

- 更新 .ai-agent 文档。
- 执行测试。
- commit：实现请求封装与令牌管理

阶段 2：微信登录和用户

- 增加登录/授权页或等价的启动鉴权流程。
- 使用 wx.login() 获取 code。
- 登录失败、网络失败和取消授权时可重试。
- profile 驱动我的页真实字段。
- logout 成功或服务端已失效时都清理本地状态。

完成后：

- 更新文档。
- 验证冷启动、已有 Token、过期 Token 和退出登录。
- commit：接入微信登录与用户信息

阶段 3：知识库和会话状态

- 知识库列表支持加载、分页、搜索、空数据、错误和重试。
- 当前知识库持久化；失效时选择第一个可用知识库。
- 切换知识库时，若已有会话内容，明确提示将开始新会话。
- 创建会话并保存 session_id、kb_id。
- 后端字段通过适配层转为现有视图字段。

完成后：

- commit：接入知识库与会话状态

阶段 4：非流式问答和历史

- 先完成 stream=false 的稳定路径。
- 用户消息、加载中的 assistant 占位和最终回答按顺序追加，不能覆盖消息数组。
- 发送中禁止重复提交；失败时保留问题、错误状态和重试入口。
- 保存 message_id、session_id、citations、feedback_status。
- 多轮问答沿用同一 session_id。
- “重新生成”使用当前问题重新请求，不再只显示占位 Toast。
- 历史页请求会话列表并按今天、昨天、近 7 天、更早分组。
- 点击会话后获取消息并恢复到问答页。
- 单会话删除前确认，成功后刷新当前列表。
- 搜索仅针对已加载数据时，要在文档中说明分页边界。

完成后：

- 验证连续两轮问答仍保留四条以上消息。
- 验证历史会话能恢复而不是只写 lastQuestion。
- commit：完成非流式问答与历史会话

阶段 5：SSE 流式问答

- 使用当前微信基础库支持的分块请求能力实现 POST SSE。
- 解析器必须处理：
  - 一个 chunk 内多个 data 事件。
  - 一个事件被拆到多个 chunk。
  - CRLF 和 LF。
  - 中文 UTF-8 字节被分割。
  - 空行分隔事件。
  - done=false 文本追加。
  - done=true 返回 message_id 和 citations。
  - 非 JSON 行、心跳行和结束前残留缓冲。
- 页面卸载、切换知识库、重试或用户取消时终止旧请求。
- 流式失败不得留下永久 loading；允许用户重试或显式改用非流式。
- 不把同一个 content 重复追加。

完成后：

- 为纯 SSE 解析器增加 Node 测试。
- commit：实现问答流式输出

阶段 6：引用、反馈和安全

- 每条 assistant 消息分别维护展开状态和反馈状态，不能继续使用页面级 citationExpanded、feedbackValue 控制所有消息。
- 引用详情路由携带真实 sessionId、messageId 和必要引用标识。
- 引用接口失败或 403 后不显示缓存全文。
- 页面只渲染实际返回字段，缺失字段不使用 mock 补齐。
- 复制答案和复制引用使用当前消息或当前引用内容。
- like、dislike、no_citation 调用真实反馈接口。
- 详细反馈页携带真实问题、回答摘要、sessionId、messageId，并按前述映射提交。
- 防止同一操作短时间重复提交，成功后更新对应消息状态。

完成后：

- 专门验证受限引用不泄露原文。
- commit：接入引用与反馈闭环

阶段 7：文件页和页面状态

- 文件页绑定当前知识库。
- 选择文件后校验扩展名和 20MB 限制。
- 上传时展示待上传、上传中、等待解析、成功和失败。
- 通过文档列表或详情刷新后端状态。
- 401、403、413 和上传失败有明确提示。
- 没有 download_url 时禁用下载，不伪造成功。
- 将 states 中有业务价值的状态接入问答、知识库和历史页面，不把“异常状态预览”当作正式处理。
- 语音入口保留，但明确为未开放，不申请无关权限。
- 消息通知、关于系统和无接口统计不得保留成无反应按钮；可禁用、隐藏或提供明确说明。

完成后：

- commit：完善文件上传与页面状态

阶段 8：清理与最终验证

- 删除页面对 utils/mock.js 的生产路径直接依赖；mock 只能经显式数据源进入。
- 检查未使用代码，但不要在本提交中大规模重写视觉样式。
- 更新：
  - .ai-agent/02-frontend-structure.md
  - .ai-agent/03-api-contract.md
  - .ai-agent/05-roadmap.md
  - .ai-agent/06-handoff-current-task.md
  - .ai-agent/08-requirements-gap-analysis.md
  - frontend/wechat_miniprogram/README.md
- 新增 .ai-agent/11-api-compliance-checklist.md，逐项记录接口、调用模块、页面、请求字段、响应字段、错误处理、测试结果和真实联调状态。

完成后：

- commit：完成小程序接口验收与文档收尾

七、测试要求

不得只依赖 node --check。为纯逻辑建立不依赖第三方包的 Node 测试，优先使用 node:test。

至少覆盖：

1. API 地址只包含一次 /api/v1。
2. 统一响应 code 非 200 时抛出业务错误。
3. 并发 401 只刷新一次，并正确重放等待请求。
4. 刷新失败清理 Token。
5. 知识库、会话、消息、引用字段适配。
6. SSE 的拆包、粘包、中文边界和 done 事件。
7. 反馈原因到 like/dislike/no_citation 的映射。
8. 403 引用清除完整正文。
9. 文件扩展名和 20MB 限制。

静态检查：

- miniprogram 下所有 JSON 可解析。
- miniprogram 下所有 JS 执行 node --check。
- WXML 标签、事件处理函数和资源路径可对应。
- 所有页面使用的图片资源实际存在。
- git diff --check。
- git status -sb。

微信开发者工具验证：

- 编译没有新增错误。
- 控制台没有未处理异常。
- 检查问答、知识库、历史、引用、反馈、文件和我的页。
- 检查常见手机宽度，不允许列表再次被 button 默认样式压缩。
- 检查底部输入栏、自定义 tabBar 和弹层不重叠。
- 验证登录、两轮问答、知识库切换、历史恢复、引用权限、反馈和上传状态。
- 如果无法自动控制开发者工具，明确列出未验证项，不得写“全部通过”。

真实 API 验证：

- 若后端可用，使用 api 模式逐项验证请求路径、方法、请求头、参数、统一响应和错误状态。
- 不在日志或截图中输出完整 Token。
- 若后端不可用或文档中的接口仍未实现：
  - 使用 mock transport 完成契约测试。
  - 在 11-api-compliance-checklist.md 将真实联调标为“阻塞”。
  - 记录缺少的基础 URL、接口或字段。
  - 不得把 mock 验证写成真实联调成功。

八、完成标准

只有以下条件满足后才能结束：

- 所有 P0、P1 小程序功能已实现，或有明确的后端契约阻塞记录。
- 正式页面不再直接读取固定业务 mock 数据。
- 问答支持真实多轮消息和 SSE。
- 历史会话可以恢复和删除。
- 引用不存在越权全文泄露。
- 反馈提交符合 API-Q07 枚举。
- 文件上传符合格式、大小和接口约定；下载阻塞被如实记录。
- 自动化测试、静态检查和开发者工具检查均已执行或明确说明无法执行的原因。
- 11-api-compliance-checklist.md 已完成。
- 每个阶段有中文 commit。
- 最后推送 origin/main，并用 git ls-remote 验证远程 main。

九、最终回复格式

按以下顺序输出：

1. 完成的功能。
2. 接口合规结果。
3. 自动化测试和开发者工具验证结果。
4. 后端阻塞或仍需确认的字段。
5. commit 哈希列表。
6. 远程推送验证结果。

不要只说“已完成”，必须给出具体证据。
```
