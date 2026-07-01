/**
 * 测试：文件扩展名和 20MB 限制校验。
 */
const assert = require("node:assert");
const test = require("node:test");
const {
  validateFile,
  formatFileSize,
} = require("../../utils/file-validation");

test("支持的文件类型全部通过", () => {
  const files = [
    "doc.pdf",
    "文档.docx",
    "README.md",
    "notes.txt",
    "page.html",
    "data.csv",
  ];
  for (const name of files) {
    const result = validateFile(name, 1024);
    assert.strictEqual(result.valid, true, `${name} 应通过校验`);
  }
});

test("不支持的 Excel 格式被拒绝", () => {
  const result = validateFile("data.xlsx", 1024);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes("XLSX"));
});

test("不支持的 PPT 格式被拒绝", () => {
  const result = validateFile("slides.pptx", 1024);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes("PPTX"));
});

test("不支持的 PPT 格式（ppt）被拒绝", () => {
  const result = validateFile("slides.ppt", 1024);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes("PPT"));
});

test("无扩展名文件被拒绝", () => {
  const result = validateFile("noextension", 1024);
  assert.strictEqual(result.valid, false);
});

test("20MB 以内文件通过", () => {
  const result = validateFile("doc.pdf", 20 * 1024 * 1024 - 1);
  assert.strictEqual(result.valid, true);
});

test("恰好 20MB 文件通过", () => {
  const result = validateFile("doc.pdf", 20 * 1024 * 1024);
  assert.strictEqual(result.valid, true);
});

test("超过 20MB 文件被拒绝", () => {
  const result = validateFile("doc.pdf", 20 * 1024 * 1024 + 1);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes("20MB"));
});

test("扩展名大小写不敏感", () => {
  const result = validateFile("DOC.PDF", 1024);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.extension, "pdf");
});

test("文件大小格式化适合上传列表展示", () => {
  assert.strictEqual(formatFileSize(1024), "1KB");
  assert.strictEqual(formatFileSize(1536 * 1024), "1.5MB");
});
