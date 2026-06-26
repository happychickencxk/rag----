# 企业知识库 RAG 问答系统 · 微信小程序端 UI 规划

> **阶段**：规划阶段，尚未生成任何页面代码。
> **参考来源**：WeUI 参考图（4 张）+ `rag_miniprogram_context.md` 项目背景文件。

---

## 一、设计原则

| 原则 | 说明 |
|------|------|
| 轻量问答入口，不是管理后台 | 主路径：选知识库 → 提问 → 看回答 → 看引用 → 反馈 |
| 单列布局 | 所有页面均为单列，无侧边栏、无多列 Dashboard |
| WeUI / TDesign 原生气质 | 背景 `#F7F8FA`，卡片 `#FFFFFF`，企业蓝主色 |
| 引用必须清楚 | 引用来源不可被省略或弱化，文档名 + 路径 + 片段 + 分数 |
| 异常状态完整 | 9 种异常状态均有专属 UI，不能只显示 loading |
| 触摸交互，无 hover | 点击态、按压态、loading 态，不依赖 hover |
| 适配安全区域 | 底部输入栏、TabBar 均需适配 SafeArea |

---

## 二、设计系统 Tokens

### 颜色

```css
/* 主色 */
--color-primary:          #1677FF   /* 企业蓝，主 CTA、选中态、链接 */
--color-primary-light:    #E6F0FF   /* 浅蓝，chips 背景、角标底 */
--color-primary-dark:     #0E5FD8   /* 深蓝，按压态 */

/* 语义色 */
--color-success:          #07C160   /* 有依据 / 检索成功 */
--color-success-light:    #E6F9EF
--color-warning:          #FA8919   /* 低置信度 / 无依据提示 */
--color-warning-light:    #FFF3E0
--color-danger:           #FA5151   /* 无权限 / 超时 / 敏感词 */
--color-danger-light:     #FFF0EF

/* 背景层级 */
--color-bg-page:          #F7F8FA   /* 页面底色 */
--color-bg-card:          #FFFFFF   /* 卡片、气泡 */
--color-bg-input:         #F5F5F5   /* 输入框、搜索框 */
--color-bg-overlay:       rgba(0,0,0,0.5)  /* 遮罩 */
--color-bg-tag:           #EEF3FC   /* 标签背景 */

/* 文字层级 */
--color-text-primary:     #1A1A1A   /* 主标题、正文 */
--color-text-secondary:   #888888   /* 副标题、时间、描述 */
--color-text-tertiary:    #BDBDBD   /* 占位符、禁用 */
--color-text-link:        #1677FF   /* 可点击链接 */
--color-text-inverse:     #FFFFFF   /* 深色背景上文字 */
--color-text-warning:     #FA8919
--color-text-danger:      #FA5151

/* 气泡 */
--color-bubble-user:      #1677FF   /* 用户消息气泡（企业蓝） */
--color-bubble-user-text: #FFFFFF
--color-bubble-ai:        #FFFFFF   /* AI 回答气泡 */

/* 边框 */
--color-border:           #EDEDED   /* 标准分割线 */
--color-border-light:     rgba(0,0,0,0.05)
```

### 字号（Web 实现用 px，对应 750rpx 稿的 rpx÷2）

```css
--font-xs:    10px   /* 20rpx — 角标、分数 */
--font-sm:    12px   /* 24rpx — 时间戳、描述、路径 */
--font-base:  14px   /* 28rpx — 正文、cell 标题 */
--font-md:    15px   /* 30rpx — 气泡文字 */
--font-lg:    16px   /* 32rpx — 模块标题 */
--font-xl:    18px   /* 36rpx — 页面主标题、NavBar */
```

### 间距（8px spacing system）

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--page-h:    16px   /* 页面水平内边距 */
```

### 圆角

```css
--radius-xs:   4px    /* 标签、角标 */
--radius-sm:   8px    /* 按钮、输入框 */
--radius-md:   12px   /* 普通卡片、引用卡片 */
--radius-lg:   16px   /* 消息气泡 */
--radius-xl:   20px   /* 底部弹层顶角 */
--radius-full: 999px  /* 胶囊按钮、圆形头像 */
```

---

## 三、页面清单与核心模块

### Page 1：问答首页（主页 / 核心页）

**路由**：`/pages/chat/index`  
**TabBar 入口**：第 1 个 Tab

#### 布局结构
```
┌─────────────────────────────┐  ← NavBar（固定）
│ ≡  企业知识库助手      ⏱ ⋯  │
├─────────────────────────────┤
│ [知识库选择器]               │  ← KnowledgeBasePicker（固定，粘性）
│  📂 售后知识库  ▼            │
├─────────────────────────────┤
│                             │
│  [欢迎卡片 / EmptyState]     │  ← 对话为空时显示
│  示例问题 Chips (横向滚动)    │
│                             │
│  ─────── 消息流 ─────────    │  ← scroll-view
│  [AI头像] [AIAnswerCard]     │
│           ├ 正文             │
│           ├ CitationCollapse │
│           └ FeedbackBar      │
│                    [用户气泡]│
│  [AI头像] [LoadingState]     │
│                             │
├─────────────────────────────┤  ← QuestionInputBar（固定）
│ 🎤  请输入问题...       发送  │
└─────────────────────────────┘
  ─── TabBar ───────────────
