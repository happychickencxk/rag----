/**
 * 本地 Mock API 服务器。
 * 按前后端接口文档返回统一响应、分页结构、JWT 鉴权和 SSE 数据，
 * 用于微信小程序在真实后端就绪前完成接口验收。
 *
 * 启动：node mock-server/server.js
 */

const http = require("http");

const DEFAULT_PORT = 8000;
const ACCESS_TOKENS = new Set([
  "mock-access-token",
  "mock-access-token-refreshed",
]);
const REFRESH_TOKENS = new Set([
  "mock-refresh-token",
  "mock-refresh-token-refreshed",
]);

function createInitialState() {
  const now = new Date();
  const iso = (offsetDays = 0) =>
    new Date(now.getTime() - offsetDays * 86400000).toISOString();

  const knowledgeBases = [
    {
      kb_id: "kb-hr",
      name: "人事制度库",
      description: "员工手册、考勤制度、薪酬福利规范",
      department_id: "dept-hr",
      department_name: "人力资源部",
      doc_count: 128,
      chunk_count: 2860,
      status: "active",
      visibility: "department",
      permission: "granted",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-06-20T10:00:00Z",
    },
    {
      kb_id: "kb-product",
      name: "产品资料库",
      description: "产品规格、安装手册、技术参数",
      department_id: "dept-product",
      department_name: "产品研发部",
      doc_count: 342,
      chunk_count: 7052,
      status: "active",
      visibility: "company",
      permission: "granted",
      created_at: "2024-01-15T00:00:00Z",
      updated_at: "2024-06-28T08:30:00Z",
    },
    {
      kb_id: "kb-aftersales",
      name: "售后知识库",
      description: "退换货政策、维修流程、售后规范",
      department_id: "dept-service",
      department_name: "客服中心",
      doc_count: 215,
      chunk_count: 4380,
      status: "active",
      visibility: "department",
      permission: "granted",
      created_at: "2024-02-01T00:00:00Z",
      updated_at: "2024-06-25T14:00:00Z",
    },
    {
      kb_id: "kb-tech",
      name: "研发技术库",
      description: "技术架构、API 文档、开发规范",
      department_id: "dept-tech",
      department_name: "技术部",
      doc_count: 489,
      chunk_count: 9860,
      status: "active",
      visibility: "private",
      permission: "denied",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-06-27T09:00:00Z",
    },
  ];

  const citations = [
    {
      chunk_id: "chunk-001",
      doc_id: "doc-employee-handbook",
      doc_name: "员工手册 v4.2",
      kb_id: "kb-hr",
      kb_name: "人事制度库",
      chapter_path: "第3章 > 考勤制度 > 试用期规定",
      content: "试用期员工享有与正式员工同等的请假权利。试用期内请假不直接影响转正考核，但需按规定提前申请并获批准。事假累计超过5天、病假累计超过10天可能影响转正评估。",
      highlight: "试用期内请假不直接影响转正考核",
      similarity_score: 0.92,
      rerank_score: 0.95,
      rank_order: 1,
      permission: "granted",
      updated_at: "2024-06-15T09:00:00Z",
    },
    {
      chunk_id: "chunk-002",
      doc_id: "doc-hr-supplement",
      doc_name: "HR政策补充说明",
      kb_id: "kb-hr",
      kb_name: "人事制度库",
      chapter_path: "附录B > 常见问题解答",
      content: "关于试用期请假：事假累计超过5天、病假累计超过10天可能影响转正评估，建议提前与直属领导沟通。",
      highlight: "事假累计超过5天",
      similarity_score: 0.87,
      rerank_score: 0.81,
      rank_order: 2,
      permission: "granted",
      updated_at: "2024-03-20T09:00:00Z",
    },
    {
      chunk_id: "chunk-003",
      doc_id: "doc-attendance-2024",
      doc_name: "考勤管理制度2024",
      kb_id: "kb-hr",
      kb_name: "人事制度库",
      chapter_path: "第2章 > 请假管理 > 敏感数据",
      content: "该文档片段受权限保护，无法完整展示。",
      highlight: "",
      similarity_score: 0.78,
      rerank_score: 0.72,
      rank_order: 3,
      permission: "restricted",
      updated_at: "2024-02-12T09:00:00Z",
    },
  ];

  const sessions = [
    {
      session_id: "session-001",
      title: "试用期请假是否影响转正",
      kb_id: "kb-hr",
      kb_name: "人事制度库",
      message_count: 3,
      preview: "试用期请假不会直接影响转正...",
      started_at: iso(0),
      ended_at: iso(0),
    },
    {
      session_id: "session-002",
      title: "售后退换货流程是什么",
      kb_id: "kb-aftersales",
      kb_name: "售后知识库",
      message_count: 5,
      preview: "客户在收货7日内可申请无理由退货...",
      started_at: iso(1),
      ended_at: iso(0),
    },
    {
      session_id: "session-003",
      title: "产品安装故障排查步骤",
      kb_id: "kb-product",
      kb_name: "产品资料库",
      message_count: 8,
      preview: "安装失败通常由驱动版本不匹配导致...",
      started_at: iso(2),
      ended_at: iso(1),
    },
    {
      session_id: "session-004",
      title: "如何申请远程办公",
      kb_id: "kb-hr",
      kb_name: "人事制度库",
      message_count: 2,
      preview: "远程办公申请需填写OA表单...",
      started_at: iso(5),
      ended_at: iso(4),
    },
  ];

  return {
    knowledgeBases,
    citations,
    sessions,
    messagesBySession: new Map(),
    feedback: [],
    documents: [],
  };
}

