/**
 * 本地存储工具
 * 持久化 Token、用户、当前知识库和会话状态。
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  TOKEN_EXPIRES_AT: "token_expires_at",
  USER_INFO: "user_info",
  CURRENT_KB: "current_kb",
  CURRENT_SESSION: "current_session",
};

/**
 * 保存 access_token、refresh_token 和过期时间。
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {number} expiresIn - 有效秒数
 */
function saveTokens(accessToken, refreshToken, expiresIn) {
  const now = Date.now();
  wx.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  wx.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  wx.setStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT, now + expiresIn * 1000);
}

/** 获取 access_token */
function getAccessToken() {
  return wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN) || "";
}

/** 获取 refresh_token */
function getRefreshToken() {
  return wx.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN) || "";
}

/** 获取 token 过期时间戳（毫秒） */
function getTokenExpiresAt() {
  return wx.getStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT) || 0;
}

/** 判断 access_token 是否已过期（含提前刷新余量） */
function isTokenExpired(marginSeconds) {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return true;
  const margin = (marginSeconds || 0) * 1000;
  return Date.now() >= expiresAt - margin;
}

/** 是否有有效的 access_token */
function hasValidToken() {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(0);
}

/** 清除所有 Token */
function clearTokens() {
  wx.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN);
  wx.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN);
  wx.removeStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT);
}

/** 保存用户信息 */
function saveUserInfo(userInfo) {
  wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo);
}

/** 获取用户信息 */
function getUserInfo() {
  return wx.getStorageSync(STORAGE_KEYS.USER_INFO) || null;
}

/** 清除用户信息 */
function clearUserInfo() {
  wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
}

/** 保存当前知识库 */
function saveCurrentKb(kb) {
  wx.setStorageSync(STORAGE_KEYS.CURRENT_KB, kb);
}

/** 获取当前知识库 */
function getCurrentKb() {
  return wx.getStorageSync(STORAGE_KEYS.CURRENT_KB) || null;
}

/** 清除当前知识库 */
function clearCurrentKb() {
  wx.removeStorageSync(STORAGE_KEYS.CURRENT_KB);
}

/** 保存当前会话 */
function saveCurrentSession(session) {
  wx.setStorageSync(STORAGE_KEYS.CURRENT_SESSION, session);
}

/** 获取当前会话 */
function getCurrentSession() {
  return wx.getStorageSync(STORAGE_KEYS.CURRENT_SESSION) || null;
}

/** 清除当前会话 */
function clearCurrentSession() {
  wx.removeStorageSync(STORAGE_KEYS.CURRENT_SESSION);
}

/** 清除所有登录相关本地状态 */
function clearAllAuth() {
  clearTokens();
  clearUserInfo();
  clearCurrentSession();
}

module.exports = {
  STORAGE_KEYS,
  saveTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiresAt,
  isTokenExpired,
  hasValidToken,
  clearTokens,
  saveUserInfo,
  getUserInfo,
  clearUserInfo,
  saveCurrentKb,
  getCurrentKb,
  clearCurrentKb,
  saveCurrentSession,
  getCurrentSession,
  clearCurrentSession,
  clearAllAuth,
};
