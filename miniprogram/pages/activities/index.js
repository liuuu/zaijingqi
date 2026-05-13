const {
  getActivities,
  getBannerActivities,
  loadActivities,
} = require("../../utils/activity-store");

const TAB_BAR_PAGES = [
  "/pages/activities/index",
  "/pages/index/index",
  "/pages/mine/index",
];

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

  const navigationMethod = TAB_BAR_PAGES.includes(routePath)
    ? "switchTab"
    : "navigateTo";

  wx[navigationMethod]({
    url: navigationMethod === "switchTab" ? routePath : nextRoute,
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
    title: "活动",
    description: "点击顶部轮播或下方列表，打开对应活动详情页。",
    imageProps: {
      mode: "aspectFill",
    },
    activities: [],
    bannerActivities: [],
    swiperList: [],
    currentBannerIndex: 0,
  },
  syncActivities() {
    const activities = getActivities();
    const bannerActivities = getBannerActivities();
    const swiperList = bannerActivities.map((activity) => ({
      value: activity.bannerImage,
      ariaLabel: activity.bannerTitle || activity.title,
    }));

    this.setData({
      activities,
      bannerActivities,
      swiperList,
      currentBannerIndex:
        bannerActivities.length === 0
          ? 0
          : Math.min(this.data.currentBannerIndex, bannerActivities.length - 1),
    });
  },
  async onShow() {
    await loadActivities();
    this.syncActivities();
  },
  async onPullDownRefresh() {
    await loadActivities();
    this.syncActivities();
    wx.stopPullDownRefresh();
  },
  onBannerChange(event) {
    this.setData({
      currentBannerIndex: event.detail.current || 0,
    });
  },
  onOpenBanner() {
    const activeBanner =
      this.data.bannerActivities[this.data.currentBannerIndex] ||
      this.data.bannerActivities[0];

    if (!activeBanner) {
      return;
    }

    openRoute(activeBanner.routeUrl);
  },
  onOpenActivity(event) {
    const { routeUrl } = event.currentTarget.dataset;
    openRoute(routeUrl);
  },
});
