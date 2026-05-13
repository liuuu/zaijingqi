const {
  loadActivities,
  isAdminUnlocked,
  deleteActivity,
} = require("../../utils/activity-store");

Page({
  data: {
    activities: [],
    deletingActivityId: "",
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
  async onDeleteActivity(event) {
    const { id } = event.currentTarget.dataset;
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "删除活动",
        content: "确定要删除这个活动吗？删除后无法恢复。",
        confirmText: "删除",
        confirmColor: "#e34d59",
        success(res) {
          resolve(Boolean(res.confirm));
        },
        fail() {
          resolve(false);
        },
      });
    });

    if (!confirm) return;

    this.setData({
      deletingActivityId: id,
    });

    wx.showLoading({ title: "删除中..." });

    try {
      await deleteActivity(id);
      const activities = await loadActivities();
      this.setData({
        activities,
      });
      wx.showToast({
        title: "已删除",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "删除失败",
        icon: "none",
      });
    } finally {
      this.setData({
        deletingActivityId: "",
      });
      wx.hideLoading();
    }
  },
});
