/**
 * API 配置
 * 集中管理 API 地址、超时和数据源模式。
 */

// API 源地址，不包含 /api/v1 后缀
// 开发环境默认值，实际部署时替换为真实地址
const API_ORIGIN = "http://localhost:8000";

// 数据源模式："mock" 使用本地模拟数据，"api" 使用真实后端
const DATA_SOURCE = "api";

// 请求超时（毫秒）
const REQUEST_TIMEOUT = 30000;

// SSE 请求超时（毫秒），流式问答需要更长超时
const SSE_TIMEOUT = 120000;

// 文件上传超时（毫秒）
const UPLOAD_TIMEOUT = 60000;

// Token 过期提前刷新时间（秒），早于实际过期时间刷新
const TOKEN_REFRESH_MARGIN = 300;

// 最大重试次数（仅 401 刷新后的重放）
const MAX_RETRY = 1;

module.exports = {
  API_ORIGIN,
  DATA_SOURCE,
  REQUEST_TIMEOUT,
  SSE_TIMEOUT,
  UPLOAD_TIMEOUT,
  TOKEN_REFRESH_MARGIN,
  MAX_RETRY,
};
