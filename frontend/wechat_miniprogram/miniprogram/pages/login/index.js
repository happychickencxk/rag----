const { wechatLogin } = require("../../services/auth");
const { hasValidToken } = require("../../utils/storage");

Page({
  data: {
    status: "idle", // idle | loading | error
    errorMsg: "",
  },

  onLoad() {
    // 如果已有有效 Token，直接跳转到问答页
    if (hasValidToken()) {
      wx.switchTab({ url: "/pages/chat/index" });
      return;
    }

    // 检查是否被重定向过来（带错误信息）
    // 例如从其他页面 401 后跳转过来
  },

  onShow() {
    // 每次展示时检查 token
    if (hasValidToken()) {
      wx.switchTab({ url: "/pages/chat/index" });
    }
  },

  async handleLogin() {
    if (this.data.status === "loading") return;

    this.setData({ status: "loading", errorMsg: "" });

    try {
      // 获取微信用户信息（可选，用于首次设置昵称和头像）
      let profile = null;
      try {
        // wx.getUserProfile 需要用户主动触发，这里使用 wx.getUserInfo 的降级方案
        // 实际使用时可以先用静默登录，后续在我的页面让用户设置
        const userInfoRes = await new Promise((resolve, reject) => {
          wx.getUserInfo({
            success: resolve,
            fail: reject,
          });
        });
        if (userInfoRes && userInfoRes.userInfo) {
          profile = {
            nickName: userInfoRes.userInfo.nickName || "",
            avatarUrl: userInfoRes.userInfo.avatarUrl || "",
          };
        }
      } catch (e) {
        // 获取用户信息失败不影响登录，使用空昵称
        console.log("[login] getUserInfo 失败，使用默认信息:", e.errMsg);
      }

      const result = await wechatLogin(profile);

      if (result && result.access_token) {
        wx.showToast({ title: "登录成功", icon: "success" });
        // 延迟跳转让 toast 展示
        setTimeout(() => {
          wx.switchTab({ url: "/pages/chat/index" });
        }, 600);
      }
    } catch (err) {
      let errorMsg = "登录失败，请检查网络后重试";
      if (err.code) {
        if (err.code === 400) {
          errorMsg = "登录参数有误，请重试";
        } else if (err.code === 500 || err.code === 503) {
          errorMsg = "服务暂时不可用，请稍后重试";
        }
      }
      if (err.message) {
        errorMsg = err.message;
      }
      this.setData({ status: "error", errorMsg });
    }
  },
});
