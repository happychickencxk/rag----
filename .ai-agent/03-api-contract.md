# 小程序端 API 契约摘要

接口来源：`docs/06-企业知识库RAG问答系统-前后端对接API接口文档.docx`，版本 v1.0，日期 2026-06-26。

本文只提炼微信小程序前端优先使用的接口。用户管理、部门管理、角色权限、文档上传、系统配置、审计日志、质量监控和统计仪表板属于后台或外部系统范围，不作为小程序端首批实现目标。

## 通用规范

### 基础地址拼接规则

原接口文档同时把 `/api/v1` 写入基础 URL 和具体接口路径。前端只能选择一种形式：

- 推荐：`API_ORIGIN=http://localhost:8000`，请求路径使用 `/api/v1/auth/...`。
- 或者：`API_BASE_URL=http://localhost:8000/api/v1`，请求路径使用 `/auth/...`。

禁止把两者直接拼接成 `/api/v1/api/v1/...`。

基础 URL：

- 开发环境：`http://localhost:8000/api/v1`
- 生产环境：`https://api.example.com/api/v1`
- WebSocket 流式问答基址：`ws://localhost:8000/ws/v1`

通用请求头：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `Authorization` | 是 | `Bearer {access_token}` |
| `Content-Type` | 是 | `application/json`，文件上传场景例外 |
| `X-Client-Type` | 否 | 小程序端固定传 `wechat` |
| `X-Request-Id` | 否 | 链路追踪 ID |

统一响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

分页响应格式：

