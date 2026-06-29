const { submitFeedback, getMessages } = require("../../services/qa");
const { mapFeedbackReason } = require("../../adapters/index");

const FEEDBACK_OPTIONS = [
  "答案不正确",
  "引用错误",
  "没有引用",
  "答案不完整",
  "无权限但展示了敏感内容",
  "其他",
];

function decodeRouteText(value) {
  if (!value || value === "undefined" || value === "null") {
    return "";
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return String(value);
  }
}

function summarizeAnswer(value) {
  if (!value) return "";
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

Page({
  data: {
    options: FEEDBACK_OPTIONS,
    selected: "",
    note: "",
    hasNote: false,
    submitted: false,
    submitting: false,
    // 从问答页传入的上下文
    sessionId: "",
    messageId: "",
    question: "",
    answer: "",
    answerSummary: "",
  },

  async onLoad(options) {
    const sessionId = options.sessionId || "";
    const messageId = options.messageId || "";
    const question = decodeRouteText(options.question);
    const answer = decodeRouteText(options.answer);

    this.setData({
      sessionId,
      messageId,
      question,
      answer,
      answerSummary: summarizeAnswer(answer),
      selected: options.type === "citation" ? "引用错误" : "",
    });

    if (sessionId && messageId && (!question || !answer)) {
      await this.loadMessageContext();
    }
  },

  /**
   * 引用详情只传会话和消息标识时，从消息接口补齐问题和回答摘要。
   */
  async loadMessageContext() {
    try {
      const result = await getMessages(this.data.sessionId, { page: 1, size: 50 });
      const messages = result.records || [];
      let answerIndex = messages.findIndex(
        (item) => (item.message_id || item.id) === this.data.messageId
      );
      if (answerIndex === -1) {
        // 历史数据的消息标识可能已迁移，退回到该会话最后一条助手回答。
        for (let index = messages.length - 1; index >= 0; index -= 1) {
          if (messages[index].role === "assistant") {
            answerIndex = index;
            break;
          }
        }
      }
      if (answerIndex === -1) return;

      const answerMessage = messages[answerIndex];
      let question = "";
      for (let index = answerIndex - 1; index >= 0; index -= 1) {
        if (messages[index].role === "user") {
          question = messages[index].content || "";
          break;
        }
      }

      const answer = this.data.answer || answerMessage.content || "";
      this.setData({
        question: this.data.question || question,
        answer,
        answerSummary: summarizeAnswer(answer),
      });
    } catch (error) {
      console.warn("[feedback] 加载问答上下文失败:", error.message);
    }
  },

  selectType(e) {
    if (this.data.submitted) return;
    this.setData({ selected: e.currentTarget.dataset.value });
  },

  onNoteInput(e) {
    const note = e.detail.value.slice(0, 200);
    this.setData({
      note,
      hasNote: note.trim().length > 0,
    });
  },

  async submit() {
    if (this.data.submitted || this.data.submitting) return;

    if (!this.data.selected) {
      wx.showToast({ title: "请选择反馈类型", icon: "none" });
      return;
    }

    const { sessionId, messageId, selected, note } = this.data;

    if (!sessionId || !messageId) {
      wx.showToast({ title: "缺少必要参数，请从问答页进入", icon: "none" });
      return;
    }

    this.setData({ submitting: true });

    try {
      const { feedbackType, description } = mapFeedbackReason(selected, note);
      await submitFeedback(sessionId, messageId, feedbackType, description);
      this.setData({ submitted: true, submitting: false });
    } catch (err) {
      this.setData({ submitting: false });
      wx.showToast({
        title: err.message || "提交失败，请重试",
        icon: "none",
      });
    }
  },

  back() {
    wx.navigateBack();
  },
});
