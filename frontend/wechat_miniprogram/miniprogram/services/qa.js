/**
 * 问答服务
 * 封装问答查询、SSE 流式、会话和反馈接口。
 */

const { post, get, del } = require("../utils/request");
const config = require("../config/api");
const storage = require("../utils/storage");
const { normalizeUrl, generateRequestId, BusinessError } = require("../utils/request");
const { createSSEParser } = require("../utils/sse");

/**
 * 非流式问答。
 * @param {object} params
 * @param {string} params.kbId - 知识库 ID
 * @param {string} params.question - 问题
 * @param {string} [params.sessionId] - 会话 ID
 * @returns {Promise<object>} 回答结果
 */
async function query(params) {
  const { kbId, question, sessionId } = params;
  const data = {
    kb_id: kbId,
    question: question,
    stream: false,
  };
  if (sessionId) {
    data.session_id = sessionId;
  }
  return post("/api/v1/qa/query", data);
}

/**
 * SSE 流式问答。
 * 使用 wx.request 的 enableChunked 能力实现 POST SSE。
 *
 * @param {object} params
 * @param {string} params.kbId
 * @param {string} params.question
 * @param {string} [params.sessionId]
 * @param {function} params.onText - 收到文本追加回调 (content: string) => void
 * @param {function} params.onDone - 完成回调 (result: { message_id, citations }) => void
 * @param {function} params.onError - 错误回调 (error: Error) => void
 * @returns {object} { abort: function } - 返回取消函数
 */
function querySSE(params) {
  const { kbId, question, sessionId, onText, onDone, onError } = params;

  const data = {
    kb_id: kbId,
    question: question,
    stream: true,
  };
  if (sessionId) {
    data.session_id = sessionId;
  }

  const token = storage.getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    "X-Client-Type": "wechat",
    "X-Request-Id": generateRequestId(),
    "Accept": "text/event-stream",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let aborted = false;
  let requestTask = null;

  const parser = createSSEParser({
    onText(content) {
      if (!aborted && onText) {
        onText(content);
      }
    },
    onDone(result) {
      if (!aborted && onDone) {
        onDone(result);
      }
    },
    onError(err) {
      // SSE 解析错误不影响流式继续
      console.warn("[SSE] 解析警告:", err);
    },
  });

  // 使用 wx.request 的 enableChunked 能力
  requestTask = wx.request({
    url: normalizeUrl("/api/v1/qa/query"),
    method: "POST",
    data,
    header: headers,
    timeout: config.SSE_TIMEOUT,
    enableChunked: true,
    responseType: "text",
    success(res) {
      if (aborted) return;
      // 如果服务器返回了非 200，处理错误
      if (res.statusCode !== 200) {
        if (onError) {
          const err = new BusinessError(res.statusCode, `请求失败（${res.statusCode}）`);
          err.httpStatus = res.statusCode;
          onError(err);
        }
        return;
      }
      // 确保处理完所有剩余数据
      parser.finish();
    },
    fail(err) {
      if (aborted) return;
      if (onError) {
        let message = "流式请求失败";
        if (err.errMsg) {
          if (err.errMsg.includes("timeout")) {
            message = "请求超时，模型响应过慢";
          } else if (err.errMsg.includes("abort")) {
            // 主动取消，不报错
            return;
          } else {
            message = "网络异常，流式请求中断";
          }
        }
        onError(new Error(message));
      }
    },
  });

  // 监听分块数据
  if (requestTask && requestTask.onChunkReceived) {
    requestTask.onChunkReceived((chunk) => {
      if (aborted) return;
      try {
        // chunk.data 可能是 ArrayBuffer 或文本
        let text = "";
        if (typeof chunk.data === "string") {
          text = chunk.data;
        } else if (chunk.data instanceof ArrayBuffer) {
          // 使用 TextDecoder 处理 UTF-8
          text = decodeUTF8(chunk.data);
        } else {
          text = String(chunk.data);
        }
        parser.push(text);
      } catch (e) {
        console.warn("[SSE] chunk 处理警告:", e);
      }
    });
  }

  return {
    abort() {
      aborted = true;
      if (requestTask) {
        requestTask.abort();
      }
      parser.reset();
    },
  };
}

/**
 * 解码 UTF-8 ArrayBuffer 为字符串。
 * 处理可能被截断的多字节字符。
 */
function decodeUTF8(buffer) {
  // 微信小程序中，优先使用 TextDecoder
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder("utf-8").decode(buffer);
  }
  // 回退方案：使用 String.fromCharCode
  const bytes = new Uint8Array(buffer);
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
      i += 1;
    } else if (byte < 0xE0) {
      result += String.fromCharCode(((byte & 0x1F) << 6) | (bytes[i + 1] & 0x3F));
      i += 2;
    } else if (byte < 0xF0) {
      result += String.fromCharCode(
        ((byte & 0x0F) << 12) |
          ((bytes[i + 1] & 0x3F) << 6) |
          (bytes[i + 2] & 0x3F)
      );
      i += 3;
    } else {
      // 四字节字符用两个 charCode 表示
      const cp =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3F) << 12) |
        ((bytes[i + 2] & 0x3F) << 6) |
        (bytes[i + 3] & 0x3F);
      result += String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10));
      result += String.fromCharCode(0xDC00 + ((cp - 0x10000) & 0x3FF));
      i += 4;
    }
  }
  return result;
}

// ===== 会话管理 =====

/**
 * 获取会话列表。
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.size=20]
 * @param {string} [params.kbId]
 * @returns {Promise<object>}
 */
async function getSessions(params) {
  const query = {};
  if (params) {
    if (params.page) query.page = params.page;
    if (params.size) query.size = params.size;
    if (params.kbId) query.kb_id = params.kbId;
  }
  return get("/api/v1/qa/sessions", query);
}

/**
 * 创建新会话。
 * @param {string} kbId
 * @returns {Promise<object>}
 */
async function createSession(kbId) {
  return post("/api/v1/qa/sessions", { kb_id: kbId });
}

/**
 * 获取会话消息列表。
 * @param {string} sessionId
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.size=50]
 * @returns {Promise<object>}
 */
async function getMessages(sessionId, params) {
  const query = {};
  if (params) {
    if (params.page) query.page = params.page;
    if (params.size) query.size = params.size;
  }
  return get(`/api/v1/qa/sessions/${sessionId}/messages`, query);
}

/**
 * 删除会话。
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
  return del(`/api/v1/qa/sessions/${sessionId}`);
}

// ===== 引用 =====

/**
 * 获取消息的引用列表。
 * @param {string} sessionId
 * @param {string} messageId
 * @returns {Promise<object>}
 */
async function getCitations(sessionId, messageId) {
  return get(
    `/api/v1/qa/sessions/${sessionId}/messages/${messageId}/citations`
  );
}

// ===== 反馈 =====

/**
 * 提交反馈。
 * @param {string} sessionId
 * @param {string} messageId
 * @param {string} feedbackType - like / dislike / no_citation
 * @param {string} [description]
 * @returns {Promise<object>}
 */
async function submitFeedback(sessionId, messageId, feedbackType, description) {
  const data = { feedback_type: feedbackType };
  if (description) {
    data.description = description;
  }
  return post(
    `/api/v1/qa/sessions/${sessionId}/messages/${messageId}/feedback`,
    data
  );
}

module.exports = {
  query,
  querySSE,
  getSessions,
  createSession,
  getMessages,
  deleteSession,
  getCitations,
  submitFeedback,
};
