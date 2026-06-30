/**
 * 认证服务
 * 封装微信登录、Token 刷新、获取用户信息和退出登录。
 */

const { post, get } = require("../utils/request");
const config = require("../config/api");
const storage = require("../utils/storage");

/**
 * 微信登录。
 * 调用 wx.login() 获取 code，连同昵称和头像发送到后端换取 JWT。
 *
 * 开发环境（微信开发者工具未配置真实 AppID 时）：
 *   wx.login 会返回 errMsg "login:fail:no permission" 类似的错误，
 *   此时自动使用模拟 code 继续登录，不阻塞开发联调。
 *
 * @param {object} [profile] - 可选的微信用户信息
 * @param {string} [profile.nickName]
 * @param {string} [profile.avatarUrl]
 * @returns {Promise<object>} 用户信息 { user_id, name, role, is_new_user, access_token, refresh_token, expires_in }
 */
async function wechatLogin(profile) {
  let code = "";

  try {
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject,
      });
    });
    code = loginRes.code || "";
  } catch (err) {
    console.warn("[auth] wx.login 失败:", err.errMsg || err.message);
  }

  if (!code) {
    if (!config.ALLOW_DEV_LOGIN_FALLBACK) {
      throw new Error("无法获取微信登录凭证");
    }
    // 固定 code 对应固定开发账号，避免每次登录生成新用户。
    code = "devtools-stable-user";
  }

  const data = {
    code,
    nick_name: (profile && profile.nickName) || "",
    avatar_url: (profile && profile.avatarUrl) || "",
  };

  const result = await post("/api/v1/auth/wechat-login", data, { skipAuth: true });

  // 保存 Token
  storage.saveTokens(
    result.access_token,
    result.refresh_token,
    result.expires_in
  );
  // 保存用户信息
  storage.saveUserInfo({
    user_id: result.user_id,
    name: result.name || "",
    role: result.role || "",
    is_new_user: result.is_new_user,
  });

  return result;
}

/**
 * 刷新 Token。
 * @returns {Promise<object>} 新的 token 信息
 */
async function refreshToken() {
  const refreshTokenValue = storage.getRefreshToken();
  if (!refreshTokenValue) {
    throw new Error("无 refresh_token");
  }
  const result = await post(
    "/api/v1/auth/refresh",
    { refresh_token: refreshTokenValue },
    { skipAuth: true }
  );
  storage.saveTokens(result.access_token, result.refresh_token, result.expires_in);
  return result;
}

/**
 * 获取当前用户信息。
 * @returns {Promise<object>} 用户信息
 */
async function getProfile() {
  const result = await get("/api/v1/auth/profile");
  storage.saveUserInfo({
    user_id: result.user_id,
    name: result.name || "",
    role: result.role_name || result.role || "",
    department: result.department_name || result.department || "",
    avatar_url: result.avatar_url || "",
    is_new_user: result.is_new_user,
  });
  return result;
}

/**
 * 退出登录。
 * 尝试通知服务端，无论成功与否都清理本地状态。
 */
async function logout() {
  try {
    await post("/api/v1/auth/logout");
  } catch (e) {
    // 即使服务端已失效，也清理本地状态
  }
  storage.clearAllAuth();
}

module.exports = {
  wechatLogin,
  refreshToken,
  getProfile,
  logout,
};
