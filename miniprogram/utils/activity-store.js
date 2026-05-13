const ACTIVITIES_STORAGE_KEY = "activities-config";
const ADMIN_AUTH_STORAGE_KEY = "activity-admin-unlocked";
const ADMIN_PASSWORD = "admin";
const DEFAULT_ACTIVITY_IMAGE = "/images/zaijingqi.JPG";

function buildActivityDetailRoute(activityId) {
  return `/pages/activity-detail/index?id=${activityId}`;
}

function generateActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ACTIVITIES = [
  {
    id: "activity-example",
    bannerTitle: "春日湖畔漫步",
    title: "湖畔漫步活动",
    description: "一场轻松的拍照散步活动，顺带进行简短分享。",
    conclusion:
      "请带一件薄外套，并提前 10 分钟到场参加集合说明。",
    startTime: "2026-05-20 09:00",
    endTime: "2026-05-20 12:00",
    isBanner: true,
    images: ["/images/zaijingqi.JPG", "/images/zaijingqi1.JPG"],
    routeUrl: buildActivityDetailRoute("activity-example"),
  },
  {
    id: "activity-cloud",
    bannerTitle: "云开发分享会",
    title: "小程序云开发分享会",
    description:
      "体验云端接入、路由配置和活动页设计的实操分享。",
    conclusion:
      "请提前准备好微信开发者工具项目，方便跟着现场演示操作。",
    startTime: "2026-05-23 14:00",
    endTime: "2026-05-23 16:30",
    isBanner: true,
    images: ["/images/zaijingqi1.JPG", "/images/zaijingqi.JPG"],
    routeUrl: buildActivityDetailRoute("activity-cloud"),
  },
  {
    id: "activity-mine",
    bannerTitle: "志愿者对接",
    title: "志愿者协调会议",
    description: "确认分工、路线和现场支持细节。",
    conclusion:
      "会议结束后会确认最终安排，并同步到群里。",
    startTime: "2026-05-25 19:00",
    endTime: "2026-05-25 20:00",
    isBanner: false,
    images: ["/images/zaijingqi.JPG"],
    routeUrl: buildActivityDetailRoute("activity-mine"),
  },
];

function cloneActivities(list) {
  return list.map((activity, index) => normalizeActivity(activity, index));
}

function normalizeRouteUrl(routeUrl) {
  const trimmedRoute = String(routeUrl || "").trim();
  if (!trimmedRoute) {
    return "";
  }

  if (trimmedRoute.startsWith("/")) {
    return trimmedRoute;
  }

  return `/${trimmedRoute}`;
}

function normalizeImageList(images) {
  if (Array.isArray(images)) {
    return images.map((image) => String(image || "").trim()).filter(Boolean);
  }

  if (typeof images === "string") {
    return images
      .split(/[\n,]/)
      .map((image) => image.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeActivity(activity, index) {
  const source = activity || {};
  const activityId = source.id || `activity-${index + 1}`;
  const images = normalizeImageList(source.images);
  const defaultRouteUrl = buildActivityDetailRoute(activityId);

  return {
    id: activityId,
    bannerTitle:
      String(source.bannerTitle || "").trim() ||
      String(source.title || "").trim() ||
      `精选活动 ${index + 1}`,
    title: String(source.title || "").trim() || `活动 ${index + 1}`,
    description: String(source.description || "").trim(),
    conclusion: String(source.conclusion || "").trim(),
    startTime: String(source.startTime || "").trim(),
    endTime: String(source.endTime || "").trim(),
    isBanner: source.isBanner !== false,
    images: images.length > 0 ? images : [DEFAULT_ACTIVITY_IMAGE],
    routeUrl: normalizeRouteUrl(source.routeUrl) || defaultRouteUrl,
  };
}

function getActivities() {
  const storedActivities = wx.getStorageSync(ACTIVITIES_STORAGE_KEY);

  if (!Array.isArray(storedActivities) || storedActivities.length === 0) {
    return cloneActivities(DEFAULT_ACTIVITIES);
  }

  return cloneActivities(storedActivities);
}

function saveActivities(activities) {
  const normalizedActivities = cloneActivities(activities);
  wx.setStorageSync(ACTIVITIES_STORAGE_KEY, normalizedActivities);
  return normalizedActivities;
}

function createActivity(activity) {
  const source = activity || {};
  const activityId = source.id || generateActivityId();
  const normalizedActivity = normalizeActivity(
    {
      ...source,
      id: activityId,
      routeUrl: source.routeUrl || buildActivityDetailRoute(activityId),
    },
    0
  );
  const nextActivities = [...getActivities(), normalizedActivity];

  return {
    activity: normalizedActivity,
    activities: saveActivities(nextActivities),
  };
}

function getActivityById(activityId) {
  return getActivities().find((activity) => activity.id === activityId) || null;
}

function getBannerActivities() {
  const bannerActivities = getActivities().filter((activity) => activity.isBanner);
  return bannerActivities.length > 0 ? bannerActivities : getActivities();
}

function updateActivity(activityId, updates) {
  const nextActivities = getActivities().map((activity) =>
    activity.id === activityId ? { ...activity, ...updates } : activity,
  );

  return saveActivities(nextActivities);
}

function isAdminUnlocked() {
  return Boolean(wx.getStorageSync(ADMIN_AUTH_STORAGE_KEY));
}

function unlockAdmin() {
  wx.setStorageSync(ADMIN_AUTH_STORAGE_KEY, true);
}

function lockAdmin() {
  wx.removeStorageSync(ADMIN_AUTH_STORAGE_KEY);
}

function checkPassword(password) {
  return String(password || "").trim() === ADMIN_PASSWORD;
}

module.exports = {
  ADMIN_PASSWORD,
  buildActivityDetailRoute,
  createActivity,
  getActivities,
  getBannerActivities,
  saveActivities,
  getActivityById,
  updateActivity,
  normalizeImageList,
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
  checkPassword,
};
