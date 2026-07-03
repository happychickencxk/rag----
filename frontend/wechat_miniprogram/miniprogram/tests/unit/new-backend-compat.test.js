const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canUploadDocuments,
} = require("../../utils/permissions");
const {
  adaptCitation,
} = require("../../adapters/index");

test("新后端上传权限码允许普通员工上传", () => {
  assert.equal(
    canUploadDocuments({
      role: "employee",
      permissions: ["documents:upload"],
    }),
    true
  );
});

test("没有上传权限码的普通员工仍然被拦截", () => {
  assert.equal(
    canUploadDocuments({
      role: "employee",
      permissions: [],
    }),
    false
  );
});

test("新后端引用字段可映射为小程序视图模型", () => {
  const citation = adaptCitation({
    chunk_id: "12",
    doc_id: "3",
    filename: "GD32H75E.pdf",
    chunk_content: "设备支持多种内部外设。",
    page: 11,
    score: 0.82,
  });

  assert.equal(citation.id, "12");
  assert.equal(citation.docId, "3");
  assert.equal(citation.title, "GD32H75E.pdf");
  assert.equal(citation.excerpt, "设备支持多种内部外设。");
  assert.equal(citation.locationLabel, "第 11 页");
  assert.equal(citation.relevanceLabel, "");
  assert.equal(citation.similarity, "0.82");
});
