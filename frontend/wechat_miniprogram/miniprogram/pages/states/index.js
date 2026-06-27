/**
 * 异常状态预览页
 * 仅用于开发阶段验证各种异常状态的 UI 展示，不是正式业务页面。
 * 数据来源通过显式数据源模式管理。
 */
const config = require("../../config/api");

// 状态卡片数据：各页面已内联处理对应状态，此处仅保留预览
const previewCards = [
  { type: "loading", icon: "/images/icons/regenerate.png", title: "AI 正在检索企业知识库", desc: "正在匹配可访问文档片段，请稍候。" },
  { type: "streaming", icon: "/images/icons/ai-assistant.png", title: "正在基于知识库生成回答", desc: "已找到相关引用，正在流式输出。" },
  { type: "no-evidence", icon: "/images/icons/warning-triangle.png", title: "未找到足够依据", desc: "建议换一种问法或切换知识库。" },
  { type: "low-confidence", icon: "/images/icons/warning-circle.png", title: "回答置信度较低", desc: "请结合引用来源人工确认。" },
  { type: "no-permission", icon: "/images/icons/no-permission.png", title: "无访问权限", desc: "你无权访问该知识库或文档片段。" },
  { type: "timeout", icon: "/images/icons/timeout.png", title: "模型服务响应超时", desc: "可稍后重试。" },
  { type: "blocked", icon: "/images/icons/blocked.png", title: "内容已拦截", desc: "问题包含敏感内容，系统已拦截。" },
  { type: "empty-history", icon: "/images/icons/history.png", title: "暂无历史会话", desc: "去提问后记录会展示在这里。" },
  { type: "empty-kb", icon: "/images/icons/knowledge-base.png", title: "暂无可访问知识库", desc: "请联系管理员配置权限。" },
];

Page({
  data: {
    statusCards: config.DATA_SOURCE === "mock" ? previewCards : [],
  },
});
