const { loadActivities } = require("../../utils/activity-store");

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
    swiperList: [],
    currentBannerIndex: 0,
  },
  async loadActivities() {},
  async onShow() {
    const data = await loadActivities();
    this.setData({
      activities: data,
      swiperList: data.map((v) => v.bannerUrl).filter(Boolean),
    });
  },
  async onPullDownRefresh() {
    await loadActivities();
    wx.stopPullDownRefresh();
  },
  onBannerChange(event) {},
  onOpenBanner() {
    openRoute(activeBanner.routeUrl);
  },
  onOpenActivity(event) {
    const { routeUrl } = event.currentTarget.dataset;
    openRoute(routeUrl);
  },
});
