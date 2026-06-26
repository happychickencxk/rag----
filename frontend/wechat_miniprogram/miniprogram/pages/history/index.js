const { groupSessions } = require("../../utils/mock");

Page({
  data: {
    keyword: "",
    groups: groupSessions(),
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    const allGroups = groupSessions();
    if (!keyword) {
      this.setData({ keyword, groups: allGroups });
      return;
    }
    const groups = allGroups
      .map((group) => ({
        name: group.name,
        items: group.items.filter((item) => item.title.includes(keyword) || item.preview.includes(keyword)),
      }))
      .filter((group) => group.items.length);
    this.setData({ keyword, groups });
  },

  openSession(e) {
    const title = e.currentTarget.dataset.title;
    const app = getApp();
    app.globalData.lastQuestion = title;
    wx.switchTab({ url: "/pages/chat/index" });
  },

  deleteSession() {
    wx.showToast({ title: "后续接入删除接口", icon: "none" });
  },
});