```

#### 核心模块
1. **MiniProgramNavBar** — 左：菜单/新建，中：标题，右：历史+更多
2. **KnowledgeBasePicker** — 当前知识库 + 切换入口（底部弹层）
3. **WelcomeCard** — 首次进入展示说明文字
4. **ExampleQuestionChips** — 3~4 个示例问题，横向滚动
5. **消息流（ScrollView）** — ChatMessageBubble + AIAnswerCard
6. **AIAnswerCard** — 正文 + CitationCollapseCard + FeedbackBar
7. **QuestionInputBar** — 多行输入 + 语音 + 发送

#### 必须覆盖的状态
| 状态 | 触发条件 | 展示位置 |
|------|----------|----------|
| 空对话 | 首次进入/清空后 | 消息流区域展示欢迎卡 + Chips |
| 用户消息发出 | 发送后立即显示 | 右侧蓝色气泡 |
| AI 检索中 | 等待检索结果 | 左侧骨架动画（3行灰条） |
| AI 流式输出 | 生成中 | 文字逐字出现 + 光标 `▌` |
| 有依据回答 | 检索成功 | AIAnswerCard + CitationCollapseCard |
| 无依据（NoEvidence） | 未检索到足够片段 | AIAnswerCard 内嵌橙色警告块 |
| 低置信度（LowConfidence） | Rerank 分数偏低 | AIAnswerCard 顶部黄色 banner |
| 无权限（NoPermission） | 无法访问知识库 | 红色提示卡，替换 AIAnswerCard |
| 模型超时（ModelTimeout） | 接口超时 | 红色提示 + 重试按钮 |
| 敏感词拦截（SensitiveBlocked） | 问题含敏感词 | 橙色拦截提示，无回答 |

---

### Page 2：知识库选择页

**路由**：`/pages/knowledge/index`  
**触发方式**：点击 KnowledgeBasePicker → 底部 BottomSheet（优先）或独立页面

#### 布局结构
```
┌─────────────────────────────┐
│ ← 选择知识库                 │  ← NavBar
├─────────────────────────────┤
│ 🔍  搜索知识库...            │  ← 搜索框
├─────────────────────────────┤
│ 📁 售后知识库       ✓ 已选   │
│    共 342 份文档 · 更新 3天前 │
├─────────────────────────────┤
│ 📁 人事制度库                │
│    共 128 份文档 · 更新 1周前 │
├─────────────────────────────┤
│ 🔒 研发技术库   无访问权限   │  ← 置灰状态
│    请联系 IT 部门申请权限     │
├─────────────────────────────┤
│ 📁 企业 FAQ                  │
│    共 56 份文档 · 更新 今天   │
└─────────────────────────────┘
```

#### 核心模块
1. **搜索框** — `#F5F5F5` 背景，圆角，即时过滤
2. **KnowledgeBaseCell** — 图标 + 名称 + 描述 + 文档数 + 更新时间 + 权限标签
3. **选中状态** — 蓝色对号 `✓`，当前行高亮
4. **无权限状态** — 整行置灰 + 锁图标 + "无访问权限"文字

#### 必须覆盖的状态
| 状态 | 说明 |
|------|------|
| 正常可选 | 默认态 |
| 已选中 | 蓝色 `✓` |
| 无权限 | 置灰 + 🔒 + 提示文字 |
| 搜索无结果 | EmptyState |
| 暂无可访问知识库（EmptyKnowledgeBase） | 全页替换：插图 + 说明 + 联系管理员 |

---

### Page 3：引用来源详情页

**路由**：`/pages/citation/detail`  
**触发方式**：点击 CitationCollapseCard 中的某条引用

