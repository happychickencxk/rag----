const feedbackOptions = ["答案不正确", "引用错误", "没有引用", "答案不完整", "无权限但展示了敏感内容", "其他"];

Page({
  data: {
    options: feedbackOptions,
    selected: "",
    note: "",
    hasNote: false,
    submitted: false,
  },

  selectType(e) {
    this.setData({ selected: e.currentTarget.dataset.value });
  },

  onNoteInput(e) {
    const note = e.detail.value.slice(0, 200);
    this.setData({
      note,
      hasNote: note.trim().length > 0,
    });
  },

  submit() {
    if (!this.data.selected) {
      wx.showToast({ title: "请选择反馈类型", icon: "none" });
      return;
    }
    this.setData({ submitted: true });
  },

  back() {
    wx.navigateBack();
  },
});
