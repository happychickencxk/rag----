# 前端结构说明

## 当前前端目录

- `frontend/figma_make`：Figma Make 生成的 React/Vite 原型源码。该目录作为视觉、页面结构和模拟数据来源。
- `frontend/wechat_miniprogram`：实际微信小程序工程。后续开发、接口对接和页面维护都在这里进行。

`frontend/figma_make` 使用 React、Vite、Tailwind CSS、lucide-react 和 shadcn/Radix 风格组件；`frontend/wechat_miniprogram` 使用微信原生小程序技术栈，即 `app.json`、`Page({ data, methods })`、WXML、WXSS 和 rpx。

## Figma Make 原型入口

- `frontend/figma_make/index.html`：Vite HTML 入口。
- `frontend/figma_make/src/main.tsx`：挂载 React 应用。
- `frontend/figma_make/src/app/App.tsx`：原型主应用，包含页面组件、模拟数据、状态切换和手机框布局。
- `frontend/figma_make/src/styles/index.css`：样式总入口。
- `frontend/figma_make/src/styles/theme.css`：设计 token 和基础样式。

## 微信小程序入口

- `frontend/wechat_miniprogram/miniprogram/app.json`：页面、窗口和 tabBar 配置。
- `frontend/wechat_miniprogram/miniprogram/app.js`：全局状态初始化，当前保存选中知识库和 token 占位字段。
- `frontend/wechat_miniprogram/miniprogram/app.wxss`：全局样式、卡片、文本截断和按钮重置。
- `frontend/wechat_miniprogram/miniprogram/utils/mock.js`：迁移阶段模拟数据。

## 当前页面与组件

`frontend/figma_make/src/app/App.tsx` 中的核心类型：

- `Tab`：主 tab，包含 `chat`、`knowledge`、`history`、`profile`。
- `SubPage`：二级页面，包含 `citation`、`feedback`、`states`。
- `Citation`：引用来源字段。
- `Message`：问答消息字段。
- `KnowledgeBase`：知识库卡片字段。
- `Session`：历史会话字段。

`frontend/figma_make/src/app/App.tsx` 中的核心模拟数据：

- `KBS`：知识库列表和权限状态。
- `EXAMPLES`：示例问题。
- `CITATIONS`：引用来源。
- `AI_ANSWER`：示例 AI 回答。
- `SESSIONS`：历史会话。

`frontend/figma_make/src/app/App.tsx` 中的核心组件：

- 顶层布局：`StatusBar`、`NavBar`、`TabBar`、`BottomSheet`。
- 问答链路：`ChatPage`、`KnowledgeBasePicker`、`WelcomeCard`、`ExampleQuestionChips`、`ChatMessageBubble`、`AIAnswerCard`、`AILoadingCard`、`QuestionInputBar`。
- 引用与反馈：`CitationCollapseCard`、`CitationDetailPage`、`FeedbackBar`、`FeedbackPage`。
- 列表页面：`KnowledgePage`、`KnowledgeBaseCell`、`HistoryPage`、`HistorySessionCell`。
- 个人与状态：`ProfilePage`、`StatesPage`、`EmptyState`、`InlineCard`。

## 小程序已迁移页面

- `pages/chat/index.*`：问答首页，当前已优先贴近 Figma 对话态截图；包含知识库连接条、用户问题气泡、AI 回答卡片、引用来源折叠、反馈栏和底部输入栏。
- `pages/knowledge/index.*`：知识库选择页，支持搜索、选中态和无权限态。
- `pages/history/index.*`：历史会话页，按时间分组展示模拟会话。
- `pages/citation/detail.*`：引用来源详情页，展示文档信息、分数、命中高亮和权限提示。
- `pages/feedback/submit.*`：反馈纠错页，支持反馈类型选择、补充说明和提交成功态。
- `pages/profile/index.*`：我的页，展示用户身份、权限列表、设置入口。
- `pages/states/index.*`：异常状态预览页。

## 样式策略

- Figma Make 原型主要样式写在组件内联样式和 `theme.css`。
- 小程序端使用页面级 WXSS 和 `app.wxss`，尺寸以 rpx 为主。
- 设计主色为企业蓝 `#1677FF`，页面背景 `#F7F8FA`，卡片背景 `#FFFFFF`。
- UI 应保持单列移动端布局，避免 Web 后台化。
- 不依赖 hover，优先设计点击态、按压态、loading 态。
- `pages/chat/index` 保留微信原生导航栏，因此顶部状态栏和右上角胶囊按钮由微信宿主控制，不能像 Figma 手机壳原型一样完全自由排版。

## 当前限制

- 小程序端仍使用 `utils/mock.js`，没有真实 API 请求层。
- 还没有统一的请求封装、认证 token 管理、SSE 流处理和错误映射。
- `frontend/wechat_miniprogram` 原本是云开发 QuickStart 模板，部分旧模板页面和云函数仍存在，但已从 `app.json` 页面入口移除。
- `frontend/wechat_miniprogram` 曾带有模板自带的独立 `.git` 元数据；为便于外层仓库统一管理，本轮已移除内嵌 `.git`，源码将由根仓库跟踪。

## 后续拆分建议

优先补齐为：

- `miniprogram/utils/api.js`：请求封装、鉴权头、错误处理。
- `miniprogram/utils/auth.js`：微信登录、token 保存、刷新。
- `miniprogram/utils/sse.js`：问答流式输出适配。
- 可复用组件目录：引用卡片、反馈栏、空状态、异常状态卡片。
