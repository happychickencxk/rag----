const assert = require("node:assert");
const test = require("node:test");

const {
  DEFAULT_QUESTIONS,
  getQuestionSuggestions,
} = require("../../utils/question-suggestions");

test("产品资料库优先显示 GD32 示例问题", () => {
  const questions = getQuestionSuggestions({ id: "kb-product", name: "产品资料库" });
  assert.match(questions[0], /GD32H75E/);
});

test("未知知识库返回通用示例问题", () => {
  assert.deepStrictEqual(
    getQuestionSuggestions({ id: "kb-other", name: "其它" }),
    DEFAULT_QUESTIONS
  );
});
