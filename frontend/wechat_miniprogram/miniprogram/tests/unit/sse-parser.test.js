/**
 * 测试：SSE 解析器的拆包、粘包、中文边界和 done 事件。
 */
const assert = require("node:assert");
const test = require("node:test");

// 直接引用 SSE 解析器（纯 JS 无微信依赖）
const {
  createSSEParser,
  createUTF8ChunkDecoder,
} = require("../../utils/sse");

test("SSE 解析：单个完整 data 事件", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  parser.push('data: {"content": "你好", "done": false}\n\n');
  parser.finish();

  assert.deepStrictEqual(chunks, ["你好"]);
});

test("SSE 解析：一个 chunk 内多个 data 事件", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  parser.push(
    'data: {"content": "第", "done": false}\n\ndata: {"content": "一句", "done": false}\n\n'
  );
  parser.finish();

  assert.deepStrictEqual(chunks, ["第", "一句"]);
});

test("SSE 解析：一个事件被拆到多个 chunk", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  // 第一行拆成两半
  parser.push('data: {"content": "拆分');
  parser.push('文本", "done": false}\n\n');
  parser.finish();

  assert.deepStrictEqual(chunks, ["拆分文本"]);
});

test("SSE 解析：中文 UTF-8 字节跨 chunk", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  const decoder = createUTF8ChunkDecoder();
  const payload = Buffer.from(
    'data: {"content": "中文测试", "done": false}\n\n',
    "utf8"
  );
  const chineseStart = payload.indexOf(Buffer.from("中", "utf8"));
  const splitAt = chineseStart + 1;

  parser.push(decoder.push(payload.subarray(0, splitAt)));
  parser.push(decoder.push(payload.subarray(splitAt)));
  parser.push(decoder.finish());
  parser.finish();

  assert.deepStrictEqual(chunks, ["中文测试"]);
});

test("SSE 解析：done=true 返回 message_id 和 citations", () => {
  const results = [];
  const parser = createSSEParser({
    onDone(result) {
      results.push(result);
    },
  });

  parser.push(
    'data: {"content": "", "done": true, "message_id": "msg-001", "citations": [{"id":"c1"}]}\n\n'
  );
  parser.finish();

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].message_id, "msg-001");
  assert.deepStrictEqual(results[0].citations, [{ id: "c1" }]);
});

test("SSE 解析：CRLF 和 LF 混合", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  parser.push('data: {"content": "A", "done": false}\r\n\r\n');
  parser.push('data: {"content": "B", "done": false}\n\n');
  parser.finish();

  assert.deepStrictEqual(chunks, ["A", "B"]);
});

test("SSE 解析：心跳行（: 开头）被忽略", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  parser.push(': heartbeat\n\n');
  parser.push('data: {"content": "有效", "done": false}\n\n');
  parser.push(': ping\n\n');
  parser.finish();

  assert.deepStrictEqual(chunks, ["有效"]);
});

test("SSE 解析：非 JSON 行忽略", () => {
  const chunks = [];
  const errors = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
    onError(err) {
      errors.push(err);
    },
  });

  parser.push("data: not-json\n\n");
  parser.push('data: {"content": "OK", "done": false}\n\n');
  parser.finish();

  // 非 JSON 行记录错误但不影响后续
  assert.strictEqual(errors.length, 1);
  assert.deepStrictEqual(chunks, ["OK"]);
});

test("SSE 解析：结束前残留缓冲被正确处理", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
    onDone(result) {
      chunks.push("DONE:" + result.message_id);
    },
  });

  parser.push('data: {"content": "最后", "done": false}\n');
  // 没有结尾的 \n\n，需要 finish() 处理
  parser.finish();

  assert.deepStrictEqual(chunks, ["最后"]);
});

test("SSE 解析：done=false 无 content 忽略", () => {
  const chunks = [];
  const parser = createSSEParser({
    onText(content) {
      chunks.push(content);
    },
  });

  parser.push('data: {"done": false}\n\n');
  parser.finish();

  assert.deepStrictEqual(chunks, []);
});

test("SSE 解析：reset 后重新使用", () => {
  const firstChunks = [];
  const parser = createSSEParser({
    onText(content) {
      firstChunks.push(content);
    },
  });

  // 喂入被中断的数据
  parser.push('data: {"content": "旧", "done": ');
  // reset 清理残留缓冲
  parser.reset();

  // 重新开始完整数据
  parser.push('data: {"content": "新", "done": false}\n\n');
  parser.finish();

  // reset 清理了 "旧" 的不完整数据，"旧" 不应出现
  assert.deepStrictEqual(firstChunks, ["新"]);
});
