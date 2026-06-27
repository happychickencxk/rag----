const { knowledgeBases } = require("../../utils/mock");

Page({
  data: {
    keyword: "",
    selectedKbId: "aftersales",
    list: knowledgeBases,
  },

  onShow() {
    const app = getApp();
    this.setData({
      selectedKbId: app.globalData.selectedKbId || "aftersales",
    });
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 1 });
    }
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    const list = knowledgeBases.filter((item) => item.name.includes(keyword) || item.description.includes(keyword));
    this.setData({ keyword, list });
  },

  selectKb(e) {
    const id = e.currentTarget.dataset.id;
    const item = knowledgeBases.find((kb) => kb.id === id);
    if (!item || item.permission === "denied") {
      wx.showToast({ title: "无访问权限", icon: "none" });
      return;
    }
    const app = getApp();
    app.globalData.selectedKbId = id;
    this.setData({ selectedKbId: id });
    wx.switchTab({ url: "/pages/chat/index" });
  },
});
