# 前端结构说明

## 技术栈

- React 18 风格组件。
- Vite 6。
- Tailwind CSS 4。
- lucide-react 图标。
- Radix UI / shadcn 风格组件文件位于 `frontend/src/app/components/ui`。

当前工程是 Web 原型，用 375px x 812px 手机容器模拟微信小程序界面。后续如果迁移为真实小程序，应复用页面结构、交互状态和接口字段，不应直接照搬 DOM 实现。

## 入口文件

- `frontend/index.html`：Vite HTML 入口。
- `frontend/src/main.tsx`：挂载 React 应用。
- `frontend/src/app/App.tsx`：当前主应用，包含页面组件、模拟数据、状态切换和手机框布局。
- `frontend/src/styles/index.css`：样式总入口。
- `frontend/src/styles/theme.css`：设计 token 和基础样式。

## 当前页面与组件

`App.tsx` 中的核心类型：

- `Tab`：主 tab，包含 `chat`、`knowledge`、`history`、`profile`。
- `SubPage`：二级页面，包含 `citation`、`feedback`、`states`。
- `Citation`：引用来源字段。
- `Message`：问答消息字段。
- `KnowledgeBase`：知识库卡片字段。
- `Session`：历史会话字段。

`App.tsx` 中的核心模拟数据：

- `KBS`：知识库列表和权限状态。
- `EXAMPLES`：示例问题。
- `CITATIONS`：引用来源。
- `AI_ANSWER`：示例 AI 回答。
- `SESSIONS`：历史会话。

`App.tsx` 中的核心组件：

- 顶层布局：`StatusBar`、`NavBar`、`TabBar`、`BottomSheet`。
- 问答链路：`ChatPage`、`KnowledgeBasePicker`、`WelcomeCard`、`ExampleQuestionChips`、`ChatMessageBubble`、`AIAnswerCard`、`AILoadingCard`、`QuestionInputBar`。
- 引用与反馈：`CitationCollapseCard`、`CitationDetailPage`、`FeedbackBar`、`FeedbackPage`。
- 列表页面：`KnowledgePage`、`KnowledgeBaseCell`、`HistoryPage`、`HistorySessionCell`。
- 个人与状态：`ProfilePage`、`StatesPage`、`EmptyState`、`InlineCard`。

## 样式策略

- 当前主要样式写在组件内联样式和 `theme.css`。
- 设计主色为企业蓝 `#1677FF`，页面背景 `#F7F8FA`，卡片背景 `#FFFFFF`。
- UI 应保持单列移动端布局，避免 Web 后台化。
- 不依赖 hover，优先设计点击态、按压态、loading 态。

## 当前限制

- 仍使用模拟数据，没有真实 API 请求层。
- 页面组件集中在 `App.tsx`，后续功能增多后需要拆分目录。
- 还没有统一的请求封装、认证 token 管理、SSE 流处理和错误映射。
- `frontend/README.md` 已改为项目说明，但代码注释仍以原型实现为主。

## 后续拆分建议

优先拆分为：

- `src/app/data/mock.ts`：模拟数据。
- `src/app/types.ts`：公共类型。
- `src/app/components/layout/`：NavBar、TabBar、BottomSheet。
- `src/app/features/chat/`：问答相关页面和组件。
- `src/app/features/knowledge/`：知识库选择。
- `src/app/features/history/`：历史会话。
- `src/app/features/feedback/`：反馈纠错。
- `src/app/api/`：请求封装、接口类型和错误处理。
