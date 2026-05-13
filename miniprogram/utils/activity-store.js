const { normalizeImageUrl, normalizeImageUrls } = require("./activity-image");

const ADMIN_AUTH_STORAGE_KEY = "activity-admin-unlocked";
const ADMIN_PASSWORD = "admin";
let activityCache = [];

function buildActivityDetailRoute(activityId) {
  return `/pages/activity-detail/index?id=${activityId}`;
}

function generateActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
        bannerUrl: normalizeImageUrl(activity.bannerUrl),
        images: normalizeImageUrls(activity.images),
        conclusion: activity.conclusion,
        status: activity.status || (activity.isBanner ? "banner" : "normal"),
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

  return cloudActivities.map((activity) => ({
    ...activity,
    bannerUrl: normalizeImageUrl(activity.bannerUrl),
    images: normalizeImageUrls(activity.images),
  }));
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

  return result.result.data
    ? {
        ...result.result.data,
        bannerUrl: normalizeImageUrl(result.result.data.bannerUrl),
        images: normalizeImageUrls(result.result.data.images),
      }
    : null;
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
    activity: normalizedActivity,
  };
}

async function loadActivities() {
  const activities = await selectActivitiesFromCloud();
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
  loadActivity,
  updateActivity,
  deleteActivity,
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
  checkPassword,
};
