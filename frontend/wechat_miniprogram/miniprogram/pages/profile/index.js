const { knowledgeBases } = require("../../utils/mock");

Page({
  data: {
    user: {
      name: "张明",
      department: "客服中心",
      role: "客服专员",
    },
    knowledgeBases,
  },

  openStates() {
    wx.navigateTo({ url: "/pages/states/index" });
  },

  clearHistory() {
    wx.showModal({
      title: "清空历史会话",
      content: "后续接入真实接口后会删除当前用户历史会话。",
      showCancel: false,
    });
  },

  logout() {
    wx.showToast({ title: "后续接入退出登录", icon: "none" });
  },
});
