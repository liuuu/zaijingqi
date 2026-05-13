const {
  buildActivityDetailRoute,
  getActivityById,
  isAdminUnlocked,
  normalizeImageList,
  updateActivity,
} = require("../../utils/activity-store");

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
    imagesText: "",
    isBanner: true,
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
      imagesText: activity.images.join("\n"),
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
  onSave() {
    const bannerTitle = String(this.data.bannerTitle || "").trim();
    const title = String(this.data.title || "").trim();
    const description = String(this.data.description || "").trim();
    const conclusion = String(this.data.conclusion || "").trim();
    const startTime = String(this.data.startTime || "").trim();
    const endTime = String(this.data.endTime || "").trim();
    const routeUrl = String(this.data.routeUrl || "").trim();
    const images = normalizeImageList(this.data.imagesText);

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

    if (images.length === 0) {
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
      images,
      isBanner: this.data.isBanner,
    });

    wx.showToast({
      title: "活动已保存",
      icon: "success",
    });

    wx.navigateBack();
  },
});
