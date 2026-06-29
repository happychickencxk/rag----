const { getKnowledgeBases } = require("../../services/knowledge");
const { query, createSession } = require("../../services/qa");
const { adaptKnowledgeBasePage, adaptMessage } = require("../../adapters/index");
const storage = require("../../utils/storage");

Page({
  data: {
    // 当前知识库
    selectedKb: null,
    // 知识库列表（底部弹层用）
    knowledgeBases: [],
    // 知识库弹层
    showKbSheet: false,
    // 输入框
    question: "",
    // 消息列表
    messages: [],
    // 发送中标志（非流式）
    sending: false,
    // 当前流式控制
    streamTask: null,
    // 当前会话 ID
    sessionId: "",
    // 页面状态
    loading: true,
  },

  async onShow() {
    const app = getApp();
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 0 });
    }

    // 恢复会话 ID
    if (!this.data.sessionId) {
      this.setData({ sessionId: app.globalData.currentSessionId || "" });
    }

    // 加载知识库列表
    await this.loadKnowledgeBases();

    // 列表返回后再恢复知识库，避免首次进入时没有默认选中项
    this.restoreSelectedKb();

    // 从历史页恢复会话消息
    this.restoreSessionMessages();
  },

  /**
   * 从本地存储恢复历史会话消息
   */
  restoreSessionMessages() {
    const stored = storage.getCurrentSession();
    if (stored && stored.messages && stored.messages.length > 0) {
      // 检查是否已经加载过（避免重复恢复）
      if (this.data.messages.length === 0 || this.data.sessionId !== stored.id) {
        this.setData({
          messages: stored.messages.map((m) => ({
            ...m,
            citationExpanded: false,
            feedbackStatus: m.feedbackStatus || "",
          })),
          sessionId: stored.id,
        });
        // 清除存储中的消息（避免下次误恢复）
        storage.saveCurrentSession({
          id: stored.id,
          kb_id: stored.kb_id,
          messages: null,
        });
        wx.pageScrollTo({ scrollTop: 9999, duration: 100 });
      }
    }
  },

  onUnload() {
    // 页面卸载时取消流式请求
    if (this.data.streamTask) {
      this.data.streamTask.abort();
    }
  },

  // ===== 知识库管理 =====

  async loadKnowledgeBases() {
    try {
      const result = await getKnowledgeBases({ size: 50 });
      const adapted = adaptKnowledgeBasePage(result);
      this.setData({ knowledgeBases: adapted.list });
    } catch (e) {
      // KB 列表加载失败不影响已有数据
      console.error("[chat] 知识库列表加载失败:", e.message);
    } finally {
      this.setData({ loading: false });
    }
  },

  restoreSelectedKb() {
    const app = getApp();
    const kbId = app.globalData.selectedKbId;

    // 从已加载列表中找到对应知识库
    const kb = this.data.knowledgeBases.find((k) => k.id === kbId);
    if (kb) {
      this.setData({ selectedKb: kb });
      return;
    }

    // 从本地存储恢复
    const savedKb = storage.getCurrentKb();
    if (savedKb) {
      this.setData({ selectedKb: savedKb });
      app.globalData.selectedKbId = savedKb.id;
      return;
    }

    // 选择第一个可用知识库
    const first = this.data.knowledgeBases.find((k) => k.permission === "granted");
    if (first) {
      this.setData({ selectedKb: first });
      app.setSelectedKb(first);
    }
  },

  openKnowledge() {
    this.setData({ showKbSheet: true });
  },

  closeKbSheet() {
    this.setData({ showKbSheet: false });
  },

  noop() {},

  async selectKbFromSheet(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.knowledgeBases.find((kb) => kb.id === id);
    if (!item || item.permission === "denied") {
      wx.showToast({ title: "无访问权限", icon: "none" });
      return;
    }

    // 如果切换知识库且已有会话内容，提示开始新会话
    if (
      this.data.selectedKb &&
      this.data.selectedKb.id !== id &&
      this.data.messages.length > 0
    ) {
      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: "切换知识库",
          content: "切换知识库将开始新的会话，当前对话内容不会保留。",
          confirmText: "确认切换",
          cancelText: "取消",
          success: (res) => resolve(res.confirm),
        });
      });
      if (!confirmed) return;
    }

    const app = getApp();
    app.setSelectedKb(item);
    app.clearCurrentSession();

    this.setData({
      selectedKb: item,
      showKbSheet: false,
      messages: [],
      sessionId: "",
    });
  },

  // ===== 输入处理 =====

  onInput(e) {
    this.setData({ question: e.detail.value });
  },

  onSelectExample(e) {
    const question = e.currentTarget.dataset.question;
    this.sendQuestion(question);
  },

  onSend() {
    const question = this.data.question.trim();
    if (!question) {
      wx.showToast({ title: "请输入问题", icon: "none" });
      return;
    }
    this.sendQuestion(question);
  },

  // ===== 发送问题 =====

  /**
   * 默认使用 SSE 流式问答，fallback 时可用 sendQuestionNonStreaming。
   */
  async sendQuestion(question) {
    if (this.data.sending) return;

    const kbId = this.data.selectedKb ? this.data.selectedKb.id : "";
    if (!kbId) {
      wx.showToast({ title: "请先选择知识库", icon: "none" });
      return;
    }

    // 取消上一个流式请求
    if (this.data.streamTask) {
      this.data.streamTask.abort();
    }

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    };
    const loadingId = `a-stream-${Date.now()}`;
    const loadingMsg = {
      id: loadingId,
      role: "assistant",
      text: "",
      streaming: true,
    };

    this.setData({
      question: "",
      sending: true,
      messages: [...this.data.messages, userMsg, loadingMsg],
    });
    wx.pageScrollTo({ scrollTop: 9999, duration: 200 });

    const app = getApp();

    // 确保有会话
    let sessionId = this.data.sessionId;
    if (!sessionId) {
      try {
        const session = await createSession(kbId);
        sessionId = session.id || session.session_id;
        this.setData({ sessionId });
        app.globalData.currentSessionId = sessionId;
        app.setCurrentSession({ id: sessionId, kb_id: kbId });
      } catch (e) {
        this.setSendingError(loadingId, "创建会话失败，请重试", question);
        return;
      }
    }

    // 记录已追加内容，避免重复
    let streamedText = "";

    const { querySSE } = require("../../services/qa");
    const page = this;
    const task = querySSE({
      kbId,
      question,
      sessionId,
      onText: function (content) {
        streamedText += content;
        page.updateStreamMessage(loadingId, streamedText, false);
      },
      onDone: function (result) {
        const adaptedCitations = (result.citations || []).map(function (c) {
          return require("../../adapters/index").adaptCitation(c);
        });
        page.finalizeStreamMessage(loadingId, streamedText, result.message_id, adaptedCitations);
      },
      onError: function (err) {
        console.warn("[chat] SSE 失败，回退到非流式:", err.message);
        if (streamedText) {
          page.finalizeStreamMessage(loadingId, streamedText, "", []);
        } else {
          page.setData({
            messages: page.data.messages.filter(function (m) { return m.id !== loadingId; }),
          });
          page.sendQuestionNonStreaming(question, sessionId, kbId);
        }
      },
    });

    this.data.streamTask = task;
  },

  /**
   * 更新流式消息的内容
   */
  updateStreamMessage(loadingId, text, done) {
    const messages = this.data.messages.map((m) => {
      if (m.id === loadingId) {
        return {
          ...m,
          text,
          streaming: !done,
          loading: false,
        };
      }
      return m;
    });
    this.setData({ messages });
    // 不频繁滚动，仅在内容有显著变化时
  },

  /**
   * 完成流式消息
   */
  finalizeStreamMessage(loadingId, text, messageId, citations) {
    const messages = this.data.messages.map((m) => {
      if (m.id === loadingId) {
        return {
          ...m,
          id: messageId || m.id,
          text,
          streaming: false,
          loading: false,
          citations,
          citationExpanded: false,
          paragraphs: text
            ? require("../../adapters/index").parseContentToParagraphs(text)
            : [],
        };
      }
      return m;
    });
    this.setData({
      sending: false,
      messages,
      streamTask: null,
    });
    wx.pageScrollTo({ scrollTop: 9999, duration: 200 });
  },

  /**
   * 设置发送错误状态
   */
  setSendingError(loadingId, errorMsg, retryQuestion) {
    this.setData({
      sending: false,
      messages: this.data.messages.map((m) =>
        m.id === loadingId
          ? { ...m, streaming: false, loading: false, text: "", error: true, errorMsg, retryQuestion }
          : m
      ),
    });
  },

  /**
   * 非流式问答（回退路径）
   */
  async sendQuestionNonStreaming(question, sessionId, kbId) {

    const loadingMsg = {
      id: `a-ns-${Date.now()}`,
      role: "assistant",
      text: "",
      loading: true,
    };

    this.setData({
      sending: true,
      messages: [...this.data.messages, loadingMsg],
    });

    try {
      const result = await query({ kbId, question, sessionId });
      const adaptedMsg = adaptMessage({
        id: result.message_id || result.id || `a-${Date.now()}`,
        session_id: sessionId,
        role: "assistant",
        content: result.content || result.answer || "",
        citations: result.citations || [],
        feedback_status: "",
        low_confidence: result.low_confidence || false,
        status_code: result.status_code || "",
        created_at: new Date().toISOString(),
      });

      this.setData({
        sending: false,
        messages: this.data.messages.map((m) =>
          m.id === loadingMsg.id ? { ...adaptedMsg, loading: false } : m
        ),
      });
      wx.pageScrollTo({ scrollTop: 9999, duration: 200 });
    } catch (err) {
      this.setSendingError(loadingMsg.id, err.message || "请求失败", question);
    }
  },

  // ===== 消息操作 =====

  toggleCitations(e) {
    // 每条消息独立管理展开状态
    const msgId = e.currentTarget.dataset.msgId;
    const messages = this.data.messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, citationExpanded: !m.citationExpanded };
      }
      return m;
    });
    this.setData({ messages });
  },

  openCitation(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const cid = e.currentTarget.dataset.cid;
    const sessionId = this.data.sessionId;
    wx.navigateTo({
      url: `/pages/citation/detail?sessionId=${sessionId}&messageId=${msgId}&citationId=${cid}`,
    });
  },

  submitFeedback(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const sessionId = this.data.sessionId;
    const question = this.data.messages
      .filter((m) => m.role === "user")
      .slice(-1)
      .map((m) => m.text)[0] || "";
    const answer = this.data.messages
      .filter((m) => m.role === "assistant" && m.id === msgId)
      .map((m) => m.text)[0] || "";

    wx.navigateTo({
      url: `/pages/feedback/submit?sessionId=${sessionId}&messageId=${msgId}&question=${encodeURIComponent(question)}&answer=${encodeURIComponent(answer)}`,
    });
  },

  async copyAnswer(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const msg = this.data.messages.find((m) => m.id === msgId);
    if (!msg) return;
    wx.setClipboardData({
      data: msg.text,
      success: () => wx.showToast({ title: "已复制" }),
    });
  },

  async markHelpful(e) {
    const value = e.currentTarget.dataset.value;
    const msgId = e.currentTarget.dataset.msgId;

    // 防止重复提交
    const msg = this.data.messages.find((m) => m.id === msgId);
    if (!msg || msg.feedbackStatus === value) return;

    const { submitFeedback } = require("../../services/qa");
    const sessionId = this.data.sessionId;

    if (!sessionId) {
      wx.showToast({ title: "会话未创建，请先发送问题", icon: "none" });
      return;
    }

    try {
      // 简单点赞/点踩使用 like/dislike
      await submitFeedback(sessionId, msgId, value);
      // 更新本地消息反馈状态
      const messages = this.data.messages.map((m) => {
        if (m.id === msgId) {
          return { ...m, feedbackStatus: value };
        }
        return m;
      });
      this.setData({ messages });
      wx.showToast({
        title: value === "like" ? "已标记有用" : "感谢反馈",
        icon: "none",
      });
    } catch (err) {
      wx.showToast({ title: err.message || "反馈失败", icon: "none" });
    }
  },

  async regenerate() {
    // 重新生成：使用最后一个用户问题重新请求
    const userMsgs = this.data.messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) {
      wx.showToast({ title: "没有可重新生成的问题", icon: "none" });
      return;
    }
    const lastQuestion = userMsgs[userMsgs.length - 1].text;
    // 移除最后一条 assistant 消息
    const messages = this.data.messages.slice(0, -1);
    this.setData({ messages });
    this.sendQuestion(lastQuestion);
  },

  voiceInput() {
    wx.showToast({ title: "语音输入暂未开放", icon: "none" });
  },

  openFiles() {
    wx.navigateTo({ url: "/pages/files/index" });
  },

  // 重试失败的消息
  retryMessage(e) {
    const question = e.currentTarget.dataset.question;
    if (question) {
      this.sendQuestion(question);
    }
  },
});
