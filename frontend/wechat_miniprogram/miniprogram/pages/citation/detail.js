const { getCitations } = require("../../services/qa");
const {
  getChunkSource,
  downloadDocument,
} = require("../../services/document");
const { adaptCitation } = require("../../adapters/index");

Page({
  data: {
    citation: null,
    sourceRecords: [],
    targetAnchor: "",
    sourceStatus: "idle",
    downloading: false,
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
          (c) => (c.chunk_id || c.id) === this.data.citationId
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
        sourceStatus: "loading",
      });
      await this.loadSource(adapted);
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

  async loadSource(citation) {
    if (!citation.docId || !citation.id) {
      this.setData({
        sourceRecords: [{ ...citation, isTarget: true }],
        targetAnchor: citation.sourceAnchor,
        sourceStatus: "fallback",
      });
      return;
    }

    try {
      const result = await getChunkSource(citation.docId, citation.id, 1);
      const document = result.document || {};
      const records = (result.records || []).map((record) => {
        const adapted = adaptCitation({
          ...record,
          doc_name: document.filename || citation.title,
          kb_name: document.kb_name || citation.kb,
          permission: citation.permission,
        });
        return {
          ...adapted,
          isTarget: adapted.id === result.target_chunk_id,
        };
      });
      this.setData({
        sourceRecords: records.length
          ? records
          : [{ ...citation, isTarget: true }],
        targetAnchor:
          (result.target_location && result.target_location.source_anchor) ||
          citation.sourceAnchor,
        sourceStatus: records.length ? "done" : "fallback",
      });
    } catch (_err) {
      // 引用本身可用时，上下文加载失败不应阻断用户查看命中片段。
      this.setData({
        sourceRecords: [{ ...citation, isTarget: true }],
        targetAnchor: citation.sourceAnchor,
        sourceStatus: "fallback",
      });
    }
  },

  copyCitation() {
    const { citation } = this.data;
    if (!citation) return;
    const parts = [
      citation.title,
      citation.locationLabel,
      citation.path,
      citation.excerpt,
    ].filter(Boolean);
    wx.setClipboardData({
      data: parts.join("\n"),
      success: () => wx.showToast({ title: "已复制" }),
    });
  },

  async openOriginal() {
    const { citation, downloading } = this.data;
    if (!citation || !citation.docId || downloading) {
      if (citation && !citation.docId) {
        wx.showToast({ title: "该历史引用缺少文档标识", icon: "none" });
      }
      return;
    }

    this.setData({ downloading: true });
    wx.showLoading({ title: "打开中..." });
    try {
      await downloadDocument(citation.docId, citation.title);
    } catch (err) {
      wx.showToast({ title: err.message || "原文件打开失败", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ downloading: false });
    }
  },

  feedback() {
    const { sessionId, messageId, citation } = this.data;
    wx.navigateTo({
      url: `/pages/feedback/submit?sessionId=${sessionId}&messageId=${messageId}&type=citation&citationId=${citation ? citation.id : ""}`,
    });
  },
});
