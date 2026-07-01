/**
 * 需要鉴权的二进制下载与打开工具。
 */

const config = require("../config/api");
const storage = require("./storage");
const {
  normalizeUrl,
  generateRequestId,
  BusinessError,
  refreshToken,
  emitAuthExpired,
} = require("./request");

function createHeaders(contentType) {
  const token = storage.getAccessToken();
  const headers = {
    "X-Client-Type": "wechat",
    "X-Request-Id": generateRequestId(),
  };
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function updateAuthorization(headers) {
  const token = storage.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
}

function downloadAuthorized(path) {
  const headers = createHeaders();
  let retryCount = 0;

  return new Promise((resolve, reject) => {
    function execute() {
      wx.downloadFile({
        url: normalizeUrl(path),
        header: headers,
        timeout: config.UPLOAD_TIMEOUT,
        success(res) {
          if (res.statusCode === 200 && res.tempFilePath) {
            resolve(res.tempFilePath);
            return;
          }
          if (res.statusCode === 401 && retryCount < config.MAX_RETRY) {
            retryCount += 1;
            refreshToken().then((ok) => {
              if (!ok) {
                emitAuthExpired();
                reject(new BusinessError(401, "登录已过期"));
                return;
              }
              updateAuthorization(headers);
              execute();
            });
            return;
          }
          const error = new BusinessError(
            res.statusCode,
            res.statusCode === 403 ? "无权下载该文件" : `文件下载失败（${res.statusCode}）`
          );
          error.httpStatus = res.statusCode;
          reject(error);
        },
        fail(err) {
          const message =
            err.errMsg && err.errMsg.includes("timeout")
              ? "文件下载超时，请重试"
              : "网络异常，文件下载失败";
          reject(new BusinessError(-1, message));
        },
      });
    }

    execute();
  });
}

function requestBinary(path, data) {
  const headers = createHeaders("application/json");
  let retryCount = 0;

  return new Promise((resolve, reject) => {
    function execute() {
      wx.request({
        url: normalizeUrl(path),
        method: "POST",
        data,
        header: headers,
        responseType: "arraybuffer",
        timeout: config.REQUEST_TIMEOUT,
        success(res) {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
            return;
          }
          if (res.statusCode === 401 && retryCount < config.MAX_RETRY) {
            retryCount += 1;
            refreshToken().then((ok) => {
              if (!ok) {
                emitAuthExpired();
                reject(new BusinessError(401, "登录已过期"));
                return;
              }
              updateAuthorization(headers);
              execute();
            });
            return;
          }
          const error = new BusinessError(
            res.statusCode,
            res.statusCode === 403 ? "无权导出该会话" : `会话导出失败（${res.statusCode}）`
          );
          error.httpStatus = res.statusCode;
          reject(error);
        },
        fail(err) {
          const message =
            err.errMsg && err.errMsg.includes("timeout")
              ? "会话导出超时，请重试"
              : "网络异常，会话导出失败";
          reject(new BusinessError(-1, message));
        },
      });
    }

    execute();
  });
}

function sanitizeFilename(filename) {
  const normalized = String(filename || "文件")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
  return normalized || "文件";
}

function getFileType(filename) {
  const matched = String(filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return matched ? matched[1] : "";
}

function openDocument(filePath, filename) {
  return new Promise((resolve, reject) => {
    wx.openDocument({
      filePath,
      fileType: getFileType(filename) || undefined,
      showMenu: true,
      success: resolve,
      fail: () => reject(new BusinessError(-1, "文件已下载，但当前格式无法在小程序内预览")),
    });
  });
}

function writeAndOpenDocument(data, filename) {
  const safeName = sanitizeFilename(filename);
  const filePath = `${wx.env.USER_DATA_PATH}/${safeName}`;
  const fs = wx.getFileSystemManager();

  return new Promise((resolve, reject) => {
    fs.writeFile({
      filePath,
      data,
      success() {
        openDocument(filePath, safeName).then(resolve).catch(reject);
      },
      fail() {
        reject(new BusinessError(-1, "导出文件保存失败"));
      },
    });
  });
}

module.exports = {
  downloadAuthorized,
  requestBinary,
  sanitizeFilename,
  getFileType,
  openDocument,
  writeAndOpenDocument,
};
