const {
  loadActivitiesPage,
  isAdminUnlocked,
  deleteActivity,
} = require("../../utils/activity-store");

const PAGE_SIZE = 10;

Page({
  data: {
    activities: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
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

    await this.loadActivities(true);
  },
  async onPullDownRefresh() {
    await this.loadActivities(true);
    wx.stopPullDownRefresh();
  },
  onReachBottom() {
    this.loadActivities(false);
  },
  async loadActivities(reset = false) {
    if (this.data.loading || this.data.loadingMore) {
      return;
    }

    if (!reset && !this.data.hasMore) {
      return;
    }

    const nextPage = reset ? 1 : this.data.page;
    const loadingKey = reset ? "loading" : "loadingMore";

    this.setData({
      [loadingKey]: true,
    });

    try {
      const activities = await loadActivitiesPage(nextPage, PAGE_SIZE);
      const mergedActivities = reset
        ? activities
        : [...this.data.activities, ...activities];

      this.setData({
        activities: mergedActivities,
        page: nextPage + 1,
        hasMore: activities.length === PAGE_SIZE,
      });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "加载失败",
        icon: "none",
      });
    } finally {
      this.setData({
        [loadingKey]: false,
      });
    }
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
      await this.loadActivities(true);
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
