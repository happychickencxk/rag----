/**
 * 文档服务
 * 封装文档列表和上传接口。
 */

const { get } = require("../utils/request");
const { uploadFile } = require("../utils/upload");
const {
  downloadAuthorized,
  openDocument,
} = require("../utils/file-transfer");

/**
 * 获取文档列表。
 * 小程序端必须带 kb_id。
 *
 * @param {object} params
 * @param {string} params.kbId - 知识库 ID（必填）
 * @param {number} [params.page=1]
 * @param {number} [params.size=20]
 * @param {string} [params.keyword]
 * @returns {Promise<object>}
 */
async function getDocuments(params) {
  const query = { kb_id: params.kbId };
  if (params.page) query.page = params.page;
  if (params.size) query.size = params.size;
  if (params.keyword) query.keyword = params.keyword;
  return get("/api/v1/documents", query);
}

/**
 * 获取命中切片及相邻原文，用于引用页精确定位。
 * @param {string} docId
 * @param {string} chunkId
 * @param {number} [context=1]
 */
async function getChunkSource(docId, chunkId, context = 1) {
  return get(
    `/api/v1/documents/${encodeURIComponent(docId)}/chunks/${encodeURIComponent(chunkId)}/source`,
    { context }
  );
}

/**
 * 上传文件到指定知识库。
 * @param {object} opts
 * @param {string} opts.filePath - 本地文件路径
 * @param {string} opts.fileName - 原始文件名
 * @param {string} opts.kbId - 目标知识库 ID
 * @param {string} [opts.source]
 * @param {string} [opts.version]
 * @param {string} [opts.tags]
 * @param {string} [opts.permissionScope]
 * @returns {Promise<object>}
 */
async function upload(opts) {
  return uploadFile({
    filePath: opts.filePath,
    fileName: opts.fileName,
    kbId: opts.kbId,
    source: opts.source,
    version: opts.version,
    tags: opts.tags,
    permissionScope: opts.permissionScope,
  });
}

/**
 * 下载并打开有权限访问的文档。
 * @param {string} docId
 * @param {string} filename
 */
async function downloadDocument(docId, filename) {
  const tempFilePath = await downloadAuthorized(
    `/api/v1/documents/${docId}/download`
  );
  await openDocument(tempFilePath, filename);
}

module.exports = {
  getDocuments,
  getChunkSource,
  upload,
  downloadDocument,
};
