const assert = require("node:assert");
const test = require("node:test");

const {
  sanitizeFilename,
  getFileType,
} = require("../../utils/file-transfer");

test("导出文件名会移除 Windows 非法字符", () => {
  assert.strictEqual(sanitizeFilename('问答:GD32/测试?.pdf'), "问答_GD32_测试_.pdf");
});

test("文件类型从末尾扩展名提取", () => {
  assert.strictEqual(getFileType("员工手册.V4.PDF"), "pdf");
  assert.strictEqual(getFileType("无扩展名"), "");
});
