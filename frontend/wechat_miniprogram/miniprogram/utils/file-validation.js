/**
 * 文件上传校验。
 * 前端只接受后端接口明确支持的扩展名和大小范围。
 */

const ALLOWED_EXTENSIONS = Object.freeze([
  "pdf",
  "docx",
  "md",
  "txt",
  "html",
  "csv",
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getExtension(name) {
  const safeName = String(name || "");
  const index = safeName.lastIndexOf(".");
  if (index === -1 || index === safeName.length - 1) return "";
  return safeName.substring(index + 1).toLowerCase();
}

function validateFile(fileName, fileSize) {
  const extension = getExtension(fileName);
  if (!extension) {
    return {
      valid: false,
      extension: "",
      reason: "无法识别文件类型，仅支持 PDF、DOCX、MD、TXT、HTML、CSV",
    };
  }
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      extension,
      reason: `不支持 ${extension.toUpperCase()} 格式，仅支持 PDF、DOCX、MD、TXT、HTML、CSV`,
    };
  }
  if (Number(fileSize) > MAX_FILE_SIZE) {
    return {
      valid: false,
      extension,
      reason: "文件超过 20MB 大小限制",
    };
  }
  return { valid: true, extension, reason: "" };
}

function formatFileSize(size) {
  const bytes = Math.max(Number(size) || 0, 0);
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${Math.max(Math.round(bytes / 1024), 1)}KB`;
}

module.exports = {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  getExtension,
  validateFile,
  formatFileSize,
};