#### 布局结构
```
┌─────────────────────────────┐
│ ← 引用来源                   │  ← NavBar
├─────────────────────────────┤
│ 文档信息卡                   │
│  📄 《售后服务管理规范 v3.2》 │
│  所属：售后知识库             │
│  章节：第 4 章 > 退换货政策   │
│  更新：2024-05-10            │
│  [已授权] 标签               │
├─────────────────────────────┤
│ 命中分数                     │
│  相似度 0.87  Rerank 0.91   │
├─────────────────────────────┤
│ 原文片段                     │
│ ┌─────────────────────────┐ │
│ │ ...客户提出退货申请须在  │ │
│ │ 收货后 **7个自然日** 内  │ │  ← 命中句高亮（蓝色底）
│ │ 提交，超期不予受理...    │ │
│ └─────────────────────────┘ │
│ [展开完整片段]               │
├─────────────────────────────┤
│ [复制引用]  [反馈引用错误]   │  ← 底部操作按钮
└─────────────────────────────┘
```

#### 核心模块
1. **DocumentInfoCard** — 文件名、知识库、章节路径、更新时间、权限标签
2. **ScoreBadge** — 相似度分数 + Rerank 分数（双 badge）
3. **HighlightTextBlock** — 原文片段，命中句黄色/蓝色底高亮
4. **ExpandCollapse** — 长文本折叠展开
5. **底部操作栏** — 复制引用、反馈引用错误

#### 必须覆盖的状态
| 状态 | 说明 |
|------|------|
| 正常展示 | 全部信息可见 |
| 无权查看完整原文 | 原文区域遮罩 + "该文档片段受权限保护，仅可查看摘要" |
| 文档已删除/失效 | 警告提示，无法展示原文 |

---

### Page 4：历史会话页

**路由**：`/pages/history/index`  
**TabBar 入口**：第 2 个 Tab

#### 布局结构
```
┌─────────────────────────────┐
│    历史会话              🔍  │  ← NavBar
├─────────────────────────────┤
│ 今天                        │  ← 时间分组 header
├─────────────────────────────┤
│ 售后知识库 · 3条消息  今天   │
│ 超过7天还能退货吗？          │  ← 会话标题
│ AI：根据售后规范，退货须在...│  ← 最新回答摘要（1行）
├─────────────────────────────┤
│ 人事制度库 · 5条消息  昨天  │
│ 试用期请假影响转正吗？       │
│ AI：根据员工手册第三章...    │
├─────────────────────────────┤
│ 近 7 天                     │
│ ...                         │
└─────────────────────────────┘
```

#### 核心模块
1. **搜索框** — 搜索历史问题内容
2. **时间分组 header** — 今天 / 昨天 / 近 7 天 / 更早
3. **HistorySessionCell** — 知识库标签 + 会话标题 + 回答摘要 + 消息数 + 时间
4. **长按操作** — 删除会话（ActionSheet）

#### 必须覆盖的状态
| 状态 | 说明 |
|------|------|
| 正常列表 | 按时间分组 |
| 搜索结果 | 关键字高亮 |
| 空历史（EmptyHistory） | 插图 + "暂无历史会话" + "去提问"按钮 |
| 加载中 | 骨架屏（3 条灰色占位条） |

---

### Page 5：反馈纠错页

**路由**：`/pages/feedback/submit`  
**触发方式**：点击 FeedbackBar 中的"纠错"或点踩后的"详细反馈"

#### 布局结构
```
┌─────────────────────────────┐
│ ← 提交反馈                  │  ← NavBar
├─────────────────────────────┤
│ 原问题                      │
│  试用期请假影响转正吗？      │  ← 灰底只读区域
├─────────────────────────────┤
│ AI 回答摘要                  │
│  根据员工手册第三章规定...   │  ← 灰底，最多 3 行
├─────────────────────────────┤
│ 反馈类型                    │
│  ○ 答案不正确               │
│  ○ 引用错误                 │
│  ○ 没有引用依据             │
│  ○ 答案不完整               │
│  ○ 展示了无权限内容         │
│  ○ 其他                     │
├─────────────────────────────┤
│ 补充说明（选填）             │
│ ┌─────────────────────────┐ │
│ │ 请描述具体问题...        │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [          提交反馈        ] │  ← 主按钮
└─────────────────────────────┘
```

#### 核心模块
1. **ContextSummaryCard** — 原问题 + AI 回答摘要（只读）
2. **RadioGroup** — 反馈类型单选
3. **TextareaInput** — 补充说明，计数显示
4. **提交按钮** — 满足选择类型才可用

#### 必须覆盖的状态
| 状态 | 说明 |
|------|------|
| 待填写 | 提交按钮禁用 |
| 填写中 | 提交按钮激活 |
| 提交成功 | 全页替换为成功卡：插图 + "反馈已提交，知识库负责人将进行处理" + "返回"按钮 |
| 提交失败 | Toast 错误提示 |

