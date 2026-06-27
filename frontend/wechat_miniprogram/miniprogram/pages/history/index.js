const { getSessions, getMessages, deleteSession } = require("../../services/qa");
const { adaptSessionPage, adaptMessagePage } = require("../../adapters/index");
const storage = require("../../utils/storage");

Page({
  data: {
    keyword: "",
    groups: [],
    // 完整会话列表（未分组）
    allSessions: [],
    // 页面状态：loading | empty | error | done
    status: "loading",
    errorMsg: "",
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 2 });
    }

    this.loadSessions();
  },

  async loadSessions() {
    this.setData({ status: "loading", errorMsg: "" });

    try {
      const result = await getSessions({ size: 100 });
      const adapted = adaptSessionPage(result);

      // 应用本地搜索过滤
      let sessions = adapted.records;
      if (this.data.keyword) {
        sessions = sessions.filter(
          (s) =>
            s.title.includes(this.data.keyword) ||
            s.preview.includes(this.data.keyword)
        );
      }

      const groups = adapted.groups;
      // 如果有关键词搜索，重新分组
      const finalGroups = this.data.keyword
        ? this.regroupSessions(sessions)
        : groups;

      this.setData({
        allSessions: adapted.records,
        groups: finalGroups,
        status: finalGroups.length === 0 ? "empty" : "done",
      });
    } catch (err) {
      if (this.data.allSessions.length > 0) {
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

  /**
   * 本地重新分组（用于搜索过滤后）
   */
  regroupSessions(sessions) {
    const { groupSessionsByTime } = require("../../adapters/index");
    return groupSessionsByTime(sessions);
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    this.setData({ keyword });

    // 搜索仅在已加载数据中进行
    if (!keyword) {
      const { groupSessionsByTime } = require("../../adapters/index");
      this.setData({
        groups: groupSessionsByTime(this.data.allSessions),
        status:
          this.data.allSessions.length === 0 ? "empty" : "done",
      });
      return;
    }

    const filtered = this.data.allSessions.filter(
      (s) =>
        s.title.includes(keyword) || s.preview.includes(keyword)
    );

    this.setData({
      groups: this.regroupSessions(filtered),
      status: filtered.length === 0 ? "empty" : "done",
    });
  },

  retry() {
    this.loadSessions();
  },

  /**
   * 点击会话 → 获取消息并恢复到问答页
   */
  async openSession(e) {
    const sessionId = e.currentTarget.dataset.id;
    const sessionTitle = e.currentTarget.dataset.title;
    const kbId = e.currentTarget.dataset.kbId;

    if (!sessionId) return;

    wx.showLoading({ title: "加载会话..." });

    try {
      const result = await getMessages(sessionId, { size: 100 });
      const adapted = adaptMessagePage(result);

      const app = getApp();
      // 保存会话信息
      app.globalData.lastQuestion = sessionTitle;
      app.globalData.currentSessionId = sessionId;
      app.setCurrentSession({ id: sessionId, kb_id: kbId });

      // 如果有 KB ID，设置当前知识库
      if (kbId) {
        app.globalData.selectedKbId = kbId;
      }

      // 将消息存入临时存储供问答页读取
      storage.saveCurrentSession({
        id: sessionId,
        kb_id: kbId,
        messages: adapted.records,
      });

      wx.hideLoading();
      wx.switchTab({ url: "/pages/chat/index" });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || "加载会话失败",
        icon: "none",
      });
    }
  },

  /**
   * 长按删除会话
   */
  deleteSession(e) {
    const sessionId = e.currentTarget.dataset.id;
    const sessionTitle = e.currentTarget.dataset.title;

    if (!sessionId) return;

    wx.showModal({
      title: "删除会话",
      content: `确定删除「${sessionTitle || "该会话"}」吗？`,
      confirmColor: "#ef4444",
      success: async (res) => {
        if (!res.confirm) return;

        try {
          await deleteSession(sessionId);
          wx.showToast({ title: "已删除", icon: "success" });
          // 刷新列表
          this.loadSessions();
        } catch (err) {
          wx.showToast({
            title: err.message || "删除失败",
            icon: "none",
          });
        }
      },
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadSessions().then(() => {
      wx.stopPullDownRefresh();
    });
  },
});
