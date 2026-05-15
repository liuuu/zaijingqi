const dayjs = require("dayjs");
const {
  loadUpcomingActivities: fetchUpcomingActivities,
  loadPastActivitiesPage: fetchPastActivitiesPage,
} = require("../../utils/activity-store");

const PAGE_SIZE = 10;
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

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

  wx.navigateTo({
    url: nextRoute,
    fail() {
      wx.showToast({
        title: "页面打开失败",
        icon: "none",
      });
    },
  });
}

function parseDayjs(value) {
  if (value === null || value === undefined || value === "") {
    return dayjs(NaN);
  }

  if (typeof value === "number") {
    return dayjs(value);
  }

  const text = String(value).trim();

  if (!text) {
    return dayjs(NaN);
  }

  if (/^\d+$/.test(text)) {
    return dayjs(Number(text));
  }

  return dayjs(text.replace(" ", "T"));
}

function formatDayLabel(value) {
  const date = parseDayjs(value);

  if (!date.isValid()) {
    return "";
  }

  return `${date.format("M.D")} ${WEEKDAY_LABELS[date.day()]}`;
}

function formatTimeLabel(value) {
  const time = parseDayjs(value);

  if (!time.isValid()) {
    return "";
  }

  return time.format("HH:mm");
}

function buildStatusLabel(activity, mode) {
  if (mode === "past") {
    return "往期回顾";
  }

  const start = parseDayjs(activity && activity.startTime);
  if (!start.isValid()) {
    return "即将开始";
  }

  const now = dayjs();
  return start.isSame(now, "day") && start.isBefore(now) ? "今日活动" : "即将开始";
}

function buildFooterText(activity, mode) {
  const address = String(activity && activity.address ? activity.address : "").trim();
  if (address) {
    return address;
  }

  if (mode === "past") {
    const conclusion = String(activity && activity.conclusion ? activity.conclusion : "").trim();
    if (conclusion) {
      return conclusion;
    }
  }

  return "";
}

function decorateActivity(activity, mode) {
  return {
    ...activity,
    timeText: formatTimeLabel(activity && activity.startTime),
    statusText: buildStatusLabel(activity, mode),
    footerText: buildFooterText(activity, mode),
  };
}

function groupUpcomingActivities(activities) {
  const groups = [];
  let currentGroup = null;

  (activities || []).forEach((activity) => {
    const date = parseDayjs(activity && activity.startTime);
    const groupKey = date.isValid() ? date.format("YYYY-MM-DD") : String(activity.id || "");

    if (!currentGroup || currentGroup.dateKey !== groupKey) {
      currentGroup = {
        dateKey: groupKey,
        label: formatDayLabel(activity && activity.startTime),
        count: 0,
        items: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.count += 1;
    currentGroup.items.push(decorateActivity(activity, "upcoming"));
  });

  return groups;
}

Page({
  data: {
    activeTab: "upcoming",
    upcomingGroups: [],
    upcomingLoading: false,
    pastActivities: [],
    pastLoading: false,
    pastLoadingMore: false,
    pastPage: 1,
    pastHasMore: true,
  },
  async onLoad() {
    await Promise.all([
      this.loadUpcomingActivities(true),
      this.loadPastActivities(true),
    ]);
  },
  async onPullDownRefresh() {
    if (this.data.activeTab === "past") {
      await this.loadPastActivities(true);
    } else {
      await this.loadUpcomingActivities(true);
    }

    wx.stopPullDownRefresh();
  },
  onReachBottom() {
    if (this.data.activeTab === "past") {
      this.loadPastActivities(false);
    }
  },
  onSwitchTab(event) {
    const nextTab = String(event.currentTarget.dataset.tab || "").trim();

    if (!nextTab || nextTab === this.data.activeTab) {
      return;
    }

    this.setData({
      activeTab: nextTab,
    });
  },
  async loadUpcomingActivities(reset = false) {
    if (this.data.upcomingLoading) {
      return;
    }

    this.setData({
      upcomingLoading: true,
    });

  try {
      const activities = await fetchUpcomingActivities();
      this.setData({
        upcomingGroups: groupUpcomingActivities(activities),
      });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "加载失败",
        icon: "none",
      });
    } finally {
      this.setData({
        upcomingLoading: false,
      });
    }
  },
  async loadPastActivities(reset = false) {
    if (this.data.pastLoading || this.data.pastLoadingMore) {
      return;
    }

    if (!reset && !this.data.pastHasMore) {
      return;
    }

    const nextPage = reset ? 1 : this.data.pastPage;
    const loadingKey = reset ? "pastLoading" : "pastLoadingMore";

    this.setData({
      [loadingKey]: true,
    });

    try {
      const activities = await fetchPastActivitiesPage(nextPage, PAGE_SIZE);
      const mergedActivities = reset
        ? activities
        : [...this.data.pastActivities, ...activities];

      this.setData({
        pastActivities: mergedActivities.map((activity) => decorateActivity(activity, "past")),
        pastPage: nextPage + 1,
        pastHasMore: activities.length === PAGE_SIZE,
      });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "加载失败",
        icon: "none",
      });
    } finally {
      this.setData({
        [loadingKey]: false,
      });
    }
  },
  onOpenActivity(event) {
    const activityId =
      event?.detail?.activity?.id || event?.currentTarget?.dataset?.id || "";

    if (activityId) {
      openRoute(`/pages/activity-detail/index?id=${encodeURIComponent(activityId)}`);
    }
  },
});
