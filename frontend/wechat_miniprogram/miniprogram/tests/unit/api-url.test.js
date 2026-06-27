/**
 * 测试：API 地址只包含一次 /api/v1
 */
const assert = require("node:assert");
const test = require("node:test");

// 模拟 normalizeUrl 逻辑（不依赖微信环境）
function normalizeUrl(origin, path) {
  const cleanPath = path.replace(/^(\/api\/v1)+/, "/api/v1");
  return `${origin}${cleanPath}`;
}

test("API 地址不含重复 /api/v1", () => {
  const origin = "http://localhost:8000";

  // 正常路径
  assert.strictEqual(
    normalizeUrl(origin, "/api/v1/auth/wechat-login"),
    "http://localhost:8000/api/v1/auth/wechat-login"
  );

  // 重复前缀
  assert.strictEqual(
    normalizeUrl(origin, "/api/v1/api/v1/auth/wechat-login"),
    "http://localhost:8000/api/v1/auth/wechat-login"
  );

  // 更多重复
  assert.strictEqual(
    normalizeUrl(origin, "/api/v1/api/v1/api/v1/knowledge-bases"),
    "http://localhost:8000/api/v1/knowledge-bases"
  );
});

test("API 地址不改变不含 /api/v1 的路径", () => {
  const origin = "http://localhost:8000";
  assert.strictEqual(
    normalizeUrl(origin, "/other/path"),
    "http://localhost:8000/other/path"
  );
});
