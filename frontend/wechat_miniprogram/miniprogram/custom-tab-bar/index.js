Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/chat/index",
        text: "问答",
        iconPath: "/images/icons/ai-assistant.png",
      },
      {
        pagePath: "/pages/knowledge/index",
        text: "知识库",
        iconPath: "/images/icons/knowledge-base.png",
      },
      {
        pagePath: "/pages/history/index",
        text: "历史",
        iconPath: "/images/icons/history.png",
      },
      {
        pagePath: "/pages/profile/index",
        text: "我的",
        iconPath: "/images/icons/profile.png",
      },
    ],
  },

  methods: {
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index);
      const item = this.data.list[index];
      if (!item || index === this.data.selected) {
        return;
      }
      wx.switchTab({ url: item.pagePath });
    },
  },
});
