/**
 * 前端权限判断。
 * 权限码优先，角色判断用于兼容旧后端。
 */

function canUploadDocuments(user) {
  const current = user || {};
  const permissions = Array.isArray(current.permissions)
    ? current.permissions
    : [];
  return (
    current.role === "admin" ||
    current.role === "kb_admin" ||
    permissions.includes("*") ||
    permissions.includes("documents:upload")
  );
}

module.exports = {
  canUploadDocuments,
};
