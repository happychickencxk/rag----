/**
 * 测试：知识库、会话、消息、引用字段适配。
 */
const assert = require("node:assert");
const test = require("node:test");

const {
  adaptKnowledgeBase,
  adaptSession,
  adaptMessage,
  adaptCitation,
  adaptUserProfile,
} = require("../../adapters/index");

test("知识库适配：snake_case → camelCase 视图字段", () => {
  const record = {
    kb_id: "kb-001",
    name: "人事制度库",
    description: "员工手册",
    department_name: "人力资源部",
    doc_count: 128,
    chunk_count: 2048,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
  };

  const view = adaptKnowledgeBase(record);
  assert.strictEqual(view.id, "kb-001");
  assert.strictEqual(view.name, "人事制度库");
  assert.strictEqual(view.department, "人力资源部");
  assert.strictEqual(view.docCount, 128);
  assert.strictEqual(view.chunkCount, 2048);
  assert.strictEqual(view.status, "active");
  assert.strictEqual(view.updatedAt, "2024-03-15T10:00:00Z");
  assert.strictEqual(view.permission, "granted");
  assert.strictEqual(view.permissionText, "可访问");
});

test("知识库适配：denied 权限", () => {
  const record = {
    id: "kb-002",
    name: "机密库",
    doc_count: 0,
    permission: "denied",
  };

  const view = adaptKnowledgeBase(record);
  assert.strictEqual(view.permission, "denied");
  assert.strictEqual(view.permissionText, "无访问权限");
});

test("会话适配：时间分组", () => {
  const today = new Date();
  const todayISO = today.toISOString();

  const record = {
    session_id: "s1",
    title: "测试会话",
    kb_id: "kb-001",
    message_count: 3,
    started_at: todayISO,
  };

  const view = adaptSession(record);
  assert.strictEqual(view.id, "s1");
  assert.strictEqual(view.messageCount, 3);
  assert.strictEqual(view.group, "今天");
});

test("会话适配：UTC 时间转换为本地时间", () => {
  const view = adaptSession({
    session_id: "s-timezone",
    title: "时区测试",
    kb_id: "kb-001",
    started_at: "2026-06-29T01:36:00Z",
  });

  assert.strictEqual(view.time, "09:36");
});

test("消息适配：用户消息", () => {
  const record = {
    message_id: "msg-1",
    session_id: "s1",
    role: "user",
    content: "试用期请假？",
    created_at: "2024-01-01T00:00:00Z",
  };

  const view = adaptMessage(record);
  assert.strictEqual(view.role, "user");
  assert.strictEqual(view.text, "试用期请假？");
  assert.strictEqual(view.id, "msg-1");
});

test("消息适配：assistant 消息含引用和段落", () => {
  const record = {
    message_id: "msg-2",
    session_id: "s1",
    role: "assistant",
    content: "第一点\n**重点**内容\n第二点",
    citations: [
      {
        chunk_id: "c1",
        doc_name: "员工手册",
        content: "测试内容",
        permission: "granted",
      },
    ],
    feedback_status: "",
    low_confidence: false,
  };

  const view = adaptMessage(record);
  assert.strictEqual(view.role, "assistant");
  assert.strictEqual(view.citations.length, 1);
  assert.strictEqual(view.citations[0].title, "员工手册");
  assert.ok(view.paragraphs.length > 0);
  // 验证加粗标记解析
  const allSegments = view.paragraphs.flatMap((p) => p.segments);
  const strongSeg = allSegments.find((s) => s.strong);
  assert.ok(strongSeg, "应存在加粗片段");
  assert.strictEqual(strongSeg.text, "重点");
});

test("用户适配：profile 字段映射", () => {
  const profile = {
    user_id: "u-001",
    name: "张明",
    avatar_url: "https://example.com/avatar.png",
    department_name: "客服中心",
    role_name: "客服专员",
    is_new_user: false,
  };

  const view = adaptUserProfile(profile);
  assert.strictEqual(view.userId, "u-001");
  assert.strictEqual(view.name, "张明");
  assert.strictEqual(view.department, "客服中心");
});

test("引用适配：缺失字段不补齐", () => {
  const record = {
    chunk_id: "c1",
    doc_name: "测试文档",
    content: "部分内容",
    permission: "granted",
  };

  const view = adaptCitation(record);
  assert.strictEqual(view.title, "测试文档");
  assert.strictEqual(view.kb, ""); // 未返回 kb_name
  assert.strictEqual(view.updatedAt, ""); // 未返回 updated_at
  assert.strictEqual(view.highlight, ""); // 未返回 highlight
});

test("引用适配：更新时间只展示日期", () => {
  const view = adaptCitation({
    chunk_id: "chunk-date",
    doc_name: "测试文档",
    updated_at: "2024-06-15T09:00:00Z",
    permission: "granted",
  });

  assert.strictEqual(view.updatedAt, "2024-06-15");
});
