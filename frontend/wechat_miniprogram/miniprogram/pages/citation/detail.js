const { getCitations } = require("../../services/qa");
const { adaptCitation } = require("../../adapters/index");

Page({
  data: {
    citation: null,
    expanded: false,
    sessionId: "",
    messageId: "",
    citationId: "",
    // 页面状态
    status: "loading", // loading | done | error | forbidden
    errorMsg: "",
  },

  onLoad(options) {
    const sessionId = options.sessionId || "";
    const messageId = options.messageId || "";
    const citationId = options.citationId || "";

    this.setData({ sessionId, messageId, citationId });

    if (!sessionId || !messageId) {
      this.setData({
        status: "error",
        errorMsg: "缺少会话或消息标识，无法加载引用详情。",
      });
      return;
    }

    this.loadCitation();
  },

  async loadCitation() {
    this.setData({ status: "loading", errorMsg: "" });

    try {
      const result = await getCitations(
        this.data.sessionId,
        this.data.messageId
      );

      // result 可能是分页结构或数组
      const citations = result.records || result || [];

      // 找到指定的引用
      let found = null;
      if (this.data.citationId) {
        found = citations.find(
          (c) => c.id === this.data.citationId
        );
      }
      if (!found && citations.length > 0) {
        found = citations[0];
      }
      if (!found) {
        this.setData({
          status: "error",
          errorMsg: "未找到该引用记录。",
        });
        return;
      }

      const adapted = adaptCitation(found);
      this.setData({
        citation: adapted,
        status: "done",
      });
    } catch (err) {
      if (err.httpStatus === 403 || err.code === 403) {
        // 403 权限受限：不展示完整原文
        this.setData({
          status: "forbidden",
          errorMsg: "无权查看该引用的完整原文。",
        });
      } else {
        this.setData({
          status: "error",
          errorMsg: err.message || "加载引用详情失败",
        });
      }
    }
  },

  toggleText() {
    this.setData({ expanded: !this.data.expanded });
  },

  copyCitation() {
    const { citation } = this.data;
    if (!citation) return;
    const parts = [citation.title, citation.path, citation.excerpt].filter(Boolean);
    wx.setClipboardData({
      data: parts.join("｜"),
      success: () => wx.showToast({ title: "已复制" }),
    });
  },

  feedback() {
    const { sessionId, messageId, citation } = this.data;
    wx.navigateTo({
      url: `/pages/feedback/submit?sessionId=${sessionId}&messageId=${messageId}&type=citation&citationId=${citation ? citation.id : ""}`,
    });
  },
});
