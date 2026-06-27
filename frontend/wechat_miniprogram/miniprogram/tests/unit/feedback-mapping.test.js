/**
 * 测试：反馈原因到 like/dislike/no_citation 的映射。
 */
const assert = require("node:assert");
const test = require("node:test");

const { mapFeedbackReason } = require("../../adapters/index");

test('反馈映射："没有引用" → no_citation', () => {
  const result = mapFeedbackReason("没有引用", "");
  assert.strictEqual(result.feedbackType, "no_citation");
  assert.strictEqual(result.description, "");
});

test('反馈映射："答案不正确" → dislike + 前缀', () => {
  const result = mapFeedbackReason("答案不正确", "试用期规定不准确");
  assert.strictEqual(result.feedbackType, "dislike");
  assert.strictEqual(result.description, "[答案不正确] 试用期规定不准确");
});

test('反馈映射："引用错误" → dislike + 前缀', () => {
  const result = mapFeedbackReason("引用错误", "");
  assert.strictEqual(result.feedbackType, "dislike");
  assert.strictEqual(result.description, "[引用错误]");
});

test('反馈映射："答案不完整" → dislike + 前缀', () => {
  const result = mapFeedbackReason("答案不完整", "缺少远程办公流程");
  assert.strictEqual(result.feedbackType, "dislike");
  assert.strictEqual(result.description, "[答案不完整] 缺少远程办公流程");
});

test('反馈映射："无权限但展示了敏感内容" → dislike + 前缀', () => {
  const result = mapFeedbackReason("无权限但展示了敏感内容", "");
  assert.strictEqual(result.feedbackType, "dislike");
  assert.strictEqual(result.description, "[敏感内容]");
});

test('反馈映射："其他" → dislike + 前缀', () => {
  const result = mapFeedbackReason("其他", "其他问题说明");
  assert.strictEqual(result.feedbackType, "dislike");
  assert.strictEqual(result.description, "[其他] 其他问题说明");
});

test('反馈映射：未知原因也返回 dislike', () => {
  const result = mapFeedbackReason("未知类型", "说明");
  assert.strictEqual(result.feedbackType, "dislike");
});
