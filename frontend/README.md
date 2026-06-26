# 前端目录说明

本目录包含两个前端工程：

- `figma_make/`：Figma Make 生成的 React/Vite 高保真原型源码，只作为视觉、交互和模拟数据来源。
- `wechat_miniprogram/`：后续正式开发使用的微信小程序工程。

## 当前迁移状态

已从 `figma_make` 原型迁移首批原生小程序页面到 `wechat_miniprogram`：

- 问答首页：`miniprogram/pages/chat/index.*`
- 知识库选择：`miniprogram/pages/knowledge/index.*`
- 历史会话：`miniprogram/pages/history/index.*`
- 引用详情：`miniprogram/pages/citation/detail.*`
- 反馈纠错：`miniprogram/pages/feedback/submit.*`
- 我的页：`miniprogram/pages/profile/index.*`
- 异常状态预览：`miniprogram/pages/states/index.*`
- 模拟数据：`miniprogram/utils/mock.js`

当前迁移版本仍使用模拟数据，尚未接入真实后端接口。

## 开发方式

后续主要在以下目录开发：

```powershell
frontend\wechat_miniprogram
```

用微信开发者工具打开该目录进行预览和调试。

`figma_make` 仅在需要回看原型或视觉细节时使用：

```powershell
cd frontend\figma_make
npm install
npm run dev
```
