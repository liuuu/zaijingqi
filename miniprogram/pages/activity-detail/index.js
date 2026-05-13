const { loadActivity } = require("../../utils/activity-store");

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

    console.log("galleryImages", galleryImages);

    this.setData({
      activity: data,
      galleryImages,
    });
  },
});
