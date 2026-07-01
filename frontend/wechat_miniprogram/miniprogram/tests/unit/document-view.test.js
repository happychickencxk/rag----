const assert = require("node:assert");
const test = require("node:test");

const {
  adaptDocument,
  adaptDocumentPage,
} = require("../../utils/document-view");

test("文档记录适配为页面字段", () => {
  const document = adaptDocument({
    doc_id: "doc-1",
    kb_id: "kb-product",
    filename: "GD32.pdf",
    file_type: "pdf",
    file_size: 1024,
    parse_status: "success",
    chunk_count: 12,
    is_enabled: true,
    updated_at: "2026-07-01T08:00:00Z",
  });
  assert.strictEqual(document.type, "PDF");
  assert.strictEqual(document.statusText, "可检索");
  assert.strictEqual(document.chunkCount, 12);
});

test("文档分页适配保留分页信息", () => {
  const page = adaptDocumentPage({
    records: [],
    total: 21,
    page: 2,
    size: 20,
    pages: 2,
  });
  assert.strictEqual(page.total, 21);
  assert.strictEqual(page.pages, 2);
});
