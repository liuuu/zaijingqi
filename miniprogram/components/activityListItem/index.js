Component({
  properties: {
    activity: {
      type: Object,
      value: {},
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
