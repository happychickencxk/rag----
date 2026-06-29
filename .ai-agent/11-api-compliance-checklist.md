# 小程序 API 合规与验收清单

> 更新日期：2026-06-29。接口依据为
> `docs/06-企业知识库RAG问答系统-前后端对接API接口文档.docx`。

## 验收结论

- 本地 Mock 接口契约测试通过，覆盖认证、知识库、问答、SSE、会话、引用、反馈和文档接口。
- 微信开发者工具端到端验收通过：登录、知识库加载、流式问答、历史恢复、引用详情、反馈提交和文件中心入口均可运行。
- 真实后端仍未提供可联调地址，因此本文中的“通过”仅表示前端和本地 Mock 符合当前文档契约，不代表生产后端已经验收。

## 核心接口

| 接口 | 前端模块 | Mock 契约 | 开发者工具 | 真实后端 |
| --- | --- | --- | --- | --- |
| `POST /api/v1/auth/wechat-login` | `services/auth.js` | 通过 | 通过 | 待联调 |
| `POST /api/v1/auth/refresh` | `utils/request.js` | 通过 | 自动测试通过 | 待联调 |
| `GET /api/v1/auth/profile` | `services/auth.js` | 通过 | 通过 | 待联调 |
| `POST /api/v1/auth/logout` | `services/auth.js` | 通过 | 通过 | 待联调 |
| `GET /api/v1/knowledge-bases` | `services/knowledge.js` | 通过 | 通过 | 待联调 |
| `GET /api/v1/knowledge-bases/{kbId}` | `services/knowledge.js` | 通过 | 页面暂未使用 | 待联调 |
| `POST /api/v1/qa/query` 非流式 | `services/qa.js` | 通过 | 作为 SSE 回退 | 待联调 |
| `POST /api/v1/qa/query` SSE | `services/qa.js` | 通过 | 通过 | 待联调 |
| `GET/POST /api/v1/qa/sessions` | `services/qa.js` | 通过 | 通过 | 待联调 |
| `GET /api/v1/qa/sessions/{id}/messages` | `services/qa.js` | 通过 | 通过 | 待联调 |
| `DELETE /api/v1/qa/sessions/{id}` | `services/qa.js` | 通过 | 契约测试通过 | 待联调 |
| `GET .../messages/{id}/citations` | `services/qa.js` | 通过 | 通过 | 待联调 |
| `POST .../messages/{id}/feedback` | `services/qa.js` | 通过 | 通过 | 待联调 |
| `GET /api/v1/documents` | `services/document.js` | 通过 | 页面暂未列远端文档 | 待联调 |
| `POST /api/v1/documents/upload` | `services/document.js` | 通过 | 文件入口通过 | 待联调 |

## 已验证规范

- 请求统一携带 `X-Client-Type: wechat`、`X-Request-Id` 和 Bearer Token。
- 401 并发请求共享一次刷新操作；刷新后仍为 401 时最多重放一次并清理登录态。
- API 地址规范化后只出现一次 `/api/v1`。
- 知识库使用 `kb_id`、`department_name`、`chunk_count` 等正式字段。
- 会话和消息使用 `session_id`、`started_at`、`message_id`。
- 引用使用 `chunk_id`、`doc_name`、`chapter_path`、`content`、`similarity_score` 和 `rerank_score`。
- SSE 解码器能处理中文 UTF-8 字符从字节中间拆包，完成事件返回 `message_id` 和引用。
- 反馈类型只发送 `like`、`dislike`、`no_citation`，细分原因写入 `description`。
- 上传文件限制为 `pdf/docx/md/txt/html/csv` 且不超过 20MB。

## 测试结果

- 小程序单元测试：52 项，全部通过。
- Mock 契约测试：1 项端到端契约套件，全部通过。
- JavaScript 语法检查：35 个文件通过。
- JSON 解析检查：21 个文件通过。
- 微信开发者工具检查：登录、问答、历史、引用、反馈、我的和文件中心通过。

运行命令：

```powershell
node --test frontend\wechat_miniprogram\miniprogram\tests\unit\*.test.js
node --test mock-server\contract.test.js
```

## 剩余边界

1. 真实后端地址、证书、合法域名和生产 Token 尚未联调。
2. 接口未提供安全下载 URL，文件中心不能实现真实下载。
3. 个人页三项统计没有对应接口，当前显示 `--`。
4. 语音输入没有接口和产品规范，当前只保留入口。
5. 知识库详情接口已有服务封装，但当前页面没有独立详情视图。
