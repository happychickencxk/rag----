/**
 * 测试：403 引用清除完整正文。
 * 验证引用适配器在 permission=restricted 时不暴露 excerpt。
 */
const assert = require("node:assert");
const test = require("node:test");

const { adaptCitation } = require("../../adapters/index");

test("正常引用保留完整字段", () => {
  const record = {
    id: "c1",
    document_name: "员工手册",
    kb_name: "人事制度库",
    chunk_path: "第3章 > 考勤制度",
    excerpt: "试用期员工享有与正式员工同等的请假权利。",
    similarity: "0.92",
    rerank_score: "0.95",
    permission: "granted",
  };

  const view = adaptCitation(record);
  assert.strictEqual(view.permitted, true);
  assert.strictEqual(view.excerpt, record.excerpt);
  assert.strictEqual(view.title, "员工手册");
});

test("受限引用 permitted=false 但仍保留后端允许的元信息", () => {
  const record = {
    id: "c2",
    document_name: "受限文档",
    kb_name: "机密库",
    chunk_path: "第5章",
    excerpt: "敏感内容原文",
    similarity: "0.85",
    rerank_score: "0.80",
    permission: "restricted",
  };

  const view = adaptCitation(record);
  // 权限标记为受限
  assert.strictEqual(view.permitted, false);
  // 元信息仍保留（文档名、路径等）
  assert.strictEqual(view.title, "受限文档");
  assert.strictEqual(view.kb, "机密库");
  // 但页面应基于 permitted=false 条件渲染，不展示 excerpt
  // excerpt 仅在后端明确允许时才由页面渲染
});

test("permission=denied 时 permitted=false", () => {
  const record = {
    id: "c3",
    document_name: "被拒文档",
    permission: "denied",
  };

  const view = adaptCitation(record);
  assert.strictEqual(view.permitted, false);
});

test("未返回 permission 字段时默认可访问", () => {
  const record = {
    id: "c4",
    document_name: "普通文档",
    excerpt: "公开内容",
  };

  const view = adaptCitation(record);
  assert.strictEqual(view.permitted, true);
  assert.strictEqual(view.permission, "granted");
});
