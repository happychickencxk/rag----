/**
 * 测试生产请求层的并发刷新队列和 401 最大重放次数。
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const storage = require("../../utils/storage");
const { refreshToken, request } = require("../../utils/request");

test("并发 401 刷新只请求一次刷新接口", async (t) => {
  const originalWx = global.wx;
  const originalMethods = {
    getRefreshToken: storage.getRefreshToken,
    saveTokens: storage.saveTokens,
    clearAllAuth: storage.clearAllAuth,
  };
  t.after(() => {
    global.wx = originalWx;
    Object.assign(storage, originalMethods);
  });

  let requestCount = 0;
  let savedToken = "";
  storage.getRefreshToken = () => "mock-refresh-token";
  storage.saveTokens = (accessToken) => {
    savedToken = accessToken;
  };
  storage.clearAllAuth = () => {};
  global.wx = {
    request(options) {
      requestCount += 1;
      setTimeout(() => {
        options.success({
          statusCode: 200,
          data: {
            code: 200,
            data: {
              access_token: "new-access-token",
              refresh_token: "new-refresh-token",
              expires_in: 7200,
            },
          },
        });
      }, 5);
    },
  };

  const results = await Promise.all([
    refreshToken(),
    refreshToken(),
    refreshToken(),
  ]);

  assert.deepEqual(results, [true, true, true]);
  assert.equal(requestCount, 1);
  assert.equal(savedToken, "new-access-token");
});

test("刷新后仍返回 401 时只重放一次并通知失效", async (t) => {
  const originalWx = global.wx;
  const originalMethods = {
    getAccessToken: storage.getAccessToken,
    getRefreshToken: storage.getRefreshToken,
    saveTokens: storage.saveTokens,
    clearAllAuth: storage.clearAllAuth,
  };
  t.after(() => {
    global.wx = originalWx;
    Object.assign(storage, originalMethods);
  });

  let accessToken = "expired-access-token";
  let profileCount = 0;
  let refreshCount = 0;
  let clearCount = 0;
  storage.getAccessToken = () => accessToken;
  storage.getRefreshToken = () => "mock-refresh-token";
  storage.saveTokens = (newAccessToken) => {
    accessToken = newAccessToken;
  };
  storage.clearAllAuth = () => {
    clearCount += 1;
  };
  global.wx = {
    request(options) {
      if (options.url.endsWith("/auth/refresh")) {
        refreshCount += 1;
        options.success({
          statusCode: 200,
          data: {
            code: 200,
            data: {
              access_token: "refreshed-but-rejected",
              refresh_token: "new-refresh-token",
              expires_in: 7200,
            },
          },
        });
        return;
      }

      profileCount += 1;
      options.success({
        statusCode: 401,
        data: { code: 401, message: "令牌无效", data: null },
      });
    },
  };

  await assert.rejects(
    request({ url: "/api/v1/auth/profile" }),
    (error) => error.httpStatus === 401
  );
  assert.equal(profileCount, 2);
  assert.equal(refreshCount, 1);
  assert.equal(clearCount, 1);
});