---

### Page 6：我的页

**路由**：`/pages/profile/index`  
**TabBar 入口**：第 4 个 Tab

#### 布局结构
```
┌─────────────────────────────┐
│    我的                     │  ← NavBar
├─────────────────────────────┤
│ [头像]  姓名                 │  ← UserProfileCard
│         部门 · 角色          │
├─────────────────────────────┤
│ 我的知识库权限               │  ← 权限列表（可折叠）
│  ✓ 售后知识库  ✓ 企业 FAQ   │
│  ✗ 研发技术库（无权限）      │
├─────────────────────────────┤
│ 我的反馈记录            >   │  ← 跳转反馈列表
│ 最近使用知识库          >   │
├─────────────────────────────┤
│ 清空历史会话                │  ← 设置列表
│ 消息通知                    │
│ 帮助与反馈                  │
│ 关于系统                    │
├─────────────────────────────┤
│ [          退出登录        ] │  ← 危险按钮（红色边框）
└─────────────────────────────┘
```

#### 核心模块
1. **UserProfileCard** — 头像 + 姓名 + 部门 + 角色
2. **PermissionList** — 可访问 / 不可访问知识库列表
3. **SettingsCell** — WeUI 标准 cell，右箭头
4. **退出登录按钮** — 红色描边，点击 ActionSheet 确认

---

### Page 7：异常状态组件集合（内嵌组件，非独立页）

| 组件名 | 触发条件 | 展示位置 | 视觉 |
|--------|----------|----------|------|
| `LoadingState` | 检索中 | AIAnswerCard 位置 | 骨架动画 + "正在检索知识库..." |
| `StreamingState` | 流式生成中 | AIAnswerCard | 文字输出 + `▌` 光标 |
| `NoEvidenceState` | 未找到足够依据 | AIAnswerCard 内嵌 | 橙色警告块 + 建议文字 |
| `LowConfidenceState` | Rerank 分低 | AIAnswerCard 顶部 | 黄色 banner + "置信度较低，请人工确认" |
| `NoPermissionState` | 无权访问 | 替换 AIAnswerCard | 红色卡 + 🔒 + "联系管理员" |
| `ModelTimeoutState` | API 超时 | 替换 AIAnswerCard | 红色提示 + "重试"按钮 |
| `SensitiveBlockedState` | 敏感词 | 替换 AIAnswerCard | 橙色拦截卡 + 说明 |
| `EmptyHistory` | 历史为空 | 历史页全页 | 插图 + 说明 + "去提问" |
| `EmptyKnowledgeBase` | 无可访问知识库 | 知识库页全页 | 插图 + 说明 + "联系管理员" |

---

## 四、关键组件规范

### MiniProgramNavBar
- 高度：44px + statusBarHeight（动态获取）
- 背景：`#FFFFFF`，底部 1px `#EDEDED`
- 标题：18px bold，居中，最多 10 字
- 左侧：汉堡图标（首页）/ 返回箭头（子页）
- 右侧：图标按钮组（不遮系统胶囊）

### BottomTabBar
- 4 个 Tab：**问答** / **历史** / **知识库** / **我的**
- 图标：24px，选中蓝色 `#1677FF`，未选灰色 `#888`
- 文字：10px，选中蓝色
- 高度：50px + SafeArea Bottom
- 背景：`#FFFFFF`，顶部 1px `#EDEDED`

### KnowledgeBasePicker（粘性知识库选择器）
- 位于 NavBar 下方，粘性定位
- 背景：`#FFFFFF`
- 显示：图标 + 当前知识库名 + `▼`
- 点击：底部 BottomSheet 弹出知识库列表

### ChatMessageBubble（用户消息）
- 对齐：右
- 背景：`#1677FF`，文字 `#FFFFFF`
- 圆角：16px（右下角 4px 形成气泡尾方向感）
- 最大宽度：80%
- 右侧头像：28px 圆形

### AIAnswerCard（AI 回答）
- 对齐：左
- 左侧 AI 头像：28px，蓝底白色机器人图标
- 气泡背景：`#FFFFFF`，圆角 12px，轻阴影
- 内容：Markdown 渲染文本，14px，行高 1.7
- 流式输出光标：蓝色 `▌` 闪烁
- 底部接 CitationCollapseCard + FeedbackBar

