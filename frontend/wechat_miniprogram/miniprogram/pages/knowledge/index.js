const { getKnowledgeBases } = require("../../services/knowledge");
const { adaptKnowledgeBasePage } = require("../../adapters/index");
const storage = require("../../utils/storage");

Page({
  data: {
    keyword: "",
    list: [],
    selectedKbId: "",
    // 页面状态：loading | empty | error | done
    status: "loading",
    errorMsg: "",
    // 分页
    page: 1,
    size: 20,
    total: 0,
    hasMore: false,
    // 搜索防抖
    searchTimer: null,
  },

  onShow() {
    const app = getApp();
    this.setData({
      selectedKbId: app.globalData.selectedKbId || "",
    });
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 1 });
    }

    // 首次加载
    if (this.data.list.length === 0) {
      this.loadList();
    }
  },

  async loadList(reset) {
    const page = reset ? 1 : this.data.page;
    this.setData({ status: "loading", errorMsg: "" });

    try {
      const result = await getKnowledgeBases({
        page,
        size: this.data.size,
        keyword: this.data.keyword || undefined,
      });

      const adapted = adaptKnowledgeBasePage(result);
      const list = reset ? adapted.list : [...this.data.list, ...adapted.list];

      this.setData({
        list,
        total: adapted.total,
        page: adapted.page,
        hasMore: adapted.page < adapted.pages,
        status: list.length === 0 ? "empty" : "done",
      });
    } catch (err) {
      // 如果已有数据，保留现有数据并展示错误提示
      if (this.data.list.length > 0) {
        wx.showToast({ title: err.message || "加载失败", icon: "none" });
        this.setData({ status: "done" });
      } else {
        this.setData({
          status: "error",
          errorMsg: err.message || "加载失败，请检查网络后重试",
        });
      }
    }
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    // 防抖：300ms 后执行服务端搜索
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }
    this.setData({ keyword });

    this.data.searchTimer = setTimeout(() => {
      this.setData({ page: 1 });
      this.loadList(true);
    }, 300);
  },

  loadMore() {
    if (!this.data.hasMore || this.data.status === "loading") return;
    this.setData({ page: this.data.page + 1 });
    this.loadList(false);
  },

  retry() {
    this.setData({ page: 1 });
    this.loadList(true);
  },

  async selectKb(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find((kb) => kb.id === id);
    if (!item || item.permission === "denied") {
      wx.showToast({ title: "无访问权限", icon: "none" });
      return;
    }

    const app = getApp();
    app.setSelectedKb(item);
    this.setData({ selectedKbId: id });

    // 清除当前会话（切换知识库后旧会话失效）
    app.clearCurrentSession();

    wx.switchTab({ url: "/pages/chat/index" });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadList(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMore();
  },
});
