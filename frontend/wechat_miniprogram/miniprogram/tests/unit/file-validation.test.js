/**
 * 测试：文件扩展名和 20MB 限制校验。
 */
const assert = require("node:assert");
const test = require("node:test");

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = ["pdf", "docx", "md", "txt", "html", "csv"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function validateFile(fileName, fileSize) {
  const ext = getExtension(fileName);
  if (!ext) {
    return { valid: false, reason: "无法识别文件类型" };
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      reason: `不支持 ${ext.toUpperCase()} 格式，仅支持 PDF、DOCX、MD、TXT、HTML、CSV`,
    };
  }
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, reason: "文件超过 20MB 大小限制" };
  }
  return { valid: true, ext };
}

function getExtension(name) {
  const idx = name.lastIndexOf(".");
  if (idx === -1 || idx === name.length - 1) return "";
  return name.substring(idx + 1).toLowerCase();
}

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
  assert.strictEqual(result.ext, "pdf");
});
