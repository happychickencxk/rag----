const assert = require("node:assert");
const test = require("node:test");

const {
  normalizeStatusCode,
  resolveQaStatus,
  resolveQaErrorStatus,
  decorateAssistantMessage,
} = require("../../utils/qa-status");

test("状态码支持驼峰和下划线别名", () => {
  assert.strictEqual(normalizeStatusCode("NoEvidence"), "NoEvidence");
  assert.strictEqual(normalizeStatusCode("low_confidence"), "LowConfidence");
  assert.strictEqual(normalizeStatusCode("success"), "");
});

test("low_confidence 布尔值映射为低置信度状态", () => {
  const status = resolveQaStatus("", true);
  assert.strictEqual(status.code, "LowConfidence");
  assert.strictEqual(status.hideAnswer, false);
});

test("无证据状态隐藏回答和引用", () => {
  const status = resolveQaStatus("NoEvidence", false);
  assert.strictEqual(status.hideAnswer, true);
  assert.strictEqual(status.hideCitations, true);
});

test("HTTP 403 映射为无权限状态", () => {
  const status = resolveQaErrorStatus({ httpStatus: 403, message: "无访问权限" });
  assert.strictEqual(status.code, "NoPermission");
});

test("超时和敏感拦截错误可映射为页面状态", () => {
  assert.strictEqual(
    resolveQaErrorStatus({ message: "模型响应超时" }).code,
    "ModelTimeout"
  );
  assert.strictEqual(
    resolveQaErrorStatus({ message: "问题被敏感词拦截" }).code,
    "SensitiveBlocked"
  );
});

test("装饰消息时阻断状态不会保留引用", () => {
  const decorated = decorateAssistantMessage({
    role: "assistant",
    statusCode: "NoPermission",
    citations: [{ id: "c1" }],
  });
  assert.strictEqual(decorated.citations.length, 0);
  assert.strictEqual(decorated.allowActions, false);
});
