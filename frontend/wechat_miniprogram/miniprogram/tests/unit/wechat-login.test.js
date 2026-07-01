/**
 * 测试：开发者工具无法获取微信 code 时使用固定开发身份。
 */
const assert = require("node:assert");
const test = require("node:test");

const requestPath = require.resolve("../../utils/request");
const storagePath = require.resolve("../../utils/storage");
const authPath = require.resolve("../../services/auth");

test("wx.login 无 code 时回退到固定开发身份", async () => {
  const request = require(requestPath);
  const storage = require(storagePath);
  const originalPost = request.post;
  const originalSaveTokens = storage.saveTokens;
  const originalSaveUserInfo = storage.saveUserInfo;
  const originalClearCurrentSession = storage.clearCurrentSession;
  const originalWx = global.wx;
  let requestData = null;
  let sessionCleared = false;

  request.post = async (_url, data) => {
    requestData = data;
    return {
      user_id: "user-dev",
      name: "开发用户",
      role: "employee",
      is_new_user: true,
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 7200,
    };
  };
  storage.saveTokens = () => {};
  storage.saveUserInfo = () => {};
  storage.clearCurrentSession = () => {
    sessionCleared = true;
  };
  global.wx = {
    login(options) {
      options.success({ errMsg: "login:fail no permission" });
    },
  };

  delete require.cache[authPath];
  const { wechatLogin } = require(authPath);
  const result = await wechatLogin();

  assert.strictEqual(requestData.code, "devtools-stable-user");
  assert.strictEqual(result.user_id, "user-dev");
  assert.strictEqual(sessionCleared, true);

  request.post = originalPost;
  storage.saveTokens = originalSaveTokens;
  storage.saveUserInfo = originalSaveUserInfo;
  storage.clearCurrentSession = originalClearCurrentSession;
  global.wx = originalWx;
  delete require.cache[authPath];
});
