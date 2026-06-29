/**
 * 问答服务
 * 封装问答查询、SSE 流式、会话和反馈接口。
 */

const { post, get, delete: deleteRequest } = require("../utils/request");
const config = require("../config/api");
const storage = require("../utils/storage");
const { normalizeUrl, generateRequestId, BusinessError } = require("../utils/request");
const { createSSEParser, createUTF8ChunkDecoder } = require("../utils/sse");

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
  const chunkDecoder = createUTF8ChunkDecoder();

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
      const remainingText = chunkDecoder.finish();
      if (remainingText) {
        parser.push(remainingText);
      }
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
        // 解码器会保留跨网络分块的 UTF-8 残留字节
        const text = chunkDecoder.push(chunk.data);
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
      chunkDecoder.reset();
      parser.reset();
    },
  };
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
  return deleteRequest(`/api/v1/qa/sessions/${sessionId}`);
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
