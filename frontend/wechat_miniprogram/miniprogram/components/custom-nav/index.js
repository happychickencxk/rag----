Component({
  properties: {
    title: {
      type: String,
      value: "",
    },
    back: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    statusBarHeight: 20,
    navigationBarHeight: 44,
  },

  lifetimes: {
    attached() {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const statusBarHeight = windowInfo.statusBarHeight || 20;
      const menuRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const menuGap = menuRect ? Math.max(menuRect.top - statusBarHeight, 0) : 0;
      const navigationBarHeight = menuRect ? menuRect.height + menuGap * 2 : 44;

      this.setData({
        statusBarHeight,
        navigationBarHeight,
      });
    },
  },

  methods: {
    goBack() {
      if (getCurrentPages().length > 1) {
        wx.navigateBack();
        return;
      }
      wx.switchTab({ url: "/pages/chat/index" });
    },
  },
});
