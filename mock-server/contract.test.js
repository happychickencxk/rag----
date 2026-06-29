/**
 * Mock 服务契约验收。
 * 直接启动随机端口，验证统一响应、鉴权、核心字段、SSE 和会话闭环。
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const { createMockServer } = require("./server");

test("Mock API 满足小程序核心接口契约", async (t) => {
  const server = createMockServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  let accessToken = "";

  async function call(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-Client-Type": "wechat",
      ...(options.headers || {}),
    };
    if (accessToken && options.auth !== false) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${origin}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    return { response, body, contentType };
  }

  const unauthorized = await call("/api/v1/auth/profile", { auth: false });
  assert.equal(unauthorized.response.status, 401);
  assert.equal(unauthorized.body.code, 401);

  const login = await call("/api/v1/auth/wechat-login", {
    method: "POST",
    auth: false,
    body: { code: "mock-wx-code" },
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.body.code, 200);
  assert.ok(login.body.data.user_id);
  assert.ok(login.body.data.access_token);
  assert.ok(login.body.data.refresh_token);
  assert.equal(login.body.data.expires_in, 7200);
  accessToken = login.body.data.access_token;

  const profile = await call("/api/v1/auth/profile");
  assert.equal(profile.body.code, 200);
  for (const field of [
    "user_id",
    "name",
    "department_id",
    "department_name",
    "role_id",
    "role_name",
    "status",
    "last_login_at",
  ]) {
    assert.ok(field in profile.body.data, `profile 缺少 ${field}`);
  }

  const knowledge = await call("/api/v1/knowledge-bases?page=1&size=10");
  assert.equal(knowledge.body.code, 200);
  assert.ok(Array.isArray(knowledge.body.data.records));
  assert.equal(knowledge.body.data.page, 1);
  assert.ok(knowledge.body.data.total >= 1);
  for (const field of [
    "kb_id",
    "name",
    "description",
    "department_id",
    "department_name",
    "doc_count",
    "chunk_count",
    "status",
    "updated_at",
  ]) {
    assert.ok(field in knowledge.body.data.records[0], `知识库缺少 ${field}`);
  }

  const nonStream = await call("/api/v1/qa/query", {
    method: "POST",
    body: {
      kb_id: "kb-hr",
      question: "试用期请假是否影响转正？",
      stream: false,
    },
  });
  assert.equal(nonStream.body.code, 200);
  for (const field of [
    "session_id",
    "message_id",
    "question",
    "answer",
    "model",
    "latency_ms",
    "citations",
  ]) {
    assert.ok(field in nonStream.body.data, `非流式回答缺少 ${field}`);
  }

  const citation = nonStream.body.data.citations[0];
  for (const field of [
    "chunk_id",
    "doc_id",
    "doc_name",
    "chapter_path",
    "content",
    "similarity_score",
    "rerank_score",
    "rank_order",
  ]) {
    assert.ok(field in citation, `引用缺少 ${field}`);
  }

  const stream = await call("/api/v1/qa/query", {
    method: "POST",
    body: {
      kb_id: "kb-hr",
      question: "请流式回答试用期政策",
      stream: true,
    },
  });
  assert.match(stream.contentType, /text\/event-stream/);
  assert.match(stream.body, /"done":true/);
  assert.match(stream.body, /试用期请假政策/);
  assert.doesNotMatch(stream.body, /\uFFFD/);

  const created = await call("/api/v1/qa/sessions", {
    method: "POST",
    body: { kb_id: "kb-hr", title: "契约测试会话" },
  });
  assert.equal(created.body.code, 200);
  assert.ok(created.body.data.session_id);
  assert.ok(created.body.data.started_at);
  const sessionId = created.body.data.session_id;

  const sessions = await call("/api/v1/qa/sessions?page=1&size=20");
  assert.equal(sessions.body.code, 200);
  assert.ok(
    sessions.body.data.records.some((item) => item.session_id === sessionId)
  );

  const messages = await call(
    `/api/v1/qa/sessions/${sessionId}/messages?page=1&size=50`
  );
  assert.equal(messages.body.code, 200);
  assert.ok(messages.body.data.records[0].message_id);
  assert.equal(messages.body.data.records[0].session_id, sessionId);

  const citationList = await call(
    `/api/v1/qa/sessions/${sessionId}/messages/message-assistant-001/citations`
  );
  assert.equal(citationList.body.code, 200);
  assert.ok(citationList.body.data[0].chunk_id);

  const feedback = await call(
    `/api/v1/qa/sessions/${sessionId}/messages/message-assistant-001/feedback`,
    {
      method: "POST",
      body: { feedback_type: "dislike", description: "[答案不正确]" },
    }
  );
  assert.equal(feedback.body.code, 200);

  const invalidFeedback = await call(
    `/api/v1/qa/sessions/${sessionId}/messages/message-assistant-001/feedback`,
    {
      method: "POST",
      body: { feedback_type: "correction" },
    }
  );
  assert.equal(invalidFeedback.response.status, 400);
  assert.equal(invalidFeedback.body.code, 400);

  const deleted = await call(`/api/v1/qa/sessions/${sessionId}`, {
    method: "DELETE",
  });
  assert.equal(deleted.body.code, 200);

  const refresh = await call("/api/v1/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refresh_token: login.body.data.refresh_token },
  });
  assert.equal(refresh.body.code, 200);
  assert.ok(refresh.body.data.access_token);
});
