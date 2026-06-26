const { findCitation } = require("../../utils/mock");

Page({
  data: {
    citation: findCitation("c1"),
    expanded: false,
  },

  onLoad(options) {
    this.setData({ citation: findCitation(options.id) });
  },

  toggleText() {
    this.setData({ expanded: !this.data.expanded });
  },

  copyCitation() {
    const { citation } = this.data;
    wx.setClipboardData({
      data: `${citation.title}｜${citation.path}｜${citation.excerpt}`,
      success: () => wx.showToast({ title: "已复制" }),
    });
  },

  feedback() {
    wx.navigateTo({ url: "/pages/feedback/submit?type=citation" });
  },
});
