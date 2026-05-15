Component({
  properties: {
    activity: {
      type: Object,
      value: {},
    },
    timeText: {
      type: String,
      value: "",
    },
    statusText: {
      type: String,
      value: "",
    },
    footerText: {
      type: String,
      value: "",
    },
  },
  methods: {
    onTap() {
      this.triggerEvent("tap", {
        activity: this.data.activity,
      });
    },
  },
});
