const { getActivityById } = require("../../utils/activity-store");

Page({
  data: {
    activity: null,
    swiperList: [],
    imageProps: {
      mode: "aspectFill",
    },
  },
  onLoad(options) {
    this.activityId = options.id || "";
  },
  onShow() {
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
      swiperList: activity.images.map((image) => ({
        value: image,
        ariaLabel: activity.title,
      })),
    });
  },
});
