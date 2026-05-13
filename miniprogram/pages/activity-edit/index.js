const {
  buildActivityDetailRoute,
  getActivityById,
  isAdminUnlocked,
  updateActivity,
} = require("../../utils/activity-store");
const { chooseAndUploadImages } = require("../../utils/activity-image");

Page({
  data: {
    activityId: "",
    bannerTitle: "",
    title: "",
    description: "",
    conclusion: "",
    startTime: "",
    endTime: "",
    routeUrl: "",
    images: [],
    isBanner: true,
    isUploading: false,
  },
  onLoad(options) {
    this.activityId = options.id || "";
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

    const activity = getActivityById(this.activityId);

    if (!activity) {
      wx.showToast({
        title: "未找到活动",
        icon: "none",
      });
      wx.navigateBack();
      return;
    }

    this.setData({
      activityId: activity.id,
      bannerTitle: activity.bannerTitle,
      title: activity.title,
      description: activity.description,
      conclusion: activity.conclusion,
      startTime: activity.startTime,
      endTime: activity.endTime,
      routeUrl: activity.routeUrl,
      images: activity.images,
      isBanner: activity.isBanner,
    });
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
      routeUrl: buildActivityDetailRoute(this.data.activityId),
    });
  },
  async onUploadImages() {
    const remainingCount = 9 - this.data.images.length;

    if (remainingCount <= 0) {
      wx.showToast({
        title: "最多上传 9 张图片",
        icon: "none",
      });
      return;
    }

    this.setData({ isUploading: true });
    wx.showLoading({ title: "上传中..." });

    try {
      const uploadedImages = await chooseAndUploadImages(remainingCount);
      this.setData({
        images: [...this.data.images, ...uploadedImages],
      });
    } catch (error) {
      wx.showToast({
        title: "图片上传失败",
        icon: "none",
      });
    } finally {
      this.setData({ isUploading: false });
      wx.hideLoading();
    }
  },
  onRemoveImage(event) {
    const { index } = event.currentTarget.dataset;
    const nextImages = this.data.images.filter((_, currentIndex) => currentIndex !== Number(index));

    this.setData({
      images: nextImages,
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

    if (!routeUrl.startsWith("/pages/")) {
      wx.showToast({
        title: "请使用 /pages/ 路由",
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

    updateActivity(this.data.activityId, {
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
      title: "活动已保存",
      icon: "success",
    });

    wx.navigateBack();
  },
});
