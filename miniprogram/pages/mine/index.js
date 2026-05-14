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
    openid: "",
    isProfileLoaded: false,
    hasProfileRecord: false,
    profile: {
      avatarUrl: "",
      nickName: "探索者",
    },
    isProfileSaving: false,
  },
  onLoad() {
    this.loadProfileState();
  },

  onShow() {
    this.syncAccessState();
    if (!this.data.isProfileLoaded) {
      this.loadProfileState();
    }
  },
  syncAccessState() {
    this.setData({
      isUnlocked: isAdminUnlocked(),
    });
  },
  setProfile(profile, hasProfileRecord) {
    const nextProfile = {
      avatarUrl: profile && profile.avatarUrl ? profile.avatarUrl : "",
      nickName: profile && profile.nickName ? profile.nickName : "探索者",
    };
    wx.setStorageSync("userProfile", nextProfile);
    this.setData({
      profile: nextProfile,
      hasProfileRecord: Boolean(hasProfileRecord),
    });
  },
  async syncOpenId() {
    const cachedOpenId = wx.getStorageSync("openid");
    if (cachedOpenId) {
      this.setData({
        openid: cachedOpenId,
      });
      return cachedOpenId;
    }

    if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
      return "";
    }

    try {
      const resp = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "getOpenId",
        },
      });
      const openid = resp?.result?.openid || "";
      if (openid) {
        wx.setStorageSync("openid", openid);
        this.setData({
          openid,
        });
      }
      return openid;
    } catch (error) {
      console.error("获取 openid 失败", error);
      return "";
    }
  },
  async loadProfileState() {
    this.setData({
      isProfileLoaded: false,
    });

    const openid = await this.syncOpenId();
    if (!openid) {
      this.setData({
        isProfileLoaded: true,
      });
      return;
    }

    if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
      this.setData({
        isProfileLoaded: true,
      });
      return;
    }

    try {
      const resp = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "selectMyUserProfile",
        },
      });
      const userProfile = resp && resp.result ? resp.result.data : null;
      console.log("userProfile", userProfile);
      if (resp && resp.result && resp.result.success === true && userProfile) {
        this.setProfile(userProfile, true);
      } else {
        this.setData({
          hasProfileRecord: false,
        });
      }
    } catch (error) {
      console.error("加载用户资料失败", error);
      this.setData({
        hasProfileRecord: false,
      });
    } finally {
      this.setData({
        isProfileLoaded: true,
      });
    }
  },
  async onChooseAvatar(e, a) {
    console.log("e", e, a);
    if (this.data.isProfileSaving) {
      return;
    }

    const avatarUrl = e?.detail?.avatarUrl || "";
    if (!avatarUrl) {
      wx.showToast({
        title: "未获取到头像",
        icon: "none",
      });
      return;
    }

    try {
      this.setData({
        isProfileSaving: true,
        profile: {
          ...this.data.profile,
          avatarUrl,
        },
      });

      const openid = await this.syncOpenId();
      if (!openid) {
        wx.showToast({
          title: "未获取到 openid",
          icon: "none",
        });
        return;
      }

      if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
        wx.showToast({
          title: "云能力不可用",
          icon: "none",
        });
        return;
      }

      wx.showLoading({
        title: "保存中...",
      });

      const resp = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "upsertUserProfile",
          data: {
            nickName: this.data.profile.nickName || "探索者",
            avatarUrl,
          },
        },
      });

      if (!resp || !resp.result || resp.result.success !== true) {
        throw new Error(
          (resp && resp.result && resp.result.errMsg) || "保存个人资料失败",
        );
      }

      this.setProfile(
        {
          avatarUrl,
          nickName: this.data.profile.nickName || "探索者",
        },
        true,
      );
      wx.showToast({
        title: "头像已更新",
      });
    } catch (error) {
      wx.showToast({
        title: error?.message || "更新失败",
        icon: "none",
      });
    } finally {
      wx.hideLoading();
      this.setData({
        isProfileSaving: false,
      });
    }
  },
  onMenuTap() {
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
});
