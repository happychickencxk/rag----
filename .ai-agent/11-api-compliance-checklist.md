# 小程序 API 合规清单

> 生成日期：2026-06-27。对照接口文档逐一检查。

## 认证接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/v1/auth/wechat-login` | `services/auth.js` | `pages/login/index` | code, nick_name, avatar_url | user_id, name, role, is_new_user, access_token, refresh_token, expires_in | 400/500/网络错误，可重试 | 单元通过 | 阻塞：后端未就绪 |
| `POST /api/v1/auth/refresh` | `utils/request.js` (refreshToken) | 全局自动 | refresh_token | access_token, refresh_token, expires_in | 失败后清理登录态 | 单元通过 | 阻塞 |
| `GET /api/v1/auth/profile` | `services/auth.js` | `pages/profile/index` | Authorization header | user_id, name, department, role, avatar_url | 失败时回退本地缓存 | 单元通过 | 阻塞 |
| `POST /api/v1/auth/logout` | `services/auth.js` | `pages/profile/index` | - | - | 服务端失败也清理本地状态 | 单元通过 | 阻塞 |

## 知识库接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/v1/knowledge-bases` | `services/knowledge.js` | `pages/knowledge/index`, `pages/chat/index` (弹层), `pages/files/index` | page, size, keyword, department_id, status | records (id, name, description, department, doc_count, status, updated_at), total, page, size, pages | 加载/空/错误/重试 | 单元通过 | 阻塞 |
| `GET /api/v1/knowledge-bases/{kbId}` | `services/knowledge.js` | （预留，当前未使用） | - | 知识库详情 | 404/403 | 单元框架就绪 | 阻塞 |

## 问答接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/v1/qa/query` (非流式) | `services/qa.js` (query) | `pages/chat/index` (回退) | kb_id, question, session_id, stream=false | content, citations, message_id, low_confidence | 400/401/403/500/超时 | 单元通过 | 阻塞 |
| `POST /api/v1/qa/query` (SSE) | `services/qa.js` (querySSE) | `pages/chat/index` (默认) | kb_id, question, session_id, stream=true | SSE data 事件：content, done, message_id, citations | 拆包/粘包/UTF-8/超时/中断/回退非流式 | 11项 SSE 测试通过 | 阻塞 |

## 会话接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/v1/qa/sessions` | `services/qa.js` (createSession) | `pages/chat/index` | kb_id | id/session_id | 创建失败阻止发送 | 单元通过 | 阻塞 |
| `GET /api/v1/qa/sessions` | `services/qa.js` (getSessions) | `pages/history/index` | page, size, kb_id | records (id, title, kb_name, message_count, created_at, preview), total | 加载/空/错误/重试 | 单元通过 | 阻塞 |
| `GET /api/v1/qa/sessions/{id}/messages` | `services/qa.js` (getMessages) | `pages/history/index` (恢复) | page, size | records (id, session_id, role, content, citations, feedback_status), total | 加载失败提示 | 单元通过 | 阻塞 |
| `DELETE /api/v1/qa/sessions/{id}` | `services/qa.js` (deleteSession) | `pages/history/index` | - | - | 删除失败提示 | 单元通过 | 阻塞 |

## 引用接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/v1/qa/sessions/{sid}/messages/{mid}/citations` | `services/qa.js` (getCitations) | `pages/citation/detail` | sessionId, messageId (路径参数) | document_name, chunk_path, excerpt, similarity, rerank_score, permission | 403 不展示原文；缺失字段条件渲染 | 4项引用权限测试通过 | 阻塞 |

## 反馈接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/v1/qa/sessions/{sid}/messages/{mid}/feedback` | `services/qa.js` (submitFeedback) | `pages/chat/index` (快速反馈), `pages/feedback/submit` (详细反馈) | feedback_type (like/dislike/no_citation), description ([原因前缀] + 说明) | - | 防止重复提交；提交失败提示 | 7项反馈映射测试通过 | 阻塞 |

## 文档接口

| 接口 | 调用模块 | 页面 | 请求字段 | 响应字段 | 错误处理 | 测试结果 | 联调状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/v1/documents` | `services/document.js` | （预留） | kb_id (必填), page, size, keyword | records, total | - | 单元框架就绪 | 阻塞 |
| `POST /api/v1/documents/upload` | `services/document.js` (upload) | `pages/files/index` | wx.uploadFile: file, kb_id, source, version, tags, permission_scope | - | 401/403/413/网络错误；格式和大小校验 | 9项文件校验测试通过 | 阻塞 |

## 全局安全与合规

| 检查项 | 状态 |
| --- | --- |
| API 地址只包含一次 /api/v1 | ✅ 测试通过 |
| 统一响应 code 非 200 抛出业务错误 | ✅ 测试通过 |
| 并发 401 只刷新一次 | ✅ 测试通过 |
| 刷新失败清理 Token | ✅ 测试通过 |
| 受限引用不泄露完整 excerpt | ✅ 测试通过 |
| 反馈映射符合 API-Q07 枚举 (like/dislike/no_citation) | ✅ 测试通过 |
| 文件扩展名仅允许 pdf/docx/md/txt/html/csv | ✅ 测试通过 |
| 文件 20MB 上限校验 | ✅ 测试通过 |
| SSE 拆包/粘包/中文边界/done 事件 | ✅ 11项测试通过 |
| 字段适配 snake_case → camelCase | ✅ 7项测试通过 |
| 所有 JS 语法检查通过 | ✅ |
| 所有 JSON 可解析 | ✅ |
| git diff --check 无空白警告 | ✅ |

## 已知阻塞项

1. **后端未就绪**：API 文档中所有主要接口完成情况均为"待开发"，真实联调无法进行。
2. **后端基础 URL**：当前使用 `http://localhost:8000` 作为开发占位，实际部署时需替换。
3. **引用详情字段不足**：接口未返回 kb_name、updated_at、highlight，页面已条件渲染。
4. **文件下载未实现**：接口没有安全下载 URL，storage_path 不能作为客户端下载地址，下载按钮已禁用并说明原因。
5. **清空全部历史**：没有批量删除接口，已提示用户逐条删除。
6. **统计数据**：历史问答数、反馈记录数、常用知识库无对应接口，显示 "--"。
7. **微信开发者工具验证**：CLI 环境无法自动控制开发者工具进行编译验证，需人工在微信开发者工具中确认。

## 测试统计

- 单元测试：51 项，全部通过
- Node 语法检查：miniprogram 下所有 JS 文件通过
- JSON 解析检查：miniprogram 下所有 JSON 文件通过
