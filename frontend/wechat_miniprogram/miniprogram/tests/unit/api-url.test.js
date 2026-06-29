/**
 * 测试：API 地址只包含一次 /api/v1
 */
const assert = require("node:assert");
const test = require("node:test");

const { normalizeUrl } = require("../../utils/request");

test("API 地址不含重复 /api/v1", () => {
  // 正常路径
  assert.strictEqual(
    normalizeUrl("/api/v1/auth/wechat-login"),
    "http://localhost:8000/api/v1/auth/wechat-login"
  );

  // 重复前缀
  assert.strictEqual(
    normalizeUrl("/api/v1/api/v1/auth/wechat-login"),
    "http://localhost:8000/api/v1/auth/wechat-login"
  );

  // 更多重复
  assert.strictEqual(
    normalizeUrl("/api/v1/api/v1/api/v1/knowledge-bases"),
    "http://localhost:8000/api/v1/knowledge-bases"
  );
});

test("API 地址不改变不含 /api/v1 的路径", () => {
  assert.strictEqual(
    normalizeUrl("/other/path"),
    "http://localhost:8000/other/path"
  );
});

test("API 地址自动补充路径开头的斜杠", () => {
  assert.strictEqual(
    normalizeUrl("api/v1/auth/profile"),
    "http://localhost:8000/api/v1/auth/profile"
  );
});