```json
{
  "records": [],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

常见状态码：

| code | 小程序端处理 |
| --- | --- |
| `200` | 正常渲染 `data` |
| `400` | 提示参数或输入错误 |
| `401` | 尝试刷新 token，失败后回到登录 |
| `403` | 展示无权限状态 |
| `404` | 展示资源不存在或已失效 |
| `429` | 提示请求过于频繁 |
| `500` | 提示服务异常 |
| `503` | 提示知识库或模型服务暂不可用 |

## 认证接口

### 微信登录

`POST /api/v1/auth/wechat-login`

请求：

```json
{
  "code": "微信登录code",
  "nick_name": "微信昵称",
  "avatar_url": "https://..."
}
```

响应 `data`：

```json
{
  "user_id": "550e8400-...",
  "name": "微信用户",
  "role": "employee",
  "is_new_user": false,
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "expires_in": 7200
}
```

小程序端应保存 `access_token`、`refresh_token` 和过期时间。`access_token` 有效期为 2 小时，`refresh_token` 有效期为 7 天。

### 刷新 Token

`POST /api/v1/auth/refresh`

请求：

```json
{
  "refresh_token": "eyJhbGciOi..."
}
```

响应 `data` 包含新的 `access_token`、`refresh_token`、`expires_in`。

### 获取当前用户

`GET /api/v1/auth/profile`

用于我的页展示姓名、头像、部门、角色、账号状态和最近登录信息。

### 退出登录

`POST /api/v1/auth/logout`

成功后清理本地 token 和用户信息。

## 知识库接口

### 获取知识库列表

`GET /api/v1/knowledge-bases`

Query：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `page` | 否 | 默认 1 |
| `size` | 否 | 默认 10，最大 100 |
| `keyword` | 否 | 搜索关键词 |
| `department_id` | 否 | 部门筛选 |
| `status` | 否 | `active` 或 `archived` |

普通用户只返回有权限的知识库。小程序端用于知识库选择页和问答首页知识库切换。

### 获取知识库详情

`GET /api/v1/knowledge-bases/{kbId}`

用于展示知识库描述、所属部门、文档数、分块数、状态、可见范围和更新时间。

## 问答接口

### 提交问题，非流式回答

`POST /api/v1/qa/query`

典型请求字段：

```json
{
  "kb_id": "kb-001",
  "question": "试用期请假是否影响转正？",
  "session_id": "session-001",
  "stream": false
}
```

响应 `data` 应用于一次性渲染 AI 回答、引用来源、模型名、耗时和消息 ID。

### 提交问题，SSE 流式回答

`POST /api/v1/qa/query`，请求中设置 `stream: true`。

响应 `Content-Type` 为 `text/event-stream`，事件格式：

```text
data: {"content": "部分回答文本", "done": false}
data: {"content": "", "done": true, "citations": [], "message_id": "xxx"}
```

小程序端要求：

- 流式阶段显示“正在基于知识库生成回答”。
- `done=false` 时持续追加 `content`。
- `done=true` 后保存 `message_id` 并渲染最终引用来源。
- 超时映射为 `ModelTimeout`。
- 没有足够证据时渲染 `NoEvidence`，不要生成强结论式文案。

## 会话接口

### 获取会话列表

`GET /api/v1/qa/sessions`

用于历史会话页。列表应按时间分组展示今天、昨天、近 7 天和更早。

### 创建新会话

`POST /api/v1/qa/sessions`

用于开始新的问答上下文。首个问题可以作为会话标题来源。

### 获取会话消息

`GET /api/v1/qa/sessions/{sessionId}/messages`

用于恢复历史会话详情。消息角色使用 `user` 和 `assistant`。

### 删除会话

`DELETE /api/v1/qa/sessions/{sessionId}`

用于历史页删除操作，后端为软删除。

## 引用接口

`GET /api/v1/qa/sessions/{sessionId}/messages/{messageId}/citations`

用于回答下方引用卡片和引用详情页。小程序端需要字段：

- 文档名。
- 所属知识库。
- 章节路径。
- 原文片段和命中句。
- 相似度分数。
- Rerank 分数。
- 更新时间。
- 权限状态。

如果返回 403 或引用内容受限，渲染无权查看完整原文提示，只展示允许范围内的摘要。

## 反馈接口

`POST /api/v1/qa/sessions/{sessionId}/messages/{messageId}/feedback`

反馈类型枚举：

- `like`：点赞。
- `dislike`：点踩。
- `correction`：纠错。

小程序端 UI 可扩展为更细的纠错原因，例如答案不正确、引用错误、没有引用、答案不完整、展示了无权限内容、其他。提交前端细分原因时，应放入描述字段或后续与后端确认字段扩展。

## 前端错误状态映射

| 前端状态 | 触发来源 |
| --- | --- |
| `Loading` | 请求已发出，等待检索或回答 |
| `Streaming` | SSE 正在返回 `content` |
| `NoEvidence` | 后端判定无足够依据 |
| `LowConfidence` | 相似度或 rerank 分数低于阈值 |
| `NoPermission` | HTTP 403 或知识库权限不足 |
| `ModelTimeout` | 请求超时或后端返回模型超时 |
| `SensitiveBlocked` | 后端拦截敏感问题 |
| `EmptyHistory` | 会话列表为空 |
| `EmptyKnowledgeBase` | 无可访问知识库 |

## 对接前必须确认的差异

- 概要设计同时提到 WebSocket 和 SSE；API-Q02 明确规定 `POST /api/v1/qa/query` 返回 SSE，小程序首版以 API-Q02 为准。
- 消息反馈接口 API-Q07 只列出 `like`、`dislike`、`no_citation`，但反馈对象定义还出现 `correction`。现有反馈页六种细分原因没有明确字段，需后端确认。
- 知识库列表说明普通用户只返回有权限的记录，当前 UI 却展示“无访问权限”条目。若保留该设计，响应需要增加可见但不可访问记录及权限字段。
- 引用详情响应缺少知识库名称、更新时间、授权状态和命中高亮，无法直接驱动现有引用详情页。
- 文档上传仅支持 `pdf/docx/md/txt/html/csv`，不包含当前文件页展示的 Excel 和 PPT。
- 文档接口没有面向小程序的安全下载 URL，不能直接使用服务端 `storage_path`。
- API 文档中主要接口的完成情况均为“待开发”，真实联调前必须确认后端地址和可用接口清单。
