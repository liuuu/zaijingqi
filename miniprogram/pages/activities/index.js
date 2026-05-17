const {
  loadRecentActivities,
  loadRecentEndActivities,
} = require("../../utils/activity-store");

const TAB_BAR_PAGES = [
  "/pages/activities/index",
  "/pages/mine/index",
];

function buildSharePath(routePath, query = "") {
  return query ? `${routePath}?${query}` : routePath;
}

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
    loading: false,
    activities: [],
    swiperList: [],
    currentBannerIndex: 0,
    activeBanner: null,
    reviewActivities: [],
  },
  buildShareInfo() {
    const shareActivity = this.data.activeBanner || this.data.activities[0] || null;
    const title = shareActivity && shareActivity.title
      ? `${shareActivity.title}｜活动`
      : "活动";
    const path = buildSharePath("/pages/activities/index");

    return {
      title,
      path,
      imageUrl: shareActivity && shareActivity.bannerUrl ? shareActivity.bannerUrl : undefined,
    };
  },
  async loadActivities() {
    this.setData({ loading: true });

    try {
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
    } finally {
      this.setData({ loading: false });
    }
  },
  onOpenAllActivities() {
    openRoute("/pages/activity-list/index");
  },
  async onLoad() {
    await this.loadActivities();
    this.wxLogin();
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
    openRoute(
      `/pages/activity-detail/index?id=${encodeURIComponent(activeBanner.id)}`,
    );
  },
  onOpenActivity(event) {
    const activityId =
      event?.detail?.activity?.id || event?.currentTarget?.dataset?.id || "";

    if (activityId) {
      openRoute(buildSharePath("/pages/activity-detail/index", `id=${encodeURIComponent(activityId)}`));
    }
  },
  onShareAppMessage() {
    return this.buildShareInfo();
  },
  onShareTimeline() {
    const shareInfo = this.buildShareInfo();
    return {
      title: shareInfo.title,
      query: "",
      imageUrl: shareInfo.imageUrl,
    };
  },
  // 微信一键登录
  async wxLogin() {
    const res = await wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "getOpenId",
      },
    });
    const openid = res.result.openid;
    // 存到本地缓存，以后直接用
    wx.setStorageSync("openid", openid);
    console.log("登录成功，openid：", openid);
  },
});
