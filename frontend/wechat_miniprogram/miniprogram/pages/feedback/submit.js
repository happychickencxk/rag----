const { submitFeedback } = require("../../services/qa");
const { mapFeedbackReason } = require("../../adapters/index");

const FEEDBACK_OPTIONS = [
  "答案不正确",
  "引用错误",
  "没有引用",
  "答案不完整",
  "无权限但展示了敏感内容",
  "其他",
];

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
  },

  onLoad(options) {
    this.setData({
      sessionId: options.sessionId || "",
      messageId: options.messageId || "",
      question: decodeURIComponent(options.question || ""),
      answer: decodeURIComponent(options.answer || ""),
    });
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
