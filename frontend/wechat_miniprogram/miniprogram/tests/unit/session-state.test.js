const assert = require("node:assert");
const test = require("node:test");

const {
  shouldResetLocalSession,
} = require("../../utils/session-state");

test("没有页面会话时无需重置", () => {
  assert.strictEqual(shouldResetLocalSession("", null, "kb-product"), false);
});

test("全局会话已清除时重置页面旧会话", () => {
  assert.strictEqual(
    shouldResetLocalSession("session-old", null, "kb-product"),
    true
  );
});

test("会话所属知识库与当前知识库不一致时重置", () => {
  assert.strictEqual(
    shouldResetLocalSession(
      "session-old",
      { id: "session-old", kb_id: "kb-hr" },
      "kb-product"
    ),
    true
  );
});

test("会话与知识库均一致时保留", () => {
  assert.strictEqual(
    shouldResetLocalSession(
      "session-current",
      { id: "session-current", kb_id: "kb-product" },
      "kb-product"
    ),
    false
  );
});
