const {
  loadActivities,
  isAdminUnlocked,
} = require("../../utils/activity-store");

Page({
  data: {
    activities: [],
  },
  onLoad() {
    return;
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "fetchUsers",
        },
      })
      .then((res) => {
        console.log("fetchUsers res", res);
      });
  },
  async onShow() {
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

    const data = await loadActivities();
    console.log("data", data);
    this.setData({
      activities: data,
    });
  },
  onCreateActivity() {
    wx.navigateTo({
      url: "/pages/activity-create/index",
    });
  },
  onEditActivity(event) {
    const { id } = event.currentTarget.dataset;
    console.log("id", id);

    wx.navigateTo({
      url: `/pages/activity-create/index?id=${id}`,
    });
  },
  onPreviewActivity(event) {
    const { id } = event.currentTarget.dataset;

    wx.navigateTo({
      url: `/pages/activity-detail/index?id=${id}`,
    });
  },
});
