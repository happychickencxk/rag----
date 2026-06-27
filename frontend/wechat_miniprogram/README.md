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

## 当前说明

- 当前仍使用 `miniprogram/utils/mock.js` 中的模拟数据。
- 业务图标统一存放在 `miniprogram/images/icons/`，文件名使用小写英文和连字符。
- 页面内图标按普通灰、企业蓝、警告黄、错误红区分语义；原生 tabBar 暂时通过文字颜色表示选中状态。
- 暂未接入后端 API。
- 原云开发 QuickStart 模板文件仍保留，但 `app.json` 已切换到 RAG 小程序页面。
- 问答页当前保留微信原生导航栏，顶部状态栏和右上角胶囊按钮无法完全按 Figma 静态手机壳复刻。
- 后续开发应优先补齐请求层、微信登录、知识库列表、问答接口、引用详情和反馈闭环。
