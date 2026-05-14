const {
  loadRecentActivities,
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
      mode: "aspectFit",
    },
    activities: [],
    swiperList: [],
    currentBannerIndex: 0,
    activeBanner: null,
  },
  async loadActivities() {
    const data = await loadRecentActivities();
    this.setData({
      activities: data,
      swiperList: data.map((v) => v.bannerUrl).filter(Boolean),
      activeBanner: data[0] || null,
    });
  },
  async onLoad() {
    console.log("onLoad");
    await this.loadActivities();
  },
  async onPullDownRefresh() {
    await this.loadActivities();
    wx.stopPullDownRefresh();
  },
  onBannerChange(event) {
    const currentIdx = event.detail.current || 0;
    const activeBanner = this.data.activities[currentIdx] || null;
    this.setData({
      currentBannerIndex: currentIdx,
      activeBanner,
    });
  },
  onOpenBanner() {
    const { activeBanner } = this.data;
    const routeUrl = `/pages/activity-detail/index?id=${activeBanner.id}`;
    openRoute(routeUrl);
  },
  onOpenActivity(event) {
    console.log("event", event.detail.activity);
    // TODO: why this works? is activity id missing in event.detail.activity?
    if (event.detail.activity && event.detail.activity.id) {
      const routeUrl = `/pages/activity-detail/index?id=${event.detail.activity.id}`;
      openRoute(routeUrl);
    }
  },
});
