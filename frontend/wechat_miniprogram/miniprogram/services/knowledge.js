/**
 * 知识库服务
 * 封装知识库列表、详情查询。
 */

const { get } = require("../utils/request");

/**
 * 获取知识库列表。
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.size=10]
 * @param {string} [params.keyword]
 * @param {string} [params.departmentId]
 * @param {string} [params.status] - active / archived
 * @returns {Promise<object>} 分页结果 { records, total, page, size, pages }
 */
async function getKnowledgeBases(params) {
  const query = {};
  if (params) {
    if (params.page) query.page = params.page;
    if (params.size) query.size = params.size;
    if (params.keyword) query.keyword = params.keyword;
    if (params.departmentId) query.department_id = params.departmentId;
    if (params.status) query.status = params.status;
  }
  return get("/api/v1/knowledge-bases", query);
}

/**
 * 获取知识库详情。
 * @param {string} kbId
 * @returns {Promise<object>}
 */
async function getKnowledgeBaseDetail(kbId) {
  return get(`/api/v1/knowledge-bases/${kbId}`);
}

module.exports = {
  getKnowledgeBases,
  getKnowledgeBaseDetail,
};
