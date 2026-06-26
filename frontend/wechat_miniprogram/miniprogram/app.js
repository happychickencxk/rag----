App({
  onLaunch: function () {
    this.globalData = {
      selectedKbId: "aftersales",
      lastQuestion: "",
      accessToken: "",
      refreshToken: "",
    };

    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true,
      });
    }
  },
});
