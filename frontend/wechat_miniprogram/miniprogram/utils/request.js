/**
 * 统一请求封装
 * 提供普通 JSON 请求、统一响应解析、错误分类和 401 刷新队列。
 */

const config = require("../config/api");
const storage = require("./storage");

/**
 * 生成请求追踪 ID
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * 规范化请求路径，确保只保留一次 /api/v1。
 * 如果 API_ORIGIN 已包含 /api/v1，路径不应再重复。
 * 当前约定：API_ORIGIN 不含 /api/v1，请求路径以 /api/v1 开头。
 */
function normalizeUrl(path) {
  const rawOrigin = String(config.API_ORIGIN || "").replace(/\/+$/, "");
  const origin = rawOrigin.replace(/\/api\/v1$/, "");
  let cleanPath = String(path || "");
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }
  cleanPath = cleanPath.replace(/^(\/api\/v1)+/, "/api/v1");
  return `${origin}${cleanPath}`;
}

// ===== 401 刷新队列 =====
let refreshPromise = null;

/**
 * 刷新 Token，使用共享 Promise 确保并发 401 只调用一次 refresh。
 * @returns {Promise<boolean>} 刷新成功返回 true
 */
function refreshToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshTokenValue = storage.getRefreshToken();
  if (!refreshTokenValue) {
    return Promise.resolve(false);
  }

  refreshPromise = new Promise((resolve) => {
    wx.request({
      url: normalizeUrl("/api/v1/auth/refresh"),
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "X-Client-Type": "wechat",
      },
      data: { refresh_token: refreshTokenValue },
      timeout: config.REQUEST_TIMEOUT,
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const d = res.data.data;
          storage.saveTokens(d.access_token, d.refresh_token, d.expires_in);
          resolve(true);
        } else {
          storage.clearAllAuth();
          resolve(false);
        }
      },
      fail() {
        storage.clearAllAuth();
        resolve(false);
      },
    });
  });

  // 无论成功失败，完成后清除共享 Promise
  refreshPromise.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * 业务错误类，用于区分网络错误和业务错误。
 */
class BusinessError extends Error {
  constructor(code, message, data) {
    super(message);
    this.name = "BusinessError";
    this.code = code;
    this.data = data;
  }
}

/**
 * 从 HTTP 响应中提取业务数据或抛出业务错误。
 * 统一响应格式：{ code, message, data }
 */
function parseResponse(res) {
  const { statusCode, data } = res;

  // HTTP 层错误映射
  if (statusCode === 401) {
    const err = new BusinessError(401, "登录已过期，请重新登录");
    err.httpStatus = 401;
    throw err;
  }
  if (statusCode === 403) {
    const err = new BusinessError(
      403,
      (data && data.message) || "无访问权限",
      data && data.data
    );
    err.httpStatus = 403;
    throw err;
  }
  if (statusCode === 404) {
    const err = new BusinessError(404, "资源不存在或已失效");
    err.httpStatus = 404;
    throw err;
  }
  if (statusCode === 409) {
    const err = new BusinessError(409, "资源冲突");
    err.httpStatus = 409;
    throw err;
  }
  if (statusCode === 413) {
    const err = new BusinessError(413, "文件超过大小限制");
    err.httpStatus = 413;
    throw err;
  }
  if (statusCode === 422) {
    const err = new BusinessError(
      422,
      (data && data.message) || "请求参数不符合接口要求",
      data && data.data
    );
    err.httpStatus = 422;
    throw err;
  }
  if (statusCode === 429) {
    const err = new BusinessError(429, "请求过于频繁，请稍后重试");
    err.httpStatus = 429;
    throw err;
  }
  if (statusCode === 500) {
    const err = new BusinessError(500, "服务异常，请稍后重试");
    err.httpStatus = 500;
    throw err;
  }
  if (statusCode === 503) {
    const err = new BusinessError(503, "知识库或模型服务暂不可用");
    err.httpStatus = 503;
    throw err;
  }
  if (statusCode < 200 || statusCode >= 300) {
    const err = new BusinessError(statusCode, `请求失败（${statusCode}）`);
    err.httpStatus = statusCode;
    throw err;
  }

  // 业务层错误：HTTP 200 但 code 非 200
  if (data && typeof data.code !== "undefined" && data.code !== 200) {
    const err = new BusinessError(data.code, data.message || "操作失败", data.data);
    err.httpStatus = statusCode;
    throw err;
  }

  // 返回 data 字段（可能是分页结构或普通对象）
  return data ? data.data : null;
}

