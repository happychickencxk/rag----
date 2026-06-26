const { knowledgeBases, citations, answerText, answerBlocks, findKnowledgeBase } = require("../../utils/mock");

Page({
  data: {
    selectedKb: findKnowledgeBase("aftersales"),
    knowledgeBases,
    citations,
    question: "",
    citationExpanded: false,
    feedbackValue: "",
    showKbSheet: false,
    messages: [
      {
        id: "m1",
        role: "user",
        text: "试用期请假是否影响转正？",
      },
      {
        id: "m2",
        role: "assistant",
        text: answerText,
        paragraphs: answerBlocks,
        lowConfidence: false,
        citations,
      },
    ],
  },

  onShow() {
    const app = getApp();
    const selectedKb = findKnowledgeBase(app.globalData.selectedKbId || "aftersales");
    this.setData({ selectedKb });
  },

  onInput(e) {
    this.setData({ question: e.detail.value });
  },

  onSelectExample(e) {
    const question = e.currentTarget.dataset.question;
    this.sendQuestion(question);
  },

  onSend() {
    const question = this.data.question.trim();
    if (!question) {
      wx.showToast({ title: "请输入问题", icon: "none" });
      return;
    }
    this.sendQuestion(question);
  },

  sendQuestion(question) {
    const app = getApp();
    app.globalData.lastQuestion = question;
    this.setData({
      question: "",
      citationExpanded: false,
      messages: [
        { id: `u-${Date.now()}`, role: "user", text: question },
        { id: `a-${Date.now()}`, role: "assistant", text: answerText, paragraphs: answerBlocks, citations },
      ],
    });
    wx.pageScrollTo({ scrollTop: 9999, duration: 200 });
  },

  openKnowledge() {
    this.setData({ showKbSheet: true });
  },

  closeKbSheet() {
    this.setData({ showKbSheet: false });
  },

  noop() {},

  selectKbFromSheet(e) {
    const id = e.currentTarget.dataset.id;
    const item = knowledgeBases.find((kb) => kb.id === id);
    if (!item || item.permission === "denied") {
      wx.showToast({ title: "无访问权限", icon: "none" });
      return;
    }
    const app = getApp();
    app.globalData.selectedKbId = id;
    this.setData({
      selectedKb: item,
      showKbSheet: false,
    });
  },

  openHistory() {
    wx.switchTab({ url: "/pages/history/index" });
  },

  toggleCitations() {
    this.setData({ citationExpanded: !this.data.citationExpanded });
  },

  openCitation(e) {
    wx.navigateTo({
      url: `/pages/citation/detail?id=${e.currentTarget.dataset.id}`,
    });
  },

  submitFeedback() {
    wx.navigateTo({ url: "/pages/feedback/submit" });
  },

  copyAnswer() {
    wx.setClipboardData({
      data: answerText,
      success: () => wx.showToast({ title: "已复制" }),
    });
  },

  markHelpful(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ feedbackValue: value });
    wx.showToast({ title: value === "like" ? "已标记有用" : "感谢反馈", icon: "none" });
  },

  regenerate() {
    wx.showToast({ title: "后续接入真实接口", icon: "none" });
  },

  voiceInput() {
    wx.showToast({ title: "语音输入待接入", icon: "none" });
  },
});
