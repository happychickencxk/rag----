/**
 * 极简 Mock 服务器
 * 模拟后端 API 响应，用于小程序前端联调测试。
 *
 * 启动方式：
 *   node mock-server/server.js
 *
 * 服务地址：http://localhost:8000
 * 小程序 config/api.js 中的 API_ORIGIN 已指向此地址，无需修改。
 */

const http = require("http");

const PORT = 8000;

// ===== Mock 数据 =====

const knowledgeBases = [
  { id: "kb-hr", name: "人事制度库", description: "员工手册、考勤制度、薪酬福利规范", department: "人力资源部", doc_count: 128, status: "active", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-06-20T10:00:00Z" },
  { id: "kb-product", name: "产品资料库", description: "产品规格、安装手册、技术参数", department: "产品研发部", doc_count: 342, status: "active", created_at: "2024-01-15T00:00:00Z", updated_at: "2024-06-28T08:30:00Z" },
  { id: "kb-aftersales", name: "售后知识库", description: "退换货政策、维修流程、售后规范", department: "客服中心", doc_count: 215, status: "active", created_at: "2024-02-01T00:00:00Z", updated_at: "2024-06-25T14:00:00Z" },
  { id: "kb-tech", name: "研发技术库", description: "技术架构、API 文档、开发规范", department: "技术部", doc_count: 489, status: "active", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-06-27T09:00:00Z" },
];

const sessions = [
  { id: "s1", title: "试用期请假是否影响转正", kb_id: "kb-hr", kb_name: "人事制度库", message_count: 3, preview: "试用期请假不会直接影响转正...", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "s2", title: "售后退换货流程是什么", kb_id: "kb-aftersales", kb_name: "售后知识库", message_count: 5, preview: "客户在收货7日内可申请无理由退货...", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "s3", title: "产品安装故障排查步骤", kb_id: "kb-product", kb_name: "产品资料库", message_count: 8, preview: "安装失败通常由驱动版本不匹配导致...", created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "s4", title: "如何申请远程办公", kb_id: "kb-hr", kb_name: "人事制度库", message_count: 2, preview: "远程办公申请需填写OA表单...", created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date(Date.now() - 86400000 * 4).toISOString() },
];

const citations = [
  { id: "c1", document_name: "员工手册 v4.2", kb_name: "人事制度库", chunk_path: "第3章 > 考勤制度 > 试用期规定", updated_at: "2024-06-15", similarity: "0.92", rerank_score: "0.95", excerpt: "试用期员工享有与正式员工同等的请假权利。试用期内请假不直接影响转正考核，但需按规定提前申请并获批准。事假累计超过5天、病假累计超过10天可能影响转正评估。", highlight: "试用期内请假不直接影响转正考核", permission: "granted" },
  { id: "c2", document_name: "HR政策补充说明", kb_name: "人事制度库", chunk_path: "附录B > 常见问题解答", updated_at: "2024-03-20", similarity: "0.87", rerank_score: "0.81", excerpt: "关于试用期请假：事假累计超过5天、病假累计超过10天可能影响转正评估，建议提前与直属领导沟通。", highlight: "事假累计超过5天", permission: "granted" },
  { id: "c3", document_name: "考勤管理制度2024", kb_name: "人事制度库", chunk_path: "第2章 > 请假管理 > 敏感数据", similarity: "0.78", rerank_score: "0.72", excerpt: "该文档片段受权限保护，无法完整展示。", permission: "restricted" },
];

// ===== 响应工具函数 =====

function ok(data, message = "操作成功") {
  return JSON.stringify({ code: 200, message, data });
}

function fail(code, message) {
  return JSON.stringify({ code, message, data: null });
}

function page(records, page = 1, size = 10) {
  return {
    records,
    total: records.length,
    page,
    size,
    pages: Math.ceil(records.length / size),
  };
}

function jsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function getQuery(url) {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  const qs = url.substring(idx + 1);
  const params = {};
  qs.split("&").forEach((pair) => {
    const [k, v] = pair.split("=");
    params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  });
  return params;
}

// ===== 路由处理 =====

async function handleRequest(req, res) {
  const url = req.url.split("?")[0];
  const method = req.method;
  const query = getQuery(req.url);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Client-Type,X-Request-Id");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    // ===== 认证 =====
    if (url === "/api/v1/auth/wechat-login" && method === "POST") {
      const body = await jsonBody(req);
      console.log("[mock] 微信登录, code:", body.code);
      res.end(ok({
        user_id: "u-001",
        name: body.nick_name || "体验用户",
        role: "employee",
        is_new_user: false,
        access_token: "mock-access-token-xxx",
        refresh_token: "mock-refresh-token-xxx",
        expires_in: 7200,
      }));
      return;
    }

    if (url === "/api/v1/auth/refresh" && method === "POST") {
      console.log("[mock] 刷新Token");
      res.end(ok({
        access_token: "mock-access-token-new",
        refresh_token: "mock-refresh-token-new",
        expires_in: 7200,
      }));
      return;
    }

    if (url === "/api/v1/auth/profile" && method === "GET") {
      console.log("[mock] 获取用户信息");
      res.end(ok({
        user_id: "u-001",
        name: "张明",
        avatar_url: "",
        department: "客服中心",
        role: "客服专员",
        is_new_user: false,
      }));
      return;
    }

    if (url === "/api/v1/auth/logout" && method === "POST") {
      console.log("[mock] 退出登录");
      res.end(ok(null, "已退出"));
      return;
    }

    // ===== 知识库 =====
    if (url === "/api/v1/knowledge-bases" && method === "GET") {
      const keyword = query.keyword || "";
      let list = knowledgeBases;
      if (keyword) {
        list = list.filter((kb) => kb.name.includes(keyword) || kb.description.includes(keyword));
      }
      console.log("[mock] 知识库列表, keyword:", keyword, "count:", list.length);
      res.end(ok(page(list, Number(query.page) || 1, Number(query.size) || 10)));
      return;
    }

    if (url.startsWith("/api/v1/knowledge-bases/") && method === "GET") {
      const kbId = url.split("/api/v1/knowledge-bases/")[1];
      const kb = knowledgeBases.find((k) => k.id === kbId);
      console.log("[mock] 知识库详情:", kbId);
      res.end(kb ? ok(kb) : fail(404, "知识库不存在"));
      return;
    }

    // ===== 问答 =====
    if (url === "/api/v1/qa/query" && method === "POST") {
      const body = await jsonBody(req);
      console.log("[mock] 问答请求, kb_id:", body.kb_id, "stream:", body.stream);

      if (body.stream) {
        // SSE 流式响应
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        });

        const answerParts = [
          "根据相关制度规定，为您总结如下：\n\n",
          "**1. 试��期请假政策**\n",
          "试用期员工享有与正式员工同等的请假权利。正常的合规请假**不会直接影响**转正考核结果。\n\n",
          "**2. 注意事项**\n",
          "事假累计超过 **5 天**或病假累计超过 **10 天**，可能在转正评估时被纳入参考因素。建议提前与**直属领导**沟通说明情况。\n\n",
          "**3. 请假流程**\n",
          "所有请假须通过 **OA 系统**提前提交申请，经审批通过后方可生效。紧急情况可事后补办，但需提供相关证明。\n\n",
          "建议在试用期内保持良好的出勤记录。如有特殊情况，请及时与 HR 沟通。",
        ];

        for (const part of answerParts) {
          res.write(`data: ${JSON.stringify({ content: part, done: false })}\n\n`);
          await sleep(150);
        }

        // 完成事件
        res.write(
          `data: ${JSON.stringify({
            content: "",
            done: true,
            message_id: "msg-" + Date.now(),
            citations: citations,
          })}\n\n`
        );
        res.end();
      } else {
        // 非流式响应
        await sleep(300);
        res.end(
          ok({
            message_id: "msg-" + Date.now(),
            session_id: body.session_id || "s-new",
            content: "根据相关制度规定，试用期请假不会直接影响转正，但需注意累计天数。建议提前与直属领导沟通。完整回答请使用流式模式查看。",
            citations: citations,
            low_confidence: false,
            model_name: "DeepSeek-V4",
            cost_ms: 1250,
          })
        );
      }
      return;
    }

    // ===== 会话 =====
    if (url === "/api/v1/qa/sessions" && method === "GET") {
      console.log("[mock] 会话列表");
      res.end(ok(page(sessions, Number(query.page) || 1, Number(query.size) || 20)));
      return;
    }

    if (url === "/api/v1/qa/sessions" && method === "POST") {
      const body = await jsonBody(req);
      console.log("[mock] 创建会话, kb_id:", body.kb_id);
      res.end(ok({ id: "s-new-" + Date.now(), session_id: "s-new-" + Date.now(), kb_id: body.kb_id }));
      return;
    }

    if (url.match(/^\/api\/v1\/qa\/sessions\/[^/]+\/messages$/) && method === "GET") {
      const sessionId = url.split("/")[5];
      console.log("[mock] 会话消息, session:", sessionId);
      res.end(
        ok(
          page([
            { id: "msg-u1", session_id: sessionId, role: "user", content: "试用期请假是否影响转正？", created_at: new Date(Date.now() - 60000).toISOString() },
            { id: "msg-a1", session_id: sessionId, role: "assistant", content: "根据人事制度库规定，试用期请假**不会直接影响**转正考核。\n\n但需注意：\n- 事假累计超过5天可能影响评估\n- 建议提前与直属领导沟通\n\n可通过OA系统提交请假申请。", citations: citations, feedback_status: "", low_confidence: false, created_at: new Date().toISOString() },
          ], 1, 50)
        )
      );
      return;
    }

    if (url.match(/^\/api\/v1\/qa\/sessions\/[^/]+$/) && method === "DELETE") {
      const sessionId = url.split("/")[5];
      console.log("[mock] 删除会话:", sessionId);
      res.end(ok(null, "已删除"));
      return;
    }

    // ===== 引用 =====
    if (url.match(/^\/api\/v1\/qa\/sessions\/[^/]+\/messages\/[^/]+\/citations$/) && method === "GET") {
      console.log("[mock] 引用列表");
      res.end(ok(citations));
      return;
    }

    // ===== 反馈 =====
    if (url.match(/^\/api\/v1\/qa\/sessions\/[^/]+\/messages\/[^/]+\/feedback$/) && method === "POST") {
      const body = await jsonBody(req);
      console.log("[mock] 反馈提交, type:", body.feedback_type, "desc:", body.description);
      res.end(ok(null, "反馈已提交"));
      return;
    }

    // ===== 文档 =====
    if (url === "/api/v1/documents" && method === "GET") {
      console.log("[mock] 文档列表");
      res.end(ok(page([], 1, 10)));
      return;
    }

    if (url === "/api/v1/documents/upload" && method === "POST") {
      console.log("[mock] 文件上传（模拟成功）");
      res.end(ok({ id: "doc-new-" + Date.now(), status: "processing" }, "上传成功，解析中"));
      return;
    }

    // 未匹配路由
    console.log("[mock] 404:", method, url);
    res.writeHead(404);
    res.end(fail(404, "接口不存在"));
  } catch (err) {
    console.error("[mock] 错误:", err);
    res.writeHead(500);
    res.end(fail(500, "服务器内部错误"));
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== 启动服务器 =====

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log("============================================");
  console.log("  Mock API 服务器已启动");
  console.log("  地址: http://localhost:" + PORT);
  console.log("  接口前缀: /api/v1/");
  console.log("  按 Ctrl+C 停止服务器");
  console.log("============================================");
  console.log("");
  console.log("已注册接口:");
  console.log("  POST /api/v1/auth/wechat-login");
  console.log("  POST /api/v1/auth/refresh");
  console.log("  GET  /api/v1/auth/profile");
  console.log("  POST /api/v1/auth/logout");
  console.log("  GET  /api/v1/knowledge-bases");
  console.log("  GET  /api/v1/knowledge-bases/:id");
  console.log("  POST /api/v1/qa/query        (支持 stream=true SSE)");
  console.log("  GET  /api/v1/qa/sessions");
  console.log("  POST /api/v1/qa/sessions");
  console.log("  GET  /api/v1/qa/sessions/:id/messages");
  console.log("  DELETE /api/v1/qa/sessions/:id");
  console.log("  GET  /api/v1/qa/sessions/:id/messages/:id/citations");
  console.log("  POST /api/v1/qa/sessions/:id/messages/:id/feedback");
  console.log("  GET  /api/v1/documents");
  console.log("  POST /api/v1/documents/upload");
  console.log("");
});