/**
 * 发起普通 JSON 请求。
 * 自动附加 Authorization、X-Client-Type、X-Request-Id。
 * 401 时自动刷新 Token 并重放一次。
 *
 * @param {object} opts
 * @param {string} opts.url - 请求路径，以 /api/v1/ 开头
 * @param {string} [opts.method="GET"]
 * @param {object} [opts.data]
 * @param {object} [opts.header]
 * @param {number} [opts.timeout]
 * @param {boolean} [opts.skipAuth] - 不携带 Authorization（登录/刷新用）
 * @returns {Promise<any>} 解析后的业务 data
 */
function request(opts) {
  const {
    url,
    method = "GET",
    data,
    header = {},
    timeout = config.REQUEST_TIMEOUT,
    skipAuth = false,
  } = opts;

  const headers = { ...header };
  let retryCount = 0;

  if (!skipAuth) {
    const token = storage.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  headers["X-Client-Type"] = "wechat";
  headers["X-Request-Id"] = generateRequestId();

  // 非上传场景默认 Content-Type
  if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return new Promise((resolve, reject) => {
    function doRequest() {
      wx.request({
        url: normalizeUrl(url),
        method,
        data,
        header: headers,
        timeout,
        success(res) {
          try {
            resolve(parseResponse(res));
          } catch (e) {
            // 401 时尝试刷新 Token 并重放
            if (e.httpStatus === 401 && !skipAuth) {
              if (retryCount >= config.MAX_RETRY) {
                emitAuthExpired();
                reject(e);
                return;
              }
              retryCount += 1;
              refreshToken().then((ok) => {
                if (ok) {
                  // 刷新成功，更新 header 中的 Token 并重放一次
                  const newToken = storage.getAccessToken();
                  if (newToken) {
                    headers["Authorization"] = `Bearer ${newToken}`;
                  }
                  doRequest();
                } else {
                  // 刷新失败，通知登录失效
                  emitAuthExpired();
                  reject(e);
                }
              });
              return;
            }
            reject(e);
          }
        },
        fail(err) {
          // 网络超时、断网等
          let message = "网络连接失败";
          if (err.errMsg) {
            if (err.errMsg.includes("timeout")) {
              message = "请求超时，请检查网络后重试";
            } else if (err.errMsg.includes("fail")) {
              message = "网络异常，请检查网络连接";
            }
          }
          const bizErr = new BusinessError(-1, message);
          bizErr.networkError = true;
          bizErr.originalError = err;
          reject(bizErr);
        },
      });
    }

    doRequest();
  });
}

// ===== 登录失效通知 =====
let authExpiredCallbacks = [];

function onAuthExpired(callback) {
  authExpiredCallbacks.push(callback);
}

function emitAuthExpired() {
  storage.clearAllAuth();
  authExpiredCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      // 忽略回调异常
    }
  });
}

module.exports = {
  request,
  get: (url, data, opts) => request({ ...opts, url, method: "GET", data }),
  post: (url, data, opts) => request({ ...opts, url, method: "POST", data, ...opts }),
  put: (url, data, opts) => request({ ...opts, url, method: "PUT", data, ...opts }),
  delete: (url, data, opts) => request({ ...opts, url, method: "DELETE", data, ...opts }),
  del: (url, data, opts) => request({ ...opts, url, method: "DELETE", data, ...opts }),
  BusinessError,
  generateRequestId,
  normalizeUrl,
  refreshToken,
  onAuthExpired,
  emitAuthExpired,
};
