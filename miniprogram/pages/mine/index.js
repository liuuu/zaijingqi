const {
  checkPassword,
  isAdminUnlocked,
  lockAdmin,
  unlockAdmin,
} = require("../../utils/activity-store");

Page({
  data: {
    password: "",
    isUnlocked: false,
    showPasswordDialog: false,
  },
  onShow() {
    this.syncAccessState();
  },
  syncAccessState() {
    this.setData({
      isUnlocked: isAdminUnlocked(),
    });
  },
  onMenuTap(event) {
    wx.showToast({
      title: "功能暂未开放",
      icon: "none",
    });
  },
  onContentManagementTap() {
    if (isAdminUnlocked()) {
      wx.navigateTo({
        url: "/pages/activity-admin/index",
      });
      return;
    }

    this.setData({
      showPasswordDialog: true,
      password: "",
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
      showPasswordDialog: false,
    });
    wx.navigateTo({
      url: "/pages/activity-admin/index",
    });
  },
  closePasswordDialog() {
    this.setData({
      showPasswordDialog: false,
      password: "",
    });
  },
  onOpenManager() {
    this.setData({
      showPasswordDialog: false,
    });
    wx.navigateTo({
      url: "/pages/activity-admin/index",
    });
  },
  onLockManager(event) {
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }

    lockAdmin();
    this.setData({
      isUnlocked: false,
      password: "",
      showPasswordDialog: false,
    });
    this.syncAccessState();
    wx.showToast({
      title: "管理已锁定",
      icon: "none",
    });
  },
  onOpenManager() {
    this.setData({
      showPasswordDialog: false,
    });
    wx.navigateTo({
      url: "/pages/activity-admin/index",
    });
  },
});
