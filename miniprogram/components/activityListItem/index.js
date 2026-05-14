const dayjs = require("dayjs");
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatActivityTime(value) {
  console.log("value", value);
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (/^\d+$/.test(text)) {
    const timestamp = Number(text);
    if (Number.isFinite(timestamp)) {
      const time = dayjs(timestamp);
      return `${time.format("M.D")} ${WEEKDAY_LABELS[time.day()]} ${time.format(
        "HH:mm",
      )}`;
    }
  }

  const normalizedText = text.replace(" ", "T");
  const parsedTime = dayjs(normalizedText);

  return parsedTime.isValid()
    ? `${parsedTime.format("M.D")} ${
        WEEKDAY_LABELS[parsedTime.day()]
      } ${parsedTime.format("HH:mm")}`
    : text;
}

Component({
  properties: {
    activity: {
      type: Object,
      value: {},
      observer(activity) {
        this.setData({
          displayTime: formatActivityTime(activity && activity.startTime),
        });
      },
    },
  },
  data: {
    displayTime: "",
  },
  methods: {
    onIconTap() {
      const activity = this.data.activity || {};

      const latitude = Number(activity.latitude) || 30.64391;
      const longitude = Number(activity.longitude) || 104.11902;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        wx.showToast({
          title: "暂无地图位置",
          icon: "none",
        });
        return;
      }

      wx.openLocation({
        latitude,
        longitude,
        name: String(activity.title || activity.address || "").trim(),
        address: String(activity.address || "").trim(),
      });
    },
    onTap() {
      console.log("this.data.activity", this.data.activity);
      this.triggerEvent("tap", {
        activity: this.data.activity,
      });
    },
  },
});