function success(data, message = "操作成功") {
  return { code: 200, message, data };
}

function failure(code, message) {
  return { code, message, data: null };
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

function paginate(records, pageNumber = 1, pageSize = 10) {
  const page = Math.max(Number(pageNumber) || 1, 1);
  const size = Math.max(Number(pageSize) || 10, 1);
  const start = (page - 1) * size;
  return {
    records: records.slice(start, start + size),
    total: records.length,
    page,
    size,
    pages: Math.ceil(records.length / size),
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        resolve({});
      }
    });
  });
}

function parseUrl(req) {
  return new URL(req.url, "http://localhost");
}

function isAuthorized(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return ACCESS_TOKENS.has(token);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSessionMessages(state, sessionId) {
  if (state.messagesBySession.has(sessionId)) {
    return state.messagesBySession.get(sessionId);
  }

  const messages = [
    {
      message_id: "message-user-001",
      session_id: sessionId,
      role: "user",
      content: "试用期请假是否影响转正？",
      citations: [],
      feedback_status: "",
      low_confidence: false,
      status_code: "success",
      created_at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      message_id: "message-assistant-001",
      session_id: sessionId,
      role: "assistant",
      content: "根据人事制度库规定，试用期请假**不会直接影响**转正考核。\n\n但需注意事假和病假的累计天数，并提前与直属领导沟通。",
      citations: state.citations,
      feedback_status: "",
      low_confidence: false,
      status_code: "success",
      created_at: new Date().toISOString(),
    },
  ];
  state.messagesBySession.set(sessionId, messages);
  return messages;
}

function ensureSession(state, kbId, requestedSessionId, question) {
  if (requestedSessionId) {
    const existing = state.sessions.find(
      (item) => item.session_id === requestedSessionId
    );
    if (existing) return existing;
  }

  const sessionId = `session-${Date.now()}`;
  const kb = state.knowledgeBases.find((item) => item.kb_id === kbId);
  const session = {
    session_id: sessionId,
    title: question || "新会话",
    kb_id: kbId,
    kb_name: kb ? kb.name : "",
    message_count: 0,
    preview: "",
    started_at: new Date().toISOString(),
    ended_at: null,
  };
  state.sessions.unshift(session);
  return session;
}

function createHandler(state) {
  return async function handleRequest(req, res) {
    const parsedUrl = parseUrl(req);
    const path = parsedUrl.pathname;
    const method = req.method;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Client-Type,X-Request-Id"
    );

    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      if (path === "/api/v1/auth/wechat-login" && method === "POST") {
        const body = await readBody(req);
        if (!body.code) {
          sendJson(res, 400, failure(400, "微信登录 code 不能为空"));
          return;
        }
        sendJson(res, 200, success({
          user_id: "user-001",
          name: body.nick_name || "体验用户",
          role: "employee",
          is_new_user: false,
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 7200,
        }));
        return;
      }

      if (path === "/api/v1/auth/refresh" && method === "POST") {
        const body = await readBody(req);
        if (!REFRESH_TOKENS.has(body.refresh_token)) {
          sendJson(res, 401, failure(401, "刷新令牌无效或已过期"));
          return;
        }
        sendJson(res, 200, success({
          access_token: "mock-access-token-refreshed",
          refresh_token: "mock-refresh-token-refreshed",
          expires_in: 7200,
        }));
        return;
      }

      if (path.startsWith("/api/v1/") && !isAuthorized(req)) {
        sendJson(res, 401, failure(401, "访问令牌无效或已过期"));
        return;
      }

      if (path === "/api/v1/auth/profile" && method === "GET") {
        sendJson(res, 200, success({
          user_id: "user-001",
          username: "zhangming",
          name: "张明",
          avatar_url: "",
          phone: "13800000000",
          email: "zhangming@example.com",
          department_id: "dept-service",
          department_name: "客服中心",
          role_id: "role-employee",
          role_name: "客服专员",
          status: "active",
          last_login_at: new Date().toISOString(),
          is_new_user: false,
        }));
        return;
      }

      if (path === "/api/v1/auth/logout" && method === "POST") {
        sendJson(res, 200, success(null, "已退出登录"));
        return;
      }

      if (path === "/api/v1/knowledge-bases" && method === "GET") {
        const keyword = parsedUrl.searchParams.get("keyword") || "";
        const departmentId = parsedUrl.searchParams.get("department_id") || "";
        const status = parsedUrl.searchParams.get("status") || "";
        const filtered = state.knowledgeBases.filter((item) => {
          const matchesKeyword =
            !keyword ||
            item.name.includes(keyword) ||
            item.description.includes(keyword);
          const matchesDepartment =
            !departmentId || item.department_id === departmentId;
          const matchesStatus = !status || item.status === status;
          return matchesKeyword && matchesDepartment && matchesStatus;
        });
        sendJson(res, 200, success(paginate(
          filtered,
          parsedUrl.searchParams.get("page"),
          parsedUrl.searchParams.get("size")
        )));
        return;
      }

      const knowledgeMatch = path.match(/^\/api\/v1\/knowledge-bases\/([^/]+)$/);
      if (knowledgeMatch && method === "GET") {
        const kb = state.knowledgeBases.find(
          (item) => item.kb_id === knowledgeMatch[1]
        );
        if (!kb) {
          sendJson(res, 404, failure(404, "知识库不存在"));
          return;
        }
        sendJson(res, 200, success(kb));
        return;
      }

      if (path === "/api/v1/qa/query" && method === "POST") {
        const body = await readBody(req);
        if (!body.kb_id || !body.question) {
          sendJson(res, 400, failure(400, "kb_id 和 question 不能为空"));
          return;
        }

        const session = ensureSession(
          state,
          body.kb_id,
          body.session_id,
          body.question
        );
        const messageId = `message-${Date.now()}`;
        const answerParts = [
          "根据相关制度规定，为您总结如下：\n\n",
          "**1. 试用期请假政策**\n",
          "试用期员工享有与正式员工同等的请假权利。正常的合规请假**不会直接影响**转正考核结果。\n\n",
          "**2. 注意事项**\n",
          "事假累计超过 **5 天**或病假累计超过 **10 天**，可能在转正评估时被纳入参考因素。建议提前与**直属领导**沟通说明情况。\n\n",
          "**3. 请假流程**\n",
          "所有请假须通过 **OA 系统**提前提交申请，经审批通过后方可生效。",
        ];
        const answer = answerParts.join("");
        const messages = getSessionMessages(state, session.session_id);
        messages.push({
          message_id: `message-user-${Date.now()}`,
          session_id: session.session_id,
          role: "user",
          content: body.question,
          citations: [],
          feedback_status: "",
          low_confidence: false,
          status_code: "success",
          created_at: new Date().toISOString(),
        });
        messages.push({
          message_id: messageId,
          session_id: session.session_id,
          role: "assistant",
          content: answer,
          citations: state.citations,
          feedback_status: "",
          low_confidence: false,
          status_code: "success",
          created_at: new Date().toISOString(),
        });
        session.message_count = messages.length;
        session.preview = answer.slice(0, 40);
        session.ended_at = new Date().toISOString();

        if (body.stream === true) {
          res.writeHead(200, {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          });
          for (const part of answerParts) {
            res.write(`data: ${JSON.stringify({
              content: part,
              done: false,
            })}\n\n`);
            await sleep(40);
          }
          res.end(`data: ${JSON.stringify({
            content: "",
            done: true,
            message_id: messageId,
            citations: state.citations,
          })}\n\n`);
          return;
        }

        sendJson(res, 200, success({
          session_id: session.session_id,
          message_id: messageId,
          question: body.question,
          answer,
          content: answer,
          model: "mock-rag-v1",
          latency_ms: 120,
          citations: state.citations,
          low_confidence: false,
        }));
        return;
      }

      if (path === "/api/v1/qa/sessions" && method === "GET") {
        const kbId = parsedUrl.searchParams.get("kb_id") || "";
        const filtered = kbId
          ? state.sessions.filter((item) => item.kb_id === kbId)
          : state.sessions;
        sendJson(res, 200, success(paginate(
          filtered,
          parsedUrl.searchParams.get("page"),
          parsedUrl.searchParams.get("size") || 20
        )));
        return;
      }

      if (path === "/api/v1/qa/sessions" && method === "POST") {
        const body = await readBody(req);
        if (!body.kb_id) {
          sendJson(res, 400, failure(400, "kb_id 不能为空"));
          return;
        }
        const session = ensureSession(state, body.kb_id, "", body.title);
        sendJson(res, 200, success(session));
        return;
      }

      const messageListMatch = path.match(
        /^\/api\/v1\/qa\/sessions\/([^/]+)\/messages$/
      );
      if (messageListMatch && method === "GET") {
        const sessionId = messageListMatch[1];
        const session = state.sessions.find(
          (item) => item.session_id === sessionId
        );
        if (!session) {
          sendJson(res, 404, failure(404, "会话不存在"));
          return;
        }
        sendJson(res, 200, success(paginate(
          getSessionMessages(state, sessionId),
          parsedUrl.searchParams.get("page"),
          parsedUrl.searchParams.get("size") || 50
        )));
        return;
      }

      const sessionMatch = path.match(/^\/api\/v1\/qa\/sessions\/([^/]+)$/);
      if (sessionMatch && method === "DELETE") {
        const index = state.sessions.findIndex(
          (item) => item.session_id === sessionMatch[1]
        );
        if (index === -1) {
          sendJson(res, 404, failure(404, "会话不存在"));
          return;
        }
        state.sessions.splice(index, 1);
        state.messagesBySession.delete(sessionMatch[1]);
        sendJson(res, 200, success(null, "已删除"));
        return;
      }

      const citationsMatch = path.match(
        /^\/api\/v1\/qa\/sessions\/([^/]+)\/messages\/([^/]+)\/citations$/
      );
      if (citationsMatch && method === "GET") {
        sendJson(res, 200, success(state.citations));
        return;
      }

      const feedbackMatch = path.match(
        /^\/api\/v1\/qa\/sessions\/([^/]+)\/messages\/([^/]+)\/feedback$/
      );
      if (feedbackMatch && method === "POST") {
        const body = await readBody(req);
        const allowed = ["like", "dislike", "no_citation"];
        if (!allowed.includes(body.feedback_type)) {
          sendJson(res, 400, failure(400, "feedback_type 不合法"));
          return;
        }
        state.feedback.push({
          session_id: feedbackMatch[1],
          message_id: feedbackMatch[2],
          feedback_type: body.feedback_type,
          description: body.description || "",
          created_at: new Date().toISOString(),
        });
        sendJson(res, 200, success(null, "反馈已提交"));
        return;
      }

      if (path === "/api/v1/documents" && method === "GET") {
        sendJson(res, 200, success(paginate(
          state.documents,
          parsedUrl.searchParams.get("page"),
          parsedUrl.searchParams.get("size")
        )));
        return;
      }

      if (path === "/api/v1/documents/upload" && method === "POST") {
        await readBody(req);
        const document = {
          doc_id: `document-${Date.now()}`,
          filename: "mock-upload-file",
          parse_status: "processing",
          created_at: new Date().toISOString(),
        };
        state.documents.unshift(document);
        sendJson(res, 200, success(document, "上传成功，解析中"));
        return;
      }

      sendJson(res, 404, failure(404, "接口不存在"));
    } catch (error) {
      console.error("[mock] 请求处理失败:", error);
      if (!res.headersSent) {
        sendJson(res, 500, failure(500, "服务器内部错误"));
      } else {
        res.end();
      }
    }
  };
}

function createMockServer() {
  const state = createInitialState();
  const server = http.createServer(createHandler(state));
  server.mockState = state;
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const server = createMockServer();
  server.listen(port, () => {
    console.log(`Mock API 已启动：http://127.0.0.1:${port}`);
    console.log("接口前缀：/api/v1");
  });
}

module.exports = {
  createMockServer,
  createInitialState,
};
