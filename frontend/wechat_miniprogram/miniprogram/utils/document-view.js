const { formatFileSize } = require("./file-validation");

const PARSE_STATUS = Object.freeze({
  pending: { text: "待处理", tone: "pending" },
  parsing: { text: "解析中", tone: "pending" },
  success: { text: "可检索", tone: "success" },
  failed: { text: "解析失败", tone: "danger" },
});

function formatDocumentDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function adaptDocument(record) {
  const status = PARSE_STATUS[record.parse_status] || PARSE_STATUS.pending;
  return {
    id: record.doc_id || record.id || "",
    kbId: record.kb_id || "",
    name: record.filename || "",
    type: String(record.file_type || "").toUpperCase(),
    size: formatFileSize(record.file_size),
    source: record.source || "",
    version: record.version || "",
    chunkCount: record.chunk_count || 0,
    parseStatus: record.parse_status || "pending",
    statusText: record.is_enabled === false ? "已停用" : status.text,
    statusTone: record.is_enabled === false ? "disabled" : status.tone,
    failReason: record.fail_reason || "",
    updatedAt: formatDocumentDate(record.updated_at),
    canDownload: Boolean(record.doc_id),
  };
}

function adaptDocumentPage(pageResult) {
  return {
    records: (pageResult.records || []).map(adaptDocument),
    total: pageResult.total || 0,
    page: pageResult.page || 1,
    size: pageResult.size || 20,
    pages: pageResult.pages || 0,
  };
}

module.exports = {
  PARSE_STATUS,
  formatDocumentDate,
  adaptDocument,
  adaptDocumentPage,
};
