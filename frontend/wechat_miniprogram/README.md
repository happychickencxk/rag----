# rag小程序代码微信小程序工程

本目录是后续正式开发使用的微信小程序工程，当前已从 `../figma_make` 的 Figma Make 原型迁移首批页面。

## 已迁移页面

- `miniprogram/pages/chat/index.*`：问答首页，已按 Figma Make 对话态进行视觉对齐，并支持底部弹层切换知识库。
- `miniprogram/pages/knowledge/index.*`：知识库页，按 Figma Make 全宽列表样式调整。
- `miniprogram/pages/history/index.*`：历史会话，按 Figma Make 分组列表样式调整。
- `miniprogram/pages/citation/detail.*`：引用详情。
- `miniprogram/pages/feedback/submit.*`：反馈纠错。
- `miniprogram/pages/profile/index.*`：我的页。
- `miniprogram/pages/states/index.*`：异常状态预览。
- `miniprogram/pages/files/index.*`：文件中心，支持选择文件和展示上传、下载状态。

## 当前说明

- 当前仍使用 `miniprogram/utils/mock.js` 中的模拟数据。
- 业务图标统一存放在 `miniprogram/images/icons/`，文件名使用小写英文和连字符。
- 页面内图标按普通灰、企业蓝、警告黄、错误红区分语义；自定义 tabBar 统一控制普通态和选中态颜色。
- 所有业务页面使用 `miniprogram/components/custom-nav` 自定义导航栏。
- 文件中心的真实上传和下载仍需等待后端接口。
- 暂未接入后端 API。
- 原云开发 QuickStart 模板文件仍保留，但 `app.json` 已切换到 RAG 小程序页面。
- 所有业务页面已使用自定义导航栏；微信状态栏和右上角胶囊按钮仍由宿主控制，不能移除。
- 需求与实现缺口见 `../../.ai-agent/08-requirements-gap-analysis.md`。
- 后续应先补齐请求层、微信登录、非流式问答和引用权限保护，再实现 SSE、历史恢复和反馈闭环。
