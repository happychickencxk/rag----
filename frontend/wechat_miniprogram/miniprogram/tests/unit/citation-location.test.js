const test = require("node:test");
const assert = require("node:assert/strict");

const {
  adaptCitation,
  formatCitationLocation,
} = require("../../adapters/index");

test("PDF 引用显示页码和页内行号", () => {
  const citation = adaptCitation({
    chunk_id: "chunk-1",
    doc_id: "doc-1",
    doc_name: "芯片手册.pdf",
    chapter_path: "第 66 页",
    locator_type: "page_line",
    page_number: 66,
    start_line: 12,
    end_line: 18,
    content: "电气特性原文",
    similarity_score: 0.4224357008934021,
    rerank_score: 0.53989309072,
  });

  assert.equal(citation.docId, "doc-1");
  assert.equal(citation.locationLabel, "第 66 页，第 12-18 行");
  assert.equal(citation.locationDetail, "");
  assert.equal(citation.sourceAnchor, "source-chunk-1");
  assert.equal(citation.similarity, "0.42");
  assert.equal(citation.rerank, "0.54");
});

test("文本和 Word 引用使用对应的位置单位", () => {
  assert.equal(
    formatCitationLocation({
      locator_type: "line",
      start_line: 8,
      end_line: 8,
    }),
    "第 8 行"
  );
  assert.equal(
    formatCitationLocation({
      locator_type: "paragraph",
      start_line: 3,
      end_line: 5,
    }),
    "第 3-5 段"
  );
});

test("旧引用缺少定位字段时回退到章节名称", () => {
  assert.equal(
    formatCitationLocation({ chapter_path: "电气特性 > 直流参数" }),
    "电气特性 > 直流参数"
  );
});
