const { wechatLogin } = require("../../services/auth");
const { hasValidToken } = require("../../utils/storage");

Page({
  data: {
    status: "idle", // idle | loading | error
    errorMsg: "",
  },

  onLoad() {
    if (hasValidToken()) {
      wx.switchTab({ url: "/pages/chat/index" });
    }
  },

  onShow() {
    if (hasValidToken()) {
      wx.switchTab({ url: "/pages/chat/index" });
    }
  },

  /**
   * 调用 wx.login 获取临时凭证，再由后端换取访问令牌。
   */
  async handleLogin() {
    if (this.data.status === "loading") return;
    this.setData({ status: "loading", errorMsg: "" });

    try {
      await wechatLogin();
      getApp().clearCurrentSession();
      wx.showToast({ title: "登录成功", icon: "success" });
      wx.switchTab({ url: "/pages/chat/index" });
    } catch (error) {
      let errorMsg = error.message || "登录失败，请检查网络后重试";
      if (error.code === 500 || error.code === 503) {
        errorMsg = "服务暂时不可用，请稍后重试";
      }
      this.setData({ status: "error", errorMsg });
    }
  },
});
