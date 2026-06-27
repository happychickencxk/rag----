# Claude Code 首批实现提示词

> 该提示词用于低成本 Claude Code 执行首个功能批次。不要一次性实现全部路线图；完成本批次并验证后，再生成下一批提示词。

```text
你正在维护仓库：
C:\Users\gaoan\Desktop\rag正式开发

目标：
完成微信小程序前端首批“请求认证基础 + 非流式问答”能力，同时保留当前 Figma 迁移后的视觉效果。项目只负责微信小程序前端，不实现后端或 Web 管理后台。

开始前必须依次读取：
1. .ai-agent/06-handoff-current-task.md
2. .ai-agent/08-requirements-gap-analysis.md
3. .ai-agent/03-api-contract.md
4. .ai-agent/02-frontend-structure.md
5. .ai-agent/04-development-workflow.md
6. frontend/wechat_miniprogram/miniprogram 当前源码

通用约束：
- 文档、代码注释和 commit 信息全部使用汉语。
- 不修改 frontend/figma_make。
- 不重写现有页面视觉，不恢复微信云开发 QuickStart 逻辑。
- 不硬编码密钥、Token、生产域名或个人信息。
- 不擅自发明接口字段；发现接口冲突时更新 .ai-agent/03-api-contract.md 并采用明确的适配策略。
- 工作区可能有其他人修改，禁止回退不属于你的改动。
- 每完成一个独立功能点就更新 .ai-agent 文档并单独 commit。
- 后端若不可用，不得声称“联调完成”；应提供可切换的 mock/real 数据源并验证 mock 路径。

本批次范围：

一、统一配置和请求客户端
- 在 miniprogram 下建立清晰的 config、services 或 utils 分层，遵循当前项目的简洁结构。
- API 地址只保留一个 /api/v1 前缀，避免 /api/v1/api/v1。
- 封装 wx.request，自动附加 Authorization、X-Client-Type: wechat 和 X-Request-Id。
- 统一解析 { code, message, data }。
- 映射 400、401、403、404、413、429、500、503、网络错误和超时。
- access token、refresh token 和 expires_at 使用 wx storage 持久化。
- 401 时实现单次刷新和等待队列；刷新失败后清理登录态。
- 提供可切换的 mock/real 数据源，默认行为不得让当前页面白屏。

二、微信登录和用户信息
- 新增必要的登录或授权页面并注册路由。
- 使用 wx.login() 获取 code，调用 POST /api/v1/auth/wechat-login。
- 实现 POST /api/v1/auth/refresh、GET /api/v1/auth/profile、POST /api/v1/auth/logout。
- 我的页改用服务层加载用户信息；失败时有加载、重试或降级状态。
- 退出登录必须清理本地 Token 和用户缓存。

三、知识库列表
- 对接 GET /api/v1/knowledge-bases。
- 页面通过适配层使用 id、name、description、department、docCount、updatedAt 等现有视图字段。
- 支持加载、空数据、搜索无结果、请求失败和重试。
- 不根据前端本地字段决定真实权限；403 由统一错误和页面状态处理。

四、非流式问答
- 本批次只实现 stream=false，不实现 SSE。
- 创建或复用会话，调用 POST /api/v1/qa/query。
- 用户问题和 AI 回答必须追加到消息数组，禁止覆盖此前消息。
- 保存 session_id、message_id 和 citations。
- 发送期间禁止重复提交；失败时保留问题并允许重试。
- “重新生成”复用当前问题并走同一服务，不再显示占位提示。
- 点赞、点踩和详细纠错本批次可以保留 UI，但不得伪装成已提交到后端。

五、引用安全
- 修复当前受限引用仍可能展示完整 excerpt 的问题。
- 403 或权限受限时只展示允许的摘要和提示，不渲染完整原文。
- 引用页面接收真实 session_id、message_id、chunk_id；如果接口字段不足，先通过适配层兼容并在契约文档记录缺口。

本批次明确不做：
- SSE 或 WebSocket 流式输出。
- 文件上传、文件下载。
- 语音识别。
- 消息通知、关于系统、个人统计。
- Web 后台、文档解析、索引、用户角色管理和统计看板。
- 删除 QuickStart 遗留文件，除非它直接阻塞本批次。

测试和验收：
- 检查所有 miniprogram 下 JSON 可解析。
- 对所有 JS 执行 node --check。
- 执行 git diff --check。
- 用微信开发者工具检查登录、问答、知识库、历史、引用和我的页；若无法自动检查，明确说明。
- 验证 mock 模式下可完整进入页面，后端不可用时不白屏。
- 验证受限引用不显示完整原文。
- 验证连续发送两次问题后保留两轮消息。
- 验证并发 401 只触发一次刷新请求。

提交要求：
1. 请求层和 Token 管理单独 commit。
2. 登录和用户信息单独 commit。
3. 知识库真实数据适配单独 commit。
4. 非流式问答和引用安全单独 commit。
5. 每个 commit 同步更新 .ai-agent/06-handoff-current-task.md 和相关文档。

完成后输出：
- 修改文件列表。
- 每个 commit 哈希和说明。
- 实际执行的检查及结果。
- 尚未完成或因后端不可用无法验证的内容。
- 下一批建议，但不要继续实现下一批。
```

