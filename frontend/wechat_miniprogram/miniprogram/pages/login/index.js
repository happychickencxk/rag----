Page({
  data: {
    loading: false,
  },

  onLoad() {
    // 体验版：直接允许进入，不校验 Token
  },

  onShow() {
    // 体验版：不自动跳转
  },

  /**
   * 体验版登录：点击直接进入问答页。
   * 后续正式版将接入 wx.login() 和微信登录接口。
   */
  handleLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    // 模拟短暂加载后进入
    setTimeout(() => {
      wx.switchTab({ url: "/pages/chat/index" });
    }, 300);
  },
});
