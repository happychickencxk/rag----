const storage = require("./utils/storage");
const { onAuthExpired } = require("./utils/request");

App({
  onLaunch() {
    // 全局数据初始化
    this.globalData = {
      // 当前选中的知识库 ID（运行时状态）
      selectedKbId: "",
      // 当前会话 ID（运行时状态）
      currentSessionId: "",
      // 上一个问题（用于跨页面传递）
      lastQuestion: "",
      // 数据源模式，从 config 读取
      dataSource: "api",
      // 是否已就绪
      ready: false,
    };

    // 从本地存储恢复知识库和会话
    const savedKb = storage.getCurrentKb();
    if (savedKb) {
      this.globalData.selectedKbId = savedKb.id || "";
    }

    const savedSession = storage.getCurrentSession();
    if (savedSession) {
      this.globalData.currentSessionId = savedSession.id || "";
    }

    // 监听登录失效事件
    onAuthExpired(() => {
      this.globalData.selectedKbId = "";
      this.globalData.currentSessionId = "";
      storage.clearCurrentSession();
      // 跳转到登录页
      wx.reLaunch({ url: "/pages/login/index" });
    });

    this.globalData.ready = true;
  },

  /**
   * 设置当前知识库
   */
  setSelectedKb(kb) {
    this.globalData.selectedKbId = kb.id;
    storage.saveCurrentKb(kb);
  },

  /**
   * 设置当前会话
   */
  setCurrentSession(session) {
    this.globalData.currentSessionId = session.id;
    storage.saveCurrentSession(session);
  },

  /**
   * 清除当前会话
   */
  clearCurrentSession() {
    this.globalData.currentSessionId = "";
    storage.clearCurrentSession();
  },
});
