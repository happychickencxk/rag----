# rag小程序代码微信小程序工程

本目录是正式使用的微信小程序工程，已从 `../figma_make` 的 Figma Make 原型完成首批页面迁移和全量接口接入。

## 已迁移页面

- `pages/login/index`：登录页，微信一键登录、加载态和错误重试。
- `pages/chat/index`：问答首页，SSE 流式输出、特殊状态、停止生成、示例问题、知识库切换、引用和反馈。
- `pages/knowledge/index`：知识库页，服务端搜索、分页加载、权限状态和文档列表入口。
- `pages/documents/index`：知识库文档页，文档搜索、分页、解析状态、安全下载和开始问答。
- `pages/history/index`：历史会话，按时间分组、消息恢复、单会话删除和 PDF 导出。
- `pages/citation/detail`：引用详情，展示页码/行号、相邻原文、命中高亮和原文件入口。
- `pages/feedback/submit`：反馈纠错，六种细分原因映射到 API 枚举。
- `pages/profile/index`：我的页，真实用户信息、退出登录。
- `pages/states/index`：异常状态预览（开发验证用）。
- `pages/files/index`：文件中心，权限校验、上传、非法格式撤销、失败重试和安全下载。

## 基础设施

- `config/api.js`：API 地址、数据源模式（mock/api）和超时配置。
- `utils/storage.js`：Token、用户、知识库和会话状态持久化。
- `utils/request.js`：统一请求封装、响应解析、401 刷新队列。
- `utils/upload.js`：文件上传和原始文件名传递。
- `utils/file-transfer.js`：带 Token 刷新的文档下载、会话导出与文件打开。
- `utils/sse.js`：SSE 分块、UTF-8 和完成状态解析。
- `utils/qa-status.js`：问答特殊状态映射和敏感内容展示保护。
- `services/auth.js`：认证服务（微信登录/刷新/profile/退出）。
- `services/knowledge.js`：知识库服务。
- `services/qa.js`：问答服务（非流式/SSE/会话/导出/引用/反馈）。
- `services/document.js`：文档服务（列表/上传/安全下载/引用原文定位）。
- `adapters/index.js`：后端 snake_case → 前端视图模型映射、反馈原因映射。

## 本地 Mock 联调

小程序始终通过服务层调用 HTTP API，不在页面内直接读取模拟数据。真实后端就绪前，在仓库根目录运行：

```powershell
node mock-server\server.js
```

当前 `config/api.js` 的 `API_ORIGIN` 为 `http://127.0.0.1:8000`。切换部署后端时只替换该地址，不修改页面调用。

## 当前说明

- 业务图标统一存放在 `miniprogram/images/icons/`，文件名使用小写英文和连字符。
- 页面内图标按普通灰、企业蓝、警告黄、错误红区分语义。
- 所有业务页面使用 `miniprogram/components/custom-nav` 自定义导航栏。
- 自定义 tabBar 统一控制普通态（灰色）和选中态（企业蓝）。
- 语音输入按钮保留但标记为"暂未开放"。
- 消息通知、关于系统提供明确反馈，不是无反应按钮。
- `NoEvidence`、`LowConfidence`、`NoPermission`、`ModelTimeout`、`SensitiveBlocked` 已接入问答实时流程。
- 引用卡片展示“第几页、第几行”，点击后自动定位并高亮命中原文，不展示内部 chunk 编码。
- 引用相关度按 Rerank 阈值展示“高相关/中相关/低相关”，不把模型分数误标成概率百分比。
- 接口合规清单见 `../../.ai-agent/11-api-compliance-checklist.md`。
- 本地 Mock、真实后端和微信开发者工具验收均已通过。
- 原云开发 QuickStart 页面、组件、云函数和部署脚本已清理。

## 运行方式

1. 安装微信开发者工具。
2. 打开本目录 `frontend/wechat_miniprogram`。
3. 在 `config/api.js` 中设置后端地址（`API_ORIGIN`）。
4. 编译预览。

## 测试

```powershell
node --test frontend\wechat_miniprogram\miniprogram\tests\unit\*.test.js
node --test mock-server\contract.test.js
```

当前小程序单元测试共 74 项。
