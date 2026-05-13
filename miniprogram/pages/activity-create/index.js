const {
  createActivity,
  isAdminUnlocked,
  normalizeImageList,
} = require("../../utils/activity-store");

Page({
  data: {
    bannerTitle: "",
    title: "",
    description: "",
    conclusion: "",
    startTime: "",
    endTime: "",
    routeUrl: "",
    imagesText: "/images/zaijingqi.JPG",
    isBanner: true,
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
  onSave() {
    const bannerTitle = String(this.data.bannerTitle || "").trim();
    const title = String(this.data.title || "").trim();
    const description = String(this.data.description || "").trim();
    const conclusion = String(this.data.conclusion || "").trim();
    const startTime = String(this.data.startTime || "").trim();
    const endTime = String(this.data.endTime || "").trim();
    const images = normalizeImageList(this.data.imagesText);
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

    if (images.length === 0) {
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
      images,
      isBanner: this.data.isBanner,
    });

    wx.showToast({
      title: "活动已创建",
      icon: "success",
    });

    wx.navigateBack();
  },
});
