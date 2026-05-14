const { loadActivitiesPage } = require("../../utils/activity-store");

const PAGE_SIZE = 10;

function openRoute(routeUrl) {
  const nextRoute = String(routeUrl || "").trim();
  const routePath = nextRoute.split("?")[0];

  if (!routePath.startsWith("/pages/")) {
    wx.showToast({
      title: "路由无效",
      icon: "none",
    });
    return;
  }

  wx.navigateTo({
    url: nextRoute,
    fail() {
      wx.showToast({
        title: "页面打开失败",
        icon: "none",
      });
    },
  });
}

Page({
  data: {
    activities: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    empty: false,
  },
  async onLoad() {
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
        empty: mergedActivities.length === 0,
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
  onOpenActivity(event) {
    const activityId =
      event?.detail?.activity?.id || event?.currentTarget?.dataset?.id || "";

    if (activityId) {
      openRoute(`/pages/activity-detail/index?id=${activityId}`);
    }
  },
});
