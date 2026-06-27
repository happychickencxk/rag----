# 图标资产规范

## 目录与引用

- 业务图标统一存放在 `frontend/wechat_miniprogram/miniprogram/images/icons/`。
- WXML 使用以 `miniprogram` 为根目录的绝对路径，例如 `/images/icons/search.png`。
- `app.json` 的 tabBar 路径不以 `/` 开头，例如 `images/icons/history.png`。
- 文件名统一使用小写英文和连字符，不再新增中文名或拼音名。

## 本轮英文命名

| 原文件名 | 当前文件名 | 主要用途 |
| --- | --- | --- |
| `AI助手logo.png` | `ai-assistant.png` | AI 头像、问答 tab、生成中状态 |
| `帮助.png` | `help.png` | 后续帮助入口 |
| `超时.png` | `timeout.png` | 模型超时状态 |
| `发送信息.png` | `send-message.png` | 问答发送按钮 |
| `关于.png` | `about.png` | 关于系统 |
| `来源.png` | `source.png` | 引用来源 |
| `拦截.png` | `blocked.png` | 敏感内容拦截 |
| `历史记录.png` | `history.png` | 历史 tab、历史会话 |
| `清空.png` | `clear-history.png` | 清空历史 |
| `三角形警告.png` | `warning-triangle.png` | 未找到依据、低置信度提示 |
| `搜索.png` | `search.png` | 搜索框 |
| `文件上传.png` | `upload-file.png` | 后续文件上传入口 |
| `我的.png` | `profile.png` | 我的 tab |
| `无权限.png` | `no-permission.png` | 无权限知识库和文档 |
| `消息.png` | `notification.png` | 消息通知 |
| `语音.png` | `voice.png` | 语音输入 |
| `圆形警告.png` | `warning-circle.png` | 异常状态入口、低置信度状态 |
| `知识库.png` | `knowledge-base.png` | 知识库 tab、列表和切换弹层 |
| `dianzan.png` | `thumb-up.png` | 有用和没用反馈 |

## 页面使用规则

- 普通操作图标统一使用中性灰；选中、来源和知识库使用企业蓝 `#1677FF`。
- 低置信度和依据不足使用黄色；无权限、超时、拦截和点踩选中态使用红色。
- 同一操作栏的图标使用相同宽高、透明度和线性风格。问答反馈栏统一为 `28rpx`。
- 点踩图标复用 `thumb-up.png` 并旋转 180 度，不重复维护近似资源。
- 原始 PNG 颜色不一致时，页面内使用 WXSS `filter` 统一颜色；原生 tabBar 不支持页面 WXSS 滤镜。
- 当前 tabBar 复用同一张普通态和选中态图片，选中状态主要由蓝色文字表示。后续如提供成套灰色和蓝色资源，应分别配置 `iconPath` 与 `selectedIconPath`。
- `help.png` 和 `upload-file.png` 已完成规范命名，但当前页面没有对应可用功能，不应为了使用图标而添加无效入口。

## 变更要求

- 新增图标时先确认现有资源是否可复用，再新增文件。
- 替换图标后必须检查所有 WXML、JS 和 `app.json` 引用路径真实存在。
- 在微信开发者工具中至少检查问答、知识库、历史和我的四个主页面。
- 图标用途、命名或颜色规范变化时，同步更新本文件和 `06-handoff-current-task.md`。