### CitationCollapseCard（引用来源折叠卡）
- 默认折叠，显示："查看来源 [3]"（文件图标 + 数量）
- 展开后每条引用：
  - ① 序号角标（蓝底白字，10px）
  - 文档名（截断 1 行）+ 文档类型图标
  - 章节路径（12px 灰色）
  - 原文摘要（2 行截断，14px）
  - Rerank 分数 badge（绿/橙/红色，按分值区分）
- 点击跳转引用详情页

### QuestionInputBar（底部输入栏）
- 固定在页面底部，含 SafeArea
- 左：麦克风图标按钮（24px）
- 中：多行输入框（最多 4 行），背景 `#F5F5F5`，圆角 8px
- 右：发送按钮（`#1677FF` 背景，白色文字，8px 圆角）
- 禁用时：发送按钮 `#C8C8C8`

### FeedbackBar（反馈操作栏）
- 位于 AIAnswerCard 底部
- 图标按钮：👍 有用 / 👎 没用 / 📋 复制 / 🔄 重新生成 / ⚠️ 纠错
- 选中态：实心图标 + 蓝色 `#1677FF`
- 图标 20px，间距 20px

### ExampleQuestionChips（示例问题）
- 横向 scroll-view，单行
- Chip：`#E6F0FF` 背景，`#1677FF` 文字，圆角 999px，12px 内边距
- 点击即发送问题

### HistorySessionCell
- 高度：约 72px
- 左侧：知识库小图标 + 名称 tag（12px）
- 中：会话标题（1 行截断，14px）+ 回答摘要（1 行截断，12px 灰）
- 右：消息数 + 时间（12px 灰）+ 箭头

---

## 五、不应出现在小程序端的功能

| 功能 | 原因 |
|------|------|
| 文档上传与批量管理 | 管理后台功能 |
| Embedding / Rerank / LLM 模型配置 | 运维后台功能 |
| TopK / chunk_size 等参数 | 系统参数，非用户功能 |
| 审计日志大表格 | 管理后台 |
| 权限管理后台（RBAC 配置） | 管理后台 |
| 数据统计大看板 | 管理后台 |
| 数据库 / 部署架构页 | 运维页面 |
| 多列 Dashboard | 不适配移动端 |
| 左侧导航栏 + 复杂筛选器 | Web 后台模式 |
| 用户管理列表 | 管理后台 |
| hover 态、tooltip | 触摸屏无效 |

---

## 六、页面与路由汇总

| 页面 | 路由 | TabBar | 触发方式 |
|------|------|--------|---------|
| 问答首页 | `/pages/chat/index` | Tab 1（问答） | 启动默认页 |
| 知识库选择 | `/pages/knowledge/index` | Tab 3（知识库） | 点击 Picker 或 Tab |
| 引用详情 | `/pages/citation/detail` | — | 点击引用卡片 |
| 历史会话 | `/pages/history/index` | Tab 2（历史） | Tab 切换 |
| 反馈纠错 | `/pages/feedback/submit` | — | 点击纠错按钮 |
| 我的 | `/pages/profile/index` | Tab 4（我的） | Tab 切换 |

---

## 七、React Web 实现说明（本项目适配）

由于本项目为 React Web 实现（模拟小程序风格）：

- 用 `375px` 宽度容器居中，模拟手机尺寸
- `position: fixed` 模拟 NavBar 和 TabBar
- 消息流：`overflow-y: auto` + `scrollIntoView()` 自动滚底
- 字体栈：`-apple-system, "PingFang SC", "Helvetica Neue", sans-serif`
- 路由：React Router（`/chat`、`/knowledge`、`/history`、`/citation`、`/feedback`、`/profile`）
- 流式输出模拟：`setInterval` 或 SSE
- Markdown 渲染：可用 `react-markdown`（需安装）或简单字符串处理

---

## 八、实现优先级

1. **P0（核心路径）**：问答首页（NavBar + KnowledgeBasePicker + 消息流 + AIAnswerCard + CitationCollapseCard + QuestionInputBar + FeedbackBar）
2. **P1（支撑功能）**：知识库选择页、历史会话页、引用详情页
3. **P2（补全）**：反馈纠错页、我的页
4. **P3（状态完整）**：9 种异常状态组件

---

## 九、下一步

> 以上为规划阶段全部输出，确认后开始实现。

**建议实现顺序**：
1. `theme.css` 写入 Design Tokens
2. `fonts.css` 引入系统字体
3. 基础布局框架（MiniProgramNavBar + BottomTabBar + React Router）
4. 问答首页（消息流 + AIAnswerCard + CitationCollapseCard + QuestionInputBar）
5. 所有异常状态组件
6. 知识库选择页 + BottomSheet
7. 历史会话页
8. 引用详情页
9. 反馈纠错页 + 我的页
