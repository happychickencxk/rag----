const {
  upload,
  downloadDocument,
} = require("../../services/document");
const { getKnowledgeBases } = require("../../services/knowledge");
const { adaptKnowledgeBasePage } = require("../../adapters/index");
const storage = require("../../utils/storage");
const {
  getExtension,
  validateFile,
  formatFileSize,
} = require("../../utils/file-validation");

Page({
  data: {
    files: [],
    // 当前知识库
    knowledgeBases: [],
    selectedKbId: "",
    selectedKbName: "",
    // 知识库选择弹层
    showKbPicker: false,
    pendingFilePath: null,
    pendingFileName: "",
    pendingFileSize: 0,
    canUpload: false,
  },

  onShow() {
    const app = getApp();
    const kbId = app.globalData.selectedKbId || "";
    const savedKb = storage.getCurrentKb();
    const kbName = savedKb ? savedKb.name : "";
    const user = storage.getUserInfo() || {};

    this.setData({
      selectedKbId: kbId,
      selectedKbName: kbName,
      canUpload: this.hasUploadPermission(user),
    });

    this.loadKnowledgeBases();
  },

  async loadKnowledgeBases() {
    try {
      const result = await getKnowledgeBases({ size: 50 });
      const adapted = adaptKnowledgeBasePage(result);
      this.setData({ knowledgeBases: adapted.list });
    } catch (e) {
      // KB 列表失败不影响文件操作
    }
  },

  /**
   * 选择文件
   */
  chooseFile() {
    if (!this.data.canUpload) {
      wx.showToast({
        title: "当前账号没有文件上传权限",
        icon: "none",
      });
      return;
    }

    wx.chooseMessageFile({
      count: 1,
      type: "file",
      success: ({ tempFiles = [] }) => {
        if (!tempFiles.length) return;

        const file = tempFiles[0];
        const validation = validateFile(file.name, file.size);
        if (!validation.valid) {
          this.addRejectedFile(file, validation.reason);
          wx.showModal({
            title: "文件未上传",
            content: `${validation.reason}。可在文件列表中撤销本次记录。`,
            showCancel: false,
            confirmText: "知道了",
          });
          return;
        }

        // 检查是否选择了知识库
        if (!this.data.selectedKbId) {
          // 保存文件路径，弹出知识库选择
          this.setData({
            pendingFilePath: file.path,
            pendingFileName: file.name,
            pendingFileSize: file.size,
            showKbPicker: true,
          });
          return;
        }

        // 添加上传任务
        this.addFileTask(
          file,
          validation.extension,
          formatFileSize(file.size)
        );
      },
    });
  },

  /**
   * 记录被前端拦截的文件，便于用户明确撤销本次选择。
   */
  addRejectedFile(file, reason) {
    const extension = getExtension(file.name);
    const task = {
      id: `file-invalid-${Date.now()}`,
      name: file.name,
      meta: `${(extension || "未知").toUpperCase()} · ${formatFileSize(file.size)} · 未上传`,
      status: "invalid",
      statusText: "格式不支持",
      tempFilePath: "",
      errorMsg: reason,
    };
    this.setData({ files: [task, ...this.data.files] });
  },

  /**
   * 添加文件上传任务
   */
  addFileTask(file, ext, sizeText) {
    const task = {
      id: `file-${Date.now()}`,
      name: file.name,
      meta: `${ext.toUpperCase()} · ${sizeText} · ${this.data.selectedKbName || "当前知识库"}`,
      status: "pending", // pending | uploading | success | failed
      statusText: "待上传",
      tempFilePath: file.path,
      errorMsg: "",
    };

    const files = [task, ...this.data.files];
    this.setData({ files });

    // 自动开始上传
    this.startUpload(task.id);
  },

  /**
   * 开始上传文件
   */
  async startUpload(fileId) {
    const file = this.data.files.find((f) => f.id === fileId);
    if (!file || file.status !== "pending") return;

    // 更新状态为上传中
    this.updateFileStatus(fileId, "uploading", "上传中...");

    try {
      const result = await upload({
        filePath: file.tempFilePath,
        fileName: file.name,
        kbId: this.data.selectedKbId,
      });
      this.updateFileStatus(fileId, "success", "上传成功", "", {
        documentId: result.doc_id || result.id || "",
      });
    } catch (err) {
      let errorMsg = err.message || "上传失败";
      if (err.httpStatus === 401) {
        errorMsg = "登录已过期，请重新登录";
      } else if (err.httpStatus === 403) {
        errorMsg = "无权限上传文件到该知识库";
      } else if (err.httpStatus === 413) {
        errorMsg = "文件超过大小限制";
      }
      this.updateFileStatus(fileId, "failed", "上传失败", errorMsg);
    }
  },

  /**
   * 更新文件状态
   */
  updateFileStatus(fileId, status, statusText, errorMsg, extra) {
    const files = this.data.files.map((f) => {
      if (f.id === fileId) {
        return {
          ...f,
          ...(extra || {}),
          status,
          statusText,
          errorMsg: errorMsg || "",
        };
      }
      return f;
    });
    this.setData({ files });
  },

  /**
   * 重试上传
   */
  retryUpload(e) {
    const fileId = e.currentTarget.dataset.id;
    const file = this.data.files.find((f) => f.id === fileId);
    if (!file) return;
    this.updateFileStatus(fileId, "pending", "待上传");
    this.startUpload(fileId);
  },

  /**
   * 撤销未上传或上传失败的本地任务记录。
   */
  removeFileTask(e) {
    const fileId = e.currentTarget.dataset.id;
    const file = this.data.files.find((item) => item.id === fileId);
    if (!file || !["invalid", "failed", "pending"].includes(file.status)) {
      wx.showToast({ title: "当前文件不可撤销", icon: "none" });
      return;
    }
    this.setData({
      files: this.data.files.filter((item) => item.id !== fileId),
    });
    wx.showToast({ title: "已撤销", icon: "success" });
  },

  /**
   * 通过后端安全下载接口获取并打开文件。
   */
  async downloadFile(e) {
    const fileId = e.currentTarget.dataset.id;
    const file = this.data.files.find((f) => f.id === fileId);
    if (!file) return;

    if (file.status !== "success") {
      wx.showToast({ title: "文件尚未上传成功，不可下载", icon: "none" });
      return;
    }
    if (!file.documentId) {
      wx.showToast({ title: "缺少文档标识，请刷新后重试", icon: "none" });
      return;
    }

    wx.showLoading({ title: "下载中..." });
    try {
      await downloadDocument(file.documentId, file.name);
    } catch (err) {
      wx.showToast({ title: err.message || "下载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 知识库选择弹层
   */
  openKbPicker() {
    this.setData({ showKbPicker: true });
  },

  noop() {},

  selectKbForUpload(e) {
    const id = e.currentTarget.dataset.id;
    const kb = this.data.knowledgeBases.find((k) => k.id === id);
    if (!kb || kb.permission === "denied") {
      wx.showToast({ title: "无权限上传到该知识库", icon: "none" });
      return;
    }

    const app = getApp();
    app.setSelectedKb(kb);
    app.clearCurrentSession();

    this.setData({
      selectedKbId: kb.id,
      selectedKbName: kb.name,
      showKbPicker: false,
    });

    // 继续上传之前选择的文件
    if (this.data.pendingFilePath) {
      const ext = getExtension(this.data.pendingFileName);
      this.addFileTask(
        {
          path: this.data.pendingFilePath,
          name: this.data.pendingFileName,
          size: this.data.pendingFileSize,
        },
        ext,
        formatFileSize(this.data.pendingFileSize)
      );
      this.setData({
        pendingFilePath: null,
        pendingFileName: "",
        pendingFileSize: 0,
      });
    }
  },

  closeKbPicker() {
    this.setData({
      showKbPicker: false,
      pendingFilePath: null,
      pendingFileName: "",
      pendingFileSize: 0,
    });
  },

  hasUploadPermission(user) {
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    return user.role === "admin" || permissions.includes("*");
  },
});
