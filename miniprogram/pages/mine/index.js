const {
  ADMIN_PASSWORD,
  checkPassword,
  isAdminUnlocked,
  lockAdmin,
  unlockAdmin,
} = require("../../utils/activity-store");

Page({
  data: {
    title: "我的",
    description: "输入密码进入活动管理。",
    password: "",
    passwordHint: `演示密码：${ADMIN_PASSWORD}`,
    isUnlocked: false,
  },
  onShow() {
    this.syncAccessState();
  },
  syncAccessState() {
    this.setData({
      isUnlocked: isAdminUnlocked(),
    });
  },
  onPasswordInput(event) {
    this.setData({
      password: event.detail.value,
    });
  },
  onSubmitPassword() {
    if (!checkPassword(this.data.password)) {
      wx.showToast({
        title: "密码不正确",
        icon: "none",
      });
      return;
    }

    unlockAdmin();
    this.setData({
      password: "",
      isUnlocked: true,
    });
    wx.navigateTo({
      url: "/pages/activity-admin/index",
    });
  },
  onOpenManager() {
    wx.navigateTo({
      url: "/pages/activity-admin/index",
    });
  },
  onLockManager() {
    lockAdmin();
    this.setData({
      isUnlocked: false,
      password: "",
    });
    wx.showToast({
      title: "管理已锁定",
      icon: "none",
    });
  },
});
