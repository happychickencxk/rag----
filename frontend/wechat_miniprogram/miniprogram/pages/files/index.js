const { upload } = require("../../services/document");
const { getKnowledgeBases } = require("../../services/knowledge");
const { adaptKnowledgeBasePage } = require("../../adapters/index");
const storage = require("../../utils/storage");

// 允许的文件类型
const ALLOWED_TYPES = ["pdf", "docx", "md", "txt", "html", "csv"];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

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
  },

  onShow() {
    const app = getApp();
    const kbId = app.globalData.selectedKbId || "";
    const savedKb = storage.getCurrentKb();
    const kbName = savedKb ? savedKb.name : "";

    this.setData({
      selectedKbId: kbId,
      selectedKbName: kbName,
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
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      success: ({ tempFiles = [] }) => {
        if (!tempFiles.length) return;

        const file = tempFiles[0];
        const ext = this.getExtension(file.name);
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);

        // 校验扩展名
        if (!ext || !ALLOWED_TYPES.includes(ext)) {
          wx.showToast({
            title: `不支持 ${(ext || '未知').toUpperCase()} 格式，仅支持 PDF、DOCX、MD、TXT、HTML、CSV`,
            icon: "none",
            duration: 3000,
          });
          return;
        }

        // 校验大小
        if (file.size > MAX_SIZE) {
          wx.showToast({
            title: `文件过大（${sizeMB}MB），超过 20MB 限制`,
            icon: "none",
            duration: 3000,
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
        this.addFileTask(file, ext, sizeMB);
      },
    });
  },

  /**
   * 添加文件上传任务
   */
  addFileTask(file, ext, sizeMB) {
    const task = {
      id: `file-${Date.now()}`,
      name: file.name,
      meta: `${ext.toUpperCase()} · ${sizeMB}MB · ${this.data.selectedKbName || '当前知识库'}`,
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
      await upload({
        filePath: file.tempFilePath,
        kbId: this.data.selectedKbId,
      });
      this.updateFileStatus(fileId, "success", "上传成功");
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
  updateFileStatus(fileId, status, statusText, errorMsg) {
    const files = this.data.files.map((f) => {
      if (f.id === fileId) {
        return { ...f, status, statusText, errorMsg: errorMsg || "" };
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
   * 下载文件 - 当前接口没有安全下载 URL
   */
  downloadFile(e) {
    const fileId = e.currentTarget.dataset.id;
    const file = this.data.files.find((f) => f.id === fileId);
    if (!file) return;

    if (file.status !== "success") {
      wx.showToast({ title: "文件尚未上传成功，不可下载", icon: "none" });
      return;
    }

    // 当前契约没有安全下载接口，storage_path 不能作为客户端下载地址
    wx.showModal({
      title: "暂不可下载",
      content: "当前接口未提供安全下载地址，文件下载功能暂不可用。如需下载，请联系管理员。",
      showCancel: false,
    });
  },

  /**
   * 知识库选择弹层
   */
  selectKbForUpload(e) {
    const id = e.currentTarget.dataset.id;
    const kb = this.data.knowledgeBases.find((k) => k.id === id);
    if (!kb || kb.permission === "denied") {
      wx.showToast({ title: "无权限上传到该知识库", icon: "none" });
      return;
    }

    const app = getApp();
    app.setSelectedKb(kb);

    this.setData({
      selectedKbId: kb.id,
      selectedKbName: kb.name,
      showKbPicker: false,
    });

    // 继续上传之前选择的文件
    if (this.data.pendingFilePath) {
      const ext = this.getExtension(this.data.pendingFileName);
      const sizeMB = (this.data.pendingFileSize / 1024 / 1024).toFixed(1);
      this.addFileTask(
        {
          path: this.data.pendingFilePath,
          name: this.data.pendingFileName,
          size: this.data.pendingFileSize,
        },
        ext,
        sizeMB
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

  getExtension(name) {
    const idx = name.lastIndexOf(".");
    if (idx === -1 || idx === name.length - 1) return "";
    return name.substring(idx + 1).toLowerCase();
  },

  formatSize(size) {
    if (size >= 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }
    return `${Math.max(Math.round(size / 1024), 1)} KB`;
  },
});
