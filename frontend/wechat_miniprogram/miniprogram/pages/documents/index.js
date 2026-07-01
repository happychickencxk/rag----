const {
  getDocuments,
  downloadDocument,
} = require("../../services/document");
const {
  getKnowledgeBaseDetail,
} = require("../../services/knowledge");
const {
  adaptKnowledgeBase,
} = require("../../adapters/index");
const {
  adaptDocumentPage,
} = require("../../utils/document-view");

Page({
  data: {
    kbId: "",
    knowledgeBase: null,
    keyword: "",
    documents: [],
    page: 1,
    size: 20,
    total: 0,
    hasMore: false,
    status: "loading",
    errorMsg: "",
    searchTimer: null,
    downloadingId: "",
  },

  onLoad(options) {
    const kbId = options.kbId || "";
    if (!kbId) {
      this.setData({
        status: "error",
        errorMsg: "缺少知识库标识",
      });
      return;
    }
    this.setData({ kbId });
    this.loadPage(true);
  },

  async loadPage(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ status: "loading", errorMsg: "" });

    try {
      const requests = [
        getDocuments({
          kbId: this.data.kbId,
          page,
          size: this.data.size,
          keyword: this.data.keyword || undefined,
        }),
      ];
      if (!this.data.knowledgeBase) {
        requests.push(getKnowledgeBaseDetail(this.data.kbId));
      }

      const results = await Promise.all(requests);
      const adaptedPage = adaptDocumentPage(results[0]);
      const documents = reset
        ? adaptedPage.records
        : [...this.data.documents, ...adaptedPage.records];
      const nextData = {
        documents,
        page: adaptedPage.page,
        total: adaptedPage.total,
        hasMore: adaptedPage.page < adaptedPage.pages,
        status: documents.length ? "done" : "empty",
      };
      if (results[1]) {
        nextData.knowledgeBase = adaptKnowledgeBase(results[1]);
      }
      this.setData(nextData);
    } catch (err) {
      this.setData({
        status: "error",
        errorMsg: err.message || "文档列表加载失败",
      });
    }
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    if (this.data.searchTimer) clearTimeout(this.data.searchTimer);
    this.setData({ keyword });
    this.data.searchTimer = setTimeout(() => this.loadPage(true), 300);
  },

  loadMore() {
    if (!this.data.hasMore || this.data.status === "loading") return;
    this.setData({ page: this.data.page + 1 });
    this.loadPage(false);
  },

  retry() {
    this.loadPage(true);
  },

  startQuestion() {
    const kb = this.data.knowledgeBase;
    if (!kb) return;
    const app = getApp();
    app.setSelectedKb(kb);
    app.clearCurrentSession();
    wx.switchTab({ url: "/pages/chat/index" });
  },

  async download(e) {
    const id = e.currentTarget.dataset.id;
    const document = this.data.documents.find((item) => item.id === id);
    if (!document || this.data.downloadingId) return;

    this.setData({ downloadingId: id });
    wx.showLoading({ title: "下载中..." });
    try {
      await downloadDocument(document.id, document.name);
    } catch (err) {
      wx.showToast({ title: err.message || "下载失败", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ downloadingId: "" });
    }
  },

  onReachBottom() {
    this.loadMore();
  },

  onPullDownRefresh() {
    this.loadPage(true).then(() => wx.stopPullDownRefresh());
  },
});
