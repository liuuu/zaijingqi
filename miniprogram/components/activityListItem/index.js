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
    onTap() {
      this.triggerEvent("tap", {
        activity: this.data.activity,
      });
    },
  },
});
