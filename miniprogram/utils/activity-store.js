const ADMIN_AUTH_STORAGE_KEY = "activity-admin-unlocked";
const ADMIN_PASSWORD = "admin";
let activityCache = [];

function buildActivityDetailRoute(activityId) {
  return `/pages/activity-detail/index?id=${activityId}`;
}

function generateActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneActivities(list) {
  return list.map((activity, index) => normalizeActivity(activity, index));
}

function setActivityCache(list) {
  activityCache = cloneActivities(list);
  return getActivities();
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
  const bannerImage = String(source.bannerImage || "").trim() || images[0] || "";

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
    bannerImage,
    images,
    routeUrl: normalizeRouteUrl(source.routeUrl) || defaultRouteUrl,
  };
}

function getActivities() {
  if (!Array.isArray(activityCache)) {
    return [];
  }

  return cloneActivities(activityCache);
}

async function insertActivityToCloud(activity) {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    throw new Error("云能力不可用，无法创建活动");
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "insertActivity",
      data: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        startTime: activity.startTime,
        endTime: activity.endTime,
        bannerUrl: activity.bannerImage,
        images: activity.images,
        conclusion: activity.conclusion,
        status: activity.status || (activity.isBanner ? "banner" : "normal"),
        routeUrl: activity.routeUrl,
        bannerTitle: activity.bannerTitle,
        isBanner: activity.isBanner,
      },
    },
  });
  console.log("result", result);

  if (!result || !result.result || result.result.success !== true) {
    throw new Error(
      (result && result.result && result.result.errMsg) || "创建活动失败",
    );
  }

  return result.result;
}

async function selectActivitiesFromCloud() {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return [];
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "selectActivities",
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    return [];
  }

  const cloudActivities = Array.isArray(result.result.data)
    ? result.result.data
    : [];

  return cloneActivities(cloudActivities);
}

async function createActivity(activity) {
  console.log("activity", activity);
  const source = activity || {};
  const activityId = source.id || generateActivityId();
  const normalizedActivity = normalizeActivity(
    {
      ...source,
      id: activityId,
      bannerImage: source.bannerImage,
    },
    0,
  );
  return;
  const a = await insertActivityToCloud(normalizedActivity);
  console.log("a", a);
  const nextActivities = [...getActivities(), normalizedActivity];

  return {
    activity: normalizedActivity,
    activities: setActivityCache(nextActivities),
  };
}

async function loadActivities() {
  const activities = await selectActivitiesFromCloud();
  return setActivityCache(activities);
}

function getActivityById(activityId) {
  return getActivities().find((activity) => activity.id === activityId) || null;
}

function getBannerActivities() {
  const bannerActivities = getActivities().filter(
    (activity) => activity.isBanner,
  );
  return bannerActivities.length > 0 ? bannerActivities : getActivities();
}

async function updateActivity(activityId, updates) {
  const currentActivity = getActivityById(activityId);
  const nextActivity = normalizeActivity(
    {
      ...(currentActivity || {}),
      ...updates,
      id: activityId,
    },
    0,
  );

  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    throw new Error("云能力不可用，无法保存活动");
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "updateActivity",
      data: {
        ...nextActivity,
        bannerUrl: nextActivity.bannerImage,
      },
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    throw new Error(
      (result && result.result && result.result.errMsg) || "保存活动失败",
    );
  }

  return setActivityCache(
    getActivities().map((activity) =>
      activity.id === activityId ? nextActivity : activity,
    ),
  );
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
  loadActivities,
  getActivities,
  getBannerActivities,
  getActivityById,
  updateActivity,
  normalizeImageList,
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
  checkPassword,
};
