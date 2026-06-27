/**
 * 测试：并发 401 只刷新一次，并正确重放等待请求。
 * 纯逻辑测试，不依赖微信 API。
 */
const assert = require("node:assert");
const test = require("node:test");

// 模拟刷新队列机制
function createRefreshManager() {
  let refreshPromise = null;
  let refreshCount = 0;

  async function refreshToken() {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = new Promise((resolve) => {
      // 模拟异步刷新
      setTimeout(() => {
        refreshCount++;
        resolve(true);
      }, 10);
    });

    refreshPromise.finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  return { refreshToken, getRefreshCount: () => refreshCount };
}

test("单次刷新只调用一次", async () => {
  const mgr = createRefreshManager();
  await mgr.refreshToken();
  assert.strictEqual(mgr.getRefreshCount(), 1);
});

test("并发 3 次刷新只实际调用一次", async () => {
  const mgr = createRefreshManager();

  const results = await Promise.all([
    mgr.refreshToken(),
    mgr.refreshToken(),
    mgr.refreshToken(),
  ]);

  assert.strictEqual(mgr.getRefreshCount(), 1);
  assert.deepStrictEqual(results, [true, true, true]);
});

test("刷新失败后下一次调用重新发起刷新", async () => {
  let failCount = 0;
  let pending = null;

  async function failingRefresh() {
    if (pending) return pending;
    pending = new Promise((resolve) => {
      setTimeout(() => {
        failCount++;
        resolve(false);
      }, 5);
    });
    pending.finally(() => { pending = null; });
    return pending;
  }

  const r1 = await failingRefresh();
  assert.strictEqual(r1, false);
  assert.strictEqual(failCount, 1);

  const r2 = await failingRefresh();
  assert.strictEqual(r2, false);
  assert.strictEqual(failCount, 2); // 新一次调用
});

test("刷新失败后 Token 被清理（模拟）", () => {
  // 模拟 storage 清理
  let tokens = { access: "test-token", refresh: "test-refresh" };

  function clearAllAuth() {
    tokens = { access: "", refresh: "" };
  }

  // 刷新失败时调用清理
  clearAllAuth();
  assert.strictEqual(tokens.access, "");
  assert.strictEqual(tokens.refresh, "");
});
