const {
  createActivity,
  isAdminUnlocked,
} = require("../../utils/activity-store");
const {
  getUploadUrls,
  uploadImageFile,
} = require("../../utils/activity-image");

Page({
  data: {
    bannerTitle: "",
    title: "",
    description: "",
    conclusion: "",
    startTime: "",
    endTime: "",
    routeUrl: "",
    images: [],
    uploadFiles: [],
    isBanner: true,
    isUploading: false,
    gridConfig: {
      column: 4,
      width: 160,
      height: 160,
    },
    uploadConfig: {
      count: 9,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
    },
  },
  onShow() {
    if (!isAdminUnlocked()) {
      wx.showToast({
        title: "请先输入密码",
        icon: "none",
      });
      wx.switchTab({
        url: "/pages/mine/index",
      });
      return;
    }
  },
  onFieldInput(event) {
    const { field } = event.currentTarget.dataset;

    this.setData({
      [field]: event.detail.value,
    });
  },
  onBannerChange(event) {
    this.setData({
      isBanner: event.detail.value,
    });
  },
  onUseDetailRoute() {
    this.setData({
      routeUrl: "",
    });
  },
  onUploadSuccess(event) {
    const uploadedFiles = event.detail.files || [];

    this.setData({
      uploadFiles: uploadedFiles,
      images: getUploadUrls(uploadedFiles),
    });
  },
  async onUploadAdd(event) {
    const selectedFiles = event.detail.files || [];

    if (!selectedFiles.length) {
      return;
    }

    const previousFiles = [...this.data.uploadFiles];
    this.setData({ isUploading: true });
    wx.showLoading({ title: "上传中..." });

    try {
      const nextFiles = [...this.data.uploadFiles];

      for (const file of selectedFiles) {
        const result = await uploadImageFile(file.url);
        const uploadedFile = {
          ...file,
          url: result.fileID,
          status: "done",
          percent: 100,
        };
        const index = nextFiles.findIndex((item) => item.name === uploadedFile.name);

        if (index >= 0) {
          nextFiles[index] = uploadedFile;
        } else {
          nextFiles.push(uploadedFile);
        }
      }

      this.setData({
        uploadFiles: nextFiles,
        images: getUploadUrls(nextFiles),
      });
    } catch (error) {
      this.setData({
        uploadFiles: previousFiles,
        images: getUploadUrls(previousFiles),
      });
      wx.showToast({
        title: "图片上传失败",
        icon: "none",
      });
    } finally {
      this.setData({ isUploading: false });
      wx.hideLoading();
    }
  },
  onUploadRemove(event) {
    const { index } = event.currentTarget.dataset;
    const nextFiles = this.data.uploadFiles.filter(
      (_, currentIndex) => currentIndex !== Number(index),
    );

    this.setData({
      uploadFiles: nextFiles,
      images: getUploadUrls(nextFiles),
    });
  },
  onSave() {
    const bannerTitle = String(this.data.bannerTitle || "").trim();
    const title = String(this.data.title || "").trim();
    const description = String(this.data.description || "").trim();
    const conclusion = String(this.data.conclusion || "").trim();
    const startTime = String(this.data.startTime || "").trim();
    const endTime = String(this.data.endTime || "").trim();
    const routeUrl = String(this.data.routeUrl || "").trim();

    if (!bannerTitle) {
      wx.showToast({
        title: "请填写轮播标题",
        icon: "none",
      });
      return;
    }

    if (!title) {
      wx.showToast({
        title: "请填写标题",
        icon: "none",
      });
      return;
    }

    if (this.data.images.length === 0) {
      wx.showToast({
        title: "请至少添加一张图片",
        icon: "none",
      });
      return;
    }

    if (routeUrl && !routeUrl.startsWith("/pages/")) {
      wx.showToast({
        title: "请使用 /pages/ 路由",
        icon: "none",
      });
      return;
    }

    createActivity({
      bannerTitle,
      title,
      description,
      conclusion,
      startTime,
      endTime,
      routeUrl,
      images: this.data.images,
      isBanner: this.data.isBanner,
    });

    wx.showToast({
      title: "活动已创建",
      icon: "success",
    });

    wx.navigateBack();
  },
});
