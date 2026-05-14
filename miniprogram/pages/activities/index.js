const {
  loadRecentActivities,
  loadRecentEndActivities,
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
    reviewActivities: [],
  },
  async loadActivities() {
    const [activities, reviewActivities] = await Promise.all([
      loadRecentActivities(),
      loadRecentEndActivities(),
    ]);

    console.log("reviewActivities", reviewActivities);
    this.setData({
      activities,
      swiperList: activities.map((v) => v.bannerUrl).filter(Boolean),
      activeBanner: activities[0] || null,
      reviewActivities,
    });
  },
  onOpenAllActivities() {
    openRoute("/pages/activity-list/index");
  },
  async onLoad() {
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
    if (!activeBanner || !activeBanner.id) {
      return;
    }
    openRoute(`/pages/activity-detail/index?id=${activeBanner.id}`);
  },
  onOpenActivity(event) {
    const activityId =
      event?.detail?.activity?.id || event?.currentTarget?.dataset?.id || "";

    if (activityId) {
      openRoute(`/pages/activity-detail/index?id=${activityId}`);
    }
  },
});
