const { getActivityById, loadActivities } = require("../../utils/activity-store");

Page({
  data: {
    activity: null,
    galleryImages: [],
  },
  onLoad(options) {
    this.activityId = options.id || "";
  },
  async onShow() {
    await loadActivities();
    const activity = getActivityById(this.activityId);

    if (!activity) {
      wx.showToast({
        title: "未找到活动",
        icon: "none",
      });
      wx.switchTab({
        url: "/pages/activities/index",
      });
      return;
    }

    this.setData({
      activity,
      galleryImages: activity.images.map((image) => ({
        value: image,
        ariaLabel: activity.title,
      })),
    });
  },
});
