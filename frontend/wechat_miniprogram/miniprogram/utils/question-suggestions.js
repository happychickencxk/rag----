const DEFAULT_QUESTIONS = Object.freeze([
  "试用期请假是否影响转正？",
  "产品安装失败如何排查？",
  "售后退换货流程是什么？",
]);

const QUESTIONS_BY_KB = Object.freeze({
  "kb-hr": [
    "试用期请假是否影响转正？",
    "如何申请远程办公？",
    "报销发票有哪些要求？",
  ],
  "kb-product": [
    "告诉我 GD32H75E 的电气特性",
    "产品安装失败如何排查？",
    "设备固件升级失败如何处理？",
  ],
  "kb-after-sales": [
    "售后退换货流程是什么？",
    "产品维修需要准备哪些材料？",
    "客户如何查询维修进度？",
  ],
});

function getQuestionSuggestions(knowledgeBase) {
  const kb = knowledgeBase || {};
  if (QUESTIONS_BY_KB[kb.id]) {
    return [...QUESTIONS_BY_KB[kb.id]];
  }

  const name = String(kb.name || "");
  if (/人事|制度/.test(name)) return [...QUESTIONS_BY_KB["kb-hr"]];
  if (/产品|研发|技术/.test(name)) return [...QUESTIONS_BY_KB["kb-product"]];
  if (/售后|客服/.test(name)) return [...QUESTIONS_BY_KB["kb-after-sales"]];
  return [...DEFAULT_QUESTIONS];
}

module.exports = {
  DEFAULT_QUESTIONS,
  QUESTIONS_BY_KB,
  getQuestionSuggestions,
};
