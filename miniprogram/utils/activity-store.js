const dayjs = require("dayjs");
const { normalizeImageUrl, normalizeImageUrls } = require("./activity-image");

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

function toTimestamp(value) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error("时间不能为空");
  }

  if (/^\d+$/.test(text)) {
    const timestamp = Number(text);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  const timestamp = dayjs(text.replace(" ", "T")).valueOf();
  if (!Number.isFinite(timestamp)) {
    throw new Error("时间格式无效");
  }

  return timestamp;
}

function formatActivityTime(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const timestamp = Number(value);
  const time = Number.isFinite(timestamp)
    ? dayjs(timestamp)
    : dayjs(String(value).replace(" ", "T"));

  if (!time.isValid()) {
    return String(value).trim();
  }

  return `${time.format("M.D")} ${WEEKDAY_LABELS[time.day()]} ${time.format(
    "HH:mm",
  )}`;
}

function buildActivityTimeFields(activity) {
  const startTime = toTimestamp(activity.startTime);
  const endTime = toTimestamp(activity.endTime);

  return {
    startTime,
    endTime,
    startTimeStr: formatActivityTime(startTime),
    endTimeStr: formatActivityTime(endTime),
  };
}

function normalizeActivity(activity) {
  if (!activity) {
    return activity;
  }

  const startTime = Number(activity.startTime);
  const endTime = Number(activity.endTime);
  const startTimeStr = formatActivityTime(activity.startTimeStr || startTime);
  const endTimeStr = formatActivityTime(activity.endTimeStr || endTime);

  return {
    ...activity,
    bannerUrl: normalizeImageUrl(activity.bannerUrl),
    images: normalizeImageUrls(activity.images),
    startTime: Number.isFinite(startTime) ? startTime : activity.startTime,
    endTime: Number.isFinite(endTime) ? endTime : activity.endTime,
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
        id: activity.id,
        title: activity.title,
        description: activity.description,
        ...buildActivityTimeFields(activity),
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

  return cloudActivities.map((activity) => normalizeActivity(activity));
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

  return cloudActivities.map((activity) => normalizeActivity(activity));
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

  return cloudActivities.map((activity) => normalizeActivity(activity));
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

  return cloudActivities.map((activity) => normalizeActivity(activity));
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

  return result.result.data ? normalizeActivity(result.result.data) : null;
}

async function createActivity(activity) {
  const source = activity || {};
  const activityId = source.id || generateActivityId();
  const normalizedActivity = {
    ...source,
    id: activityId,
    bannerUrl: normalizeImageUrl(source.bannerUrl),
    images: normalizeImageUrls(source.images),
    ...buildActivityTimeFields(source),
  };
  await insertActivityToCloud(normalizedActivity);

  return {
    activity: normalizeActivity(normalizedActivity),
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
    ...buildActivityTimeFields(updates),
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

  loadActivity,
  updateActivity,
  deleteActivity,
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
  checkPassword,
  formatActivityTime,
};
