const storage = require("../../utils/storage");
const { getKnowledgeBases } = require("../../services/knowledge");
const { getProfile } = require("../../services/auth");
const { logout } = require("../../services/auth");
const { adaptKnowledgeBasePage, adaptUserProfile } = require("../../adapters/index");

Page({
  data: {
    user: {
      name: "--",
      department: "",
      role: "",
    },
    knowledgeBases: [],
    // 统计数据：无明确接口时显示 "--"
    stats: {
      historyCount: "--",
      feedbackCount: "--",
      commonKbCount: "--",
    },
    // 页面状态
    loading: true,
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 3 });
    }

    // 加载用户信息和知识库
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      // 并行加载用户信息和知识库列表
      const [profileResult, kbResult] = await Promise.all([
        getProfile().catch(() => null),
        getKnowledgeBases({ size: 50 }).catch(() => null),
      ]);

      // 更新用户信息
      if (profileResult) {
        const user = adaptUserProfile(profileResult);
        // 同时更新本地存储
        storage.saveUserInfo(profileResult);
        this.setData({ user });
      } else {
        // 尝试从本地缓存读取
        const cached = storage.getUserInfo();
        if (cached) {
          this.setData({ user: adaptUserProfile(cached) });
        }
      }

      // 更新知识库权限列表
      if (kbResult) {
        const adapted = adaptKnowledgeBasePage(kbResult);
        this.setData({ knowledgeBases: adapted.list });
      }
    } catch (e) {
      // 加载失败保留已有数据
      console.error("[profile] 加载失败:", e);
    } finally {
      this.setData({ loading: false });
    }
  },

  async handleLogout() {
    wx.showModal({
      title: "退出登录",
      content: "退出后需要重新登录才能使用。",
      success: async (res) => {
        if (res.confirm) {
          try {
            await logout();
          } catch (e) {
            // 即使服务端失败也清理本地
          }
          wx.reLaunch({ url: "/pages/login/index" });
        }
      },
    });
  },

  openStates() {
    wx.navigateTo({ url: "/pages/states/index" });
  },

  handleClearHistory() {
    wx.showModal({
      title: "清空历史会话",
      content: "当前不支持批量清空历史会话，请前往历史页逐条删除。",
      showCancel: false,
      confirmText: "前往历史",
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: "/pages/history/index" });
        }
      },
    });
  },

  handleNotification() {
    wx.showToast({ title: "消息通知功能暂未开放", icon: "none" });
  },

  handleAbout() {
    wx.showModal({
      title: "关于系统",
      content: "企业知识库 RAG 问答系统\n微信小程序端\n版本 1.0.0",
      showCancel: false,
    });
  },
});
