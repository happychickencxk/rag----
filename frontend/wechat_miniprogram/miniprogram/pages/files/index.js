const initialFiles = [
  {
    id: "file-1",
    name: "员工手册 v4.2.pdf",
    meta: "PDF · 1.8 MB · 人事制度库",
    status: "可下载",
  },
  {
    id: "file-2",
    name: "售后退换货流程.docx",
    meta: "Word · 640 KB · 售后知识库",
    status: "可下载",
  },
  {
    id: "file-3",
    name: "产品安装参数表.xlsx",
    meta: "Excel · 320 KB · 产品资料库",
    status: "处理中",
  },
];

Page({
  data: {
    files: initialFiles,
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 5,
      type: "file",
      success: ({ tempFiles = [] }) => {
        const selectedFiles = tempFiles.map((file, index) => ({
          id: `local-${Date.now()}-${index}`,
          name: file.name,
          meta: `${this.formatSize(file.size)} · 待选择知识库`,
          status: "待上传",
          tempFilePath: file.path,
        }));
        this.setData({
          files: [...selectedFiles, ...this.data.files],
        });
      },
    });
  },

  downloadFile(e) {
    const file = this.data.files.find((item) => item.id === e.currentTarget.dataset.id);
    if (!file || file.status !== "可下载") {
      wx.showToast({ title: "文件暂不可下载", icon: "none" });
      return;
    }
    wx.showToast({ title: "待接入文件下载接口", icon: "none" });
  },

  formatSize(size) {
    if (size >= 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }
    return `${Math.max(Math.round(size / 1024), 1)} KB`;
  },
});
