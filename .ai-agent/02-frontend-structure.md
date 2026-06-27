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
- `frontend/wechat_miniprogram/miniprogram/components/custom-nav`：所有业务页面共用的自定义导航栏，负责状态栏避让、标题位置和二级页返回。
- `frontend/wechat_miniprogram/miniprogram/custom-tab-bar`：四个主 tab 共用的自定义底部导航，统一图标灰色与企业蓝选中态。

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

- `pages/chat/index.*`：问答首页，当前已优先贴近 Figma 对话态截图；包含知识库连接条、底部知识库切换弹层、用户问题气泡、AI 回答卡片、引用来源折叠、反馈栏和底部输入栏。
- `pages/knowledge/index.*`：知识库页，支持搜索、选中态和无权限态，当前按 Figma 截图使用全宽分隔线列表。
- `pages/history/index.*`：历史会话页，按时间分组展示模拟会话，当前按 Figma 截图使用灰色分组条和全宽会话列表。
- `pages/citation/detail.*`：引用来源详情页，展示文档信息、分数、命中高亮和权限提示。
- `pages/feedback/submit.*`：反馈纠错页，支持反馈类型选择、补充说明和提交成功态。
- `pages/profile/index.*`：我的页，展示用户身份、权限列表、设置入口。
- `pages/states/index.*`：异常状态预览页。
- `pages/files/index.*`：文件中心页，包含微信文件选择、待上传列表和下载状态；真实上传、下载仍等待后端接口。

## 样式策略

- Figma Make 原型主要样式写在组件内联样式和 `theme.css`。
- 小程序端使用页面级 WXSS 和 `app.wxss`，尺寸以 rpx 为主。
- 设计主色为企业蓝 `#1677FF`，页面背景 `#F7F8FA`，卡片背景 `#FFFFFF`。
- UI 应保持单列移动端布局，避免 Web 后台化。
- 不依赖 hover，优先设计点击态、按压态、loading 态。
- `pages/chat/index` 保留微信原生导航栏，因此顶部状态栏和右上角胶囊按钮由微信宿主控制，不能像 Figma 手机壳原型一样完全自由排版。
- 列表页应优先使用固定图标列、弹性内容列、固定右侧状态列；所有文本内容列都需要 `min-width: 0` 和截断样式，避免宽度挤压。
- 全宽列表行不要使用 `button` 作为整行容器，微信 `button` 默认样式容易在仿真器中造成宽度压缩和居中；需要点击反馈时优先使用 `view bindtap`。
- 问答页展开引用行同样必须使用 `view bindtap`；Computer Use 实测原生 `button` 会在 `279px` 列表内缩为约 `184px`，并自动产生左右外边距。改为 `view` 后正文宽度达到 `263px`，仅保留列表正常内边距。
- 业务图标统一放在 `miniprogram/images/icons/`，使用小写英文连字符命名；详细映射和颜色规则见 `07-icon-assets.md`。
- 知识库列表、知识库切换弹层、历史会话、问答反馈栏、底部输入栏、我的页设置项和异常状态页已替换为本地图标。
- 页面内图标可通过 WXSS `filter` 统一为灰、蓝、黄、红四类语义色；原生 tabBar 无法使用页面滤镜。
- 可交互控件发生颜色、透明度或图标状态变化时，默认使用约 `200ms ease` 过渡；当前已覆盖问答发送、答案反馈、反馈类型单选和提交反馈按钮。
- 提交反馈按钮的蓝色启用态由补充说明中的非空文本驱动，纯空格仍保持灰色。
- 原生导航栏标题由微信宿主渲染，页面 WXSS 无法单独调整标题的垂直位置；需要完全控制时必须改为自定义导航栏。
- 当前已将全局 `navigationStyle` 改为 `custom`，所有业务页面通过 `custom-nav` 统一控制标题并略微上移。
- 当前 tabBar 使用官方自定义模式，图标在组件内通过 WXSS 滤镜统一为灰色，选中态统一为企业蓝。

## 当前限制

- 小程序端仍使用 `utils/mock.js`，没有真实 API 请求层。
- 还没有统一的请求封装、认证 token 管理、SSE 流处理和错误映射。
- 文件中心目前只有前端选择和状态展示，上传、下载、文件列表接口尚未定义和对接。
- `frontend/wechat_miniprogram` 原本是云开发 QuickStart 模板，部分旧模板页面和云函数仍存在，但已从 `app.json` 页面入口移除。
- `frontend/wechat_miniprogram` 曾带有模板自带的独立 `.git` 元数据；为便于外层仓库统一管理，本轮已移除内嵌 `.git`，源码将由根仓库跟踪。

## 当前基础设施文件（2026-06-27 阶段1已建立）

- `miniprogram/config/api.js`：API 地址、数据源模式和超时配置。
- `miniprogram/utils/storage.js`：Token、用户、当前知识库和会话状态持久化。
- `miniprogram/utils/request.js`：统一请求封装、响应解析、BusinessError、401 刷新队列。
- `miniprogram/utils/upload.js`：wx.uploadFile 封装、Token 附加和统一响应处理。
- `miniprogram/utils/sse.js`：纯函数 SSE 解析器，支持拆包、粘包、中文 UTF-8 边界和 done 事件。
- `miniprogram/services/auth.js`：微信登录、Token 刷新、获取用户信息和退出登录。
- `miniprogram/services/knowledge.js`：知识库列表和详情查询。
- `miniprogram/services/qa.js`：非流式问答、SSE 流式问答、会话管理和反馈提交。
- `miniprogram/services/document.js`：文档列表和文件上传。
- `miniprogram/adapters/index.js`：后端 snake_case 到前端视图模型的集中映射，含反馈原因映射。
- `miniprogram/tests/unit/`：纯 Node 单元测试，覆盖 URL 规范化、响应解析、Token 刷新、SSE 解析、反馈映射、引用权限、文件校验和字段适配。

## 后续拆分建议

- 可复用组件目录：引用卡片、反馈栏、空状态、异常状态卡片。
