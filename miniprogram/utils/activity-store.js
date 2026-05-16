const dayjs = require("dayjs");
const {
  normalizeImageUrl,
  normalizeImageUrls,
  resolveCloudImageUrl,
  resolveCloudImageUrls,
} = require("./activity-image");

const ADMIN_AUTH_STORAGE_KEY = "activity-admin-unlocked";
const ADMIN_PASSWORD = "admin";
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
let activityCache = [];

function buildActivityDetailRoute(activityId) {
  return `/pages/activity-detail/index?id=${activityId}`;
}

function generateActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function normalizeActivity(activity) {
  if (!activity) {
    return activity;
  }

  const bannerFileID = normalizeImageUrl(activity.bannerUrl);
  const imageFileIDs = normalizeImageUrls(activity.images);
  const startTime = Number(activity.startTime);
  const endTime = Number(activity.endTime);
  const latitude = Number(activity.latitude);
  const longitude = Number(activity.longitude);
  const startTimeStr = activity.startTimeStr;
  const endTimeStr = activity.endTimeStr;
  const [bannerUrl, images] = await Promise.all([
    resolveCloudImageUrl(bannerFileID),
    resolveCloudImageUrls(imageFileIDs),
  ]);

  return {
    ...activity,
    bannerUrl,
    bannerFileID,
    images,
    imageFileIDs,
    startTime: Number.isFinite(startTime) ? startTime : activity.startTime,
    endTime: Number.isFinite(endTime) ? endTime : activity.endTime,
    latitude: Number.isFinite(latitude) ? latitude : activity.latitude,
    longitude: Number.isFinite(longitude) ? longitude : activity.longitude,
    startTimeStr,
    endTimeStr,
  };
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
        ...activity,
        bannerUrl: normalizeImageUrl(activity.bannerUrl),
        images: normalizeImageUrls(activity.images),
        isBanner: activity.isBanner,
      },
    },
  });

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

  return Promise.all(
    cloudActivities.map((activity) => normalizeActivity(activity)),
  );
}

async function selectActivitiesPageFromCloud(page, pageSize) {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return [];
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "selectActivitiesPage",
      page,
      pageSize,
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    return [];
  }

  const cloudActivities = Array.isArray(result.result.data)
    ? result.result.data
    : [];

  return Promise.all(
    cloudActivities.map((activity) => normalizeActivity(activity)),
  );
}

async function selectRecentActivitiesFromCloud() {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return [];
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "loadRecentActivities",
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    return [];
  }

  const cloudActivities = Array.isArray(result.result.data)
    ? result.result.data
    : [];

  return Promise.all(
    cloudActivities.map((activity) => normalizeActivity(activity)),
  );
}

async function selectRecentEndActivitiesFromCloud() {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return [];
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "loadRecentEndActivities",
    },
  });
  console.log("result--", result);

  if (!result || !result.result || result.result.success !== true) {
    return [];
  }

  const cloudActivities = Array.isArray(result.result.data)
    ? result.result.data
    : [];

  return Promise.all(
    cloudActivities.map((activity) => normalizeActivity(activity)),
  );
}

async function selectUpcomingActivitiesFromCloud() {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return [];
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "selectUpcomingActivities",
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    return [];
  }

  const cloudActivities = Array.isArray(result.result.data)
    ? result.result.data
    : [];

  return Promise.all(
    cloudActivities.map((activity) => normalizeActivity(activity)),
  );
}

async function selectPastActivitiesPageFromCloud(page, pageSize) {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return [];
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "selectPastActivitiesPage",
      page,
      pageSize,
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    return [];
  }

  const cloudActivities = Array.isArray(result.result.data)
    ? result.result.data
    : [];

  return Promise.all(
    cloudActivities.map((activity) => normalizeActivity(activity)),
  );
}

async function selectActivityFromCloud(activityId) {
  const trimmedActivityId = String(activityId || "").trim();

  if (!trimmedActivityId) {
    return null;
  }

  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return null;
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "selectActivity",
      id: trimmedActivityId,
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    return null;
  }

  return result.result.data ? await normalizeActivity(result.result.data) : null;
}

async function createActivity(activity) {
  const source = activity || {};
  const activityId = source.id || generateActivityId();
  const normalizedActivity = {
    ...source,
    id: activityId,
    bannerUrl: normalizeImageUrl(source.bannerUrl),
    images: normalizeImageUrls(source.images),
  };
  await insertActivityToCloud(normalizedActivity);

  return {
    activity: await normalizeActivity(normalizedActivity),
  };
}

async function loadActivities() {
  const activities = await selectActivitiesFromCloud();
  return activities;
}

async function loadActivitiesPage(page, pageSize) {
  const activities = await selectActivitiesPageFromCloud(page, pageSize);
  return activities;
}

async function loadRecentActivities() {
  const activities = await selectRecentActivitiesFromCloud();
  return activities;
}

async function loadRecentEndActivities() {
  const activities = await selectRecentEndActivitiesFromCloud();
  return activities;
}

async function loadUpcomingActivities() {
  const activities = await selectUpcomingActivitiesFromCloud();
  return activities;
}

async function loadPastActivitiesPage(page, pageSize) {
  const activities = await selectPastActivitiesPageFromCloud(page, pageSize);
  return activities;
}

async function loadActivity(activityId) {
  console.log("activityId", activityId);
  const activity = await selectActivityFromCloud(activityId);
  return activity;
}

async function updateActivity(activityId, updates) {
  const nextActivity = {
    ...updates,
    id: activityId,
    bannerUrl: normalizeImageUrl(updates.bannerUrl),
    images: normalizeImageUrls(updates.images),
    address: updates.address,
    latitude: updates.latitude,
    longitude: updates.longitude,
  };

  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    throw new Error("云能力不可用，无法保存活动");
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "updateActivity",
      data: {
        ...nextActivity,
      },
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    throw new Error(
      (result && result.result && result.result.errMsg) || "保存活动失败",
    );
  }

  return result;
}

async function deleteActivity(activityId) {
  const trimmedActivityId = String(activityId || "").trim();

  if (!trimmedActivityId) {
    throw new Error("活动 ID 不能为空");
  }

  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    throw new Error("云能力不可用，无法删除活动");
  }

  const result = await wx.cloud.callFunction({
    name: "quickstartFunctions",
    data: {
      type: "deleteActivity",
      id: trimmedActivityId,
    },
  });

  if (!result || !result.result || result.result.success !== true) {
    throw new Error(
      (result && result.result && result.result.errMsg) || "删除活动失败",
    );
  }

  return result.result;
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
  loadActivitiesPage,
  loadRecentActivities,
  loadRecentEndActivities,
  loadUpcomingActivities,
  loadPastActivitiesPage,

  loadActivity,
  updateActivity,
  deleteActivity,
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
  checkPassword,
};
