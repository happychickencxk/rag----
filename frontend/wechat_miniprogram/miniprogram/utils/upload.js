/**
 * 文件上传工具
 * 封装 wx.uploadFile，自动附加 Token 和统一响应处理。
 */

const config = require("../config/api");
const storage = require("./storage");
const { normalizeUrl, generateRequestId, BusinessError, refreshToken } = require("./request");

/**
 * 上传文件。
 * 使用 wx.uploadFile，字段为 file、kb_id、source、version、tags、permission_scope。
 *
 * @param {object} opts
 * @param {string} opts.filePath - 本地文件路径
 * @param {string} opts.fileName - 原始文件名
 * @param {string} opts.kbId - 目标知识库 ID
 * @param {string} [opts.source] - 来源标识
 * @param {string} [opts.version] - 版本号
 * @param {string} [opts.tags] - 标签
 * @param {string} [opts.permissionScope] - 权限范围
 * @returns {Promise<any>}
 */
function uploadFile(opts) {
  const {
    filePath,
    fileName,
    kbId,
    source,
    version,
    tags,
    permissionScope,
  } = opts;

  const formData = { kb_id: kbId };
  if (fileName) formData.original_filename = fileName;
  if (source) formData.source = source;
  if (version) formData.version = version;
  if (tags) formData.tags = tags;
  if (permissionScope) formData.permission_scope = permissionScope;

  const token = storage.getAccessToken();
  const header = {
    "X-Client-Type": "wechat",
    "X-Request-Id": generateRequestId(),
  };
  if (token) {
    header["Authorization"] = `Bearer ${token}`;
  }
  let retryCount = 0;
  // 注意：wx.uploadFile 自动设置 multipart/form-data 的 Content-Type 和边界，
  // 不要手动设置 Content-Type。

  return new Promise((resolve, reject) => {
    function doUpload() {
      wx.uploadFile({
        url: normalizeUrl("/api/v1/documents/upload"),
        filePath,
        name: "file",
        formData,
        header,
        timeout: config.UPLOAD_TIMEOUT,
        success(res) {
          try {
            const data = JSON.parse(res.data);
            parseUploadResponse(res.statusCode, data).then(resolve).catch(reject);
          } catch (e) {
            reject(new BusinessError(-1, "上传响应解析失败"));
          }
        },
        fail(err) {
          let message = "上传失败";
          if (err.errMsg) {
            if (err.errMsg.includes("timeout")) {
              message = "上传超时，请重试";
            } else {
              message = "网络异常，上传失败";
            }
          }
          const bizErr = new BusinessError(-1, message);
          bizErr.networkError = true;
          reject(bizErr);
        },
      });
    }

    function parseUploadResponse(statusCode, data) {
      return new Promise((resolve, reject) => {
        if (statusCode === 401) {
          if (retryCount >= config.MAX_RETRY) {
            const { emitAuthExpired } = require("./request");
            emitAuthExpired();
            const error = new BusinessError(401, "登录已过期");
            error.httpStatus = 401;
            reject(error);
            return;
          }
          retryCount += 1;
          refreshToken().then((ok) => {
            if (ok) {
              const newToken = storage.getAccessToken();
              if (newToken) {
                header["Authorization"] = `Bearer ${newToken}`;
              }
              doUpload();
            } else {
              const { emitAuthExpired } = require("./request");
              emitAuthExpired();
              const error = new BusinessError(401, "登录已过期");
              error.httpStatus = 401;
              reject(error);
            }
          });
          return;
        }

        if (statusCode === 403) {
          const error = new BusinessError(403, "无权限上传文件到该知识库");
          error.httpStatus = 403;
          reject(error);
          return;
        }
        if (statusCode === 413) {
          const error = new BusinessError(413, "文件超过 20MB 大小限制");
          error.httpStatus = 413;
          reject(error);
          return;
        }
        if (statusCode === 422) {
          const error = new BusinessError(
            422,
            (data && data.message) || "上传参数不符合接口要求"
          );
          error.httpStatus = 422;
          reject(error);
          return;
        }
        if (statusCode < 200 || statusCode >= 300) {
          const error = new BusinessError(statusCode, `上传失败（${statusCode}）`);
          error.httpStatus = statusCode;
          reject(error);
          return;
        }

        if (data && data.code !== 200) {
          reject(new BusinessError(data.code, data.message || "上传失败"));
          return;
        }

        resolve(data ? data.data : null);
      });
    }

    doUpload();
  });
}

module.exports = {
  uploadFile,
};
