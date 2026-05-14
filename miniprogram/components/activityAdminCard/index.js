const dayjs = require("dayjs");

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatActivityTime(value) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (/^\d+$/.test(text)) {
    const timestamp = Number(text);

    if (Number.isFinite(timestamp)) {
      const time = dayjs(timestamp);
      return `${time.format("M.D")} ${WEEKDAY_LABELS[time.day()]} ${time.format("HH:mm")}`;
    }
  }

  const normalizedText = text.replace(" ", "T");
  const parsedTime = dayjs(normalizedText);

  return parsedTime.isValid()
    ? `${parsedTime.format("M.D")} ${WEEKDAY_LABELS[parsedTime.day()]} ${parsedTime.format(
        "HH:mm",
      )}`
    : text;
}

Component({
  properties: {
    activity: {
      type: Object,
      value: {},
      observer(activity) {
        this.syncDisplay(activity);
      },
    },
    loading: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    displayTime: "",
    displayEndTime: "",
  },
  lifetimes: {
    attached() {
      this.syncDisplay(this.data.activity);
    },
  },
  methods: {
    syncDisplay(activity) {
      const source = activity || {};

      this.setData({
        displayTime: source.startTimeStr || formatActivityTime(source.startTime),
        displayEndTime: source.endTimeStr || formatActivityTime(source.endTime),
      });
    },
    onPreviewTap() {
      this.triggerEvent("preview", {
        id: this.data.activity.id,
        activity: this.data.activity,
      });
    },
    onEditTap() {
      this.triggerEvent("edit", {
        id: this.data.activity.id,
        activity: this.data.activity,
      });
    },
    onDeleteTap() {
      this.triggerEvent("delete", {
        id: this.data.activity.id,
        activity: this.data.activity,
      });
    },
  },
});
