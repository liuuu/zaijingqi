const { loadActivity } = require("../../utils/activity-store");

function buildSharePath(activityId) {
  const trimmedActivityId = String(activityId || "").trim();

  if (!trimmedActivityId) {
    return "/pages/activities/index";
  }

  return `/pages/activity-detail/index?id=${encodeURIComponent(trimmedActivityId)}`;
}

Page({
  data: {
    activity: null,
    galleryImages: [],
  },
  onLoad(options) {
    this.activityId = options.id || "";
    console.log("options.id", options.id);
  },
  async onShow() {
    const data = await loadActivity(this.activityId);
    console.log("data", data);

    if (!data) {
      wx.showToast({
        title: "未找到活动",
        icon: "none",
      });
      wx.switchTab({
        url: "/pages/activities/index",
      });
      return;
    }

    const galleryImages = (data.images || []).map((image) => ({
      url: image,
      value: image,
    }));

    this.setData({
      activity: data,
      galleryImages,
    });
  },
  buildShareInfo() {
    const { activity } = this.data;
    const title =
      activity && activity.title ? `${activity.title}｜活动详情` : "活动详情";

    const info = {
      title,
      path: buildSharePath(activity && activity.id),
      imageUrl: activity && activity.bannerUrl ? activity.bannerUrl : undefined,
    };

    console.log("info", info);
    return info;
  },
  onImageTap() {
    const { activity } = this.data;
    if (!activity || !activity.bannerUrl) {
      return;
    }
    wx.previewImage({
      urls: [activity.bannerUrl],
      current: activity.bannerUrl,
    });
  },
  onActivityImageTap(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: this.data.galleryImages.map((v) => v.url),
      current: this.data.galleryImages[index].url,
    });
  },
  onShareAppMessage() {
    return this.buildShareInfo();
  },
  onShareTimeline() {
    const shareInfo = this.buildShareInfo();
    return {
      title: shareInfo.title,
      query: this.activityId ? `id=${encodeURIComponent(this.activityId)}` : "",
      imageUrl: shareInfo.imageUrl,
    };
  },
});
