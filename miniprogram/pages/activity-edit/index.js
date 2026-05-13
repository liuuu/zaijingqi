const {
  buildActivityDetailRoute,
  getActivityById,
  loadActivities,
  isAdminUnlocked,
  updateActivity,
} = require("../../utils/activity-store");
const dayjs = require("dayjs");
const {
  buildUploadFiles,
  getUploadUrls,
  uploadImageFile,
} = require("../../utils/activity-image");

Page({
  data: {
    activityId: "",
    bannerImage: "",
    bannerUploadFiles: [],
    bannerTitle: "",
    title: "",
    description: "",
    conclusion: "",
    startTime: "",
    endTime: "",
    timePickerTitle: "选择时间",
    timePickerValue: "",
    timePickerVisible: false,
    activeTimeField: "",
    routeUrl: "",
    images: [],
    uploadFiles: [],
    isBanner: true,
    isUploading: false,
    gridConfig: {
      column: 4,
      width: 160,
      height: 160,
    },
    uploadConfig: {
      count: 9,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
    },
    bannerUploadConfig: {
      count: 1,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
    },
  },
  onLoad(options) {
    this.activityId = options.id || "";
  },
  async onShow() {
    if (!isAdminUnlocked()) {
      wx.showToast({
        title: "请先输入密码",
        icon: "none",
      });
      wx.switchTab({
        url: "/pages/mine/index",
      });
      return;
    }

    await loadActivities();
    const activity = getActivityById(this.activityId);

    if (!activity) {
      wx.showToast({
        title: "未找到活动",
        icon: "none",
      });
      wx.navigateBack();
      return;
    }

    this.setData({
      activityId: activity.id,
      bannerImage: activity.bannerImage,
      bannerUploadFiles: buildUploadFiles([activity.bannerImage]),
      bannerTitle: activity.bannerTitle,
      title: activity.title,
      description: activity.description,
      conclusion: activity.conclusion,
      startTime: activity.startTime,
      endTime: activity.endTime,
      routeUrl: activity.routeUrl,
      images: activity.images,
      uploadFiles: buildUploadFiles(activity.images),
      isBanner: activity.isBanner,
    });
  },
  onFieldInput(event) {
    const { field } = event.currentTarget.dataset;

    this.setData({
      [field]: event.detail.value,
    });
  },
  onBannerChange(event) {
    this.setData({
      isBanner: event.detail.value,
    });
  },
  showTimePicker(field) {
    const value = String(this.data[field] || dayjs().format("YYYY-MM-DD HH:mm")).trim();
    const titles = {
      startTime: "选择开始时间",
      endTime: "选择结束时间",
    };

    this.setData({
      activeTimeField: field,
      timePickerTitle: titles[field] || "选择时间",
      timePickerValue: value,
      timePickerVisible: true,
    });
  },
  onStartTimeTap() {
    this.showTimePicker("startTime");
  },
  onEndTimeTap() {
    this.showTimePicker("endTime");
  },
  hideTimePicker() {
    this.setData({
      activeTimeField: "",
      timePickerVisible: false,
    });
  },
  onTimePickerConfirm(event) {
    const value = event.detail?.value || this.data.timePickerValue;
    const { activeTimeField } = this.data;

    if (!activeTimeField) {
      return;
    }

    this.setData({
      [activeTimeField]: value,
      timePickerValue: value,
      timePickerVisible: false,
      activeTimeField: "",
    });
  },
  onTimePickerClose(event) {
    const trigger = event.detail?.trigger;

    this.setData({
      timePickerVisible: false,
      activeTimeField: trigger === "confirm-btn" ? this.data.activeTimeField : "",
    });
  },
  onBannerUploadSuccess(event) {
    const uploadedFiles = event.detail.files || [];

    this.setData({
      bannerUploadFiles: uploadedFiles,
      bannerImage: getUploadUrls(uploadedFiles)[0] || "",
    });
  },
  async onBannerUploadAdd(event) {
    const selectedFiles = event.detail.files || [];

    if (!selectedFiles.length) {
      return;
    }

    const previousFiles = [...this.data.bannerUploadFiles];
    this.setData({ isUploading: true });
    wx.showLoading({ title: "上传中..." });

    try {
      const file = selectedFiles[0];
      const result = await uploadImageFile(file.url);
      const nextFiles = [
        {
          ...file,
          url: result.fileID,
          status: "done",
          percent: 100,
        },
      ];

      this.setData({
        bannerUploadFiles: nextFiles,
        bannerImage: getUploadUrls(nextFiles)[0] || "",
      });
    } catch (error) {
      this.setData({
        bannerUploadFiles: previousFiles,
        bannerImage: getUploadUrls(previousFiles)[0] || "",
      });
      wx.showToast({
        title: "图片上传失败",
        icon: "none",
      });
    } finally {
      this.setData({ isUploading: false });
      wx.hideLoading();
    }
  },
  onBannerUploadRemove() {
    this.setData({
      bannerUploadFiles: [],
      bannerImage: "",
    });
  },
  onUseDetailRoute() {
    this.setData({
      routeUrl: buildActivityDetailRoute(this.data.activityId),
    });
  },
  onUploadSuccess(event) {
    const uploadedFiles = event.detail.files || [];

    this.setData({
      uploadFiles: uploadedFiles,
      images: getUploadUrls(uploadedFiles),
    });
  },
  async onUploadAdd(event) {
    const selectedFiles = event.detail.files || [];

    if (!selectedFiles.length) {
      return;
    }

    const previousFiles = [...this.data.uploadFiles];
    this.setData({ isUploading: true });
    wx.showLoading({ title: "上传中..." });

    try {
      const nextFiles = [...this.data.uploadFiles];

      for (const file of selectedFiles) {
        const result = await uploadImageFile(file.url);
        const uploadedFile = {
          ...file,
          url: result.fileID,
          status: "done",
          percent: 100,
        };
        const index = nextFiles.findIndex((item) => item.name === uploadedFile.name);

        if (index >= 0) {
          nextFiles[index] = uploadedFile;
        } else {
          nextFiles.push(uploadedFile);
        }
      }

      this.setData({
        uploadFiles: nextFiles,
        images: getUploadUrls(nextFiles),
      });
    } catch (error) {
      this.setData({
        uploadFiles: previousFiles,
        images: getUploadUrls(previousFiles),
      });
      wx.showToast({
        title: "图片上传失败",
        icon: "none",
      });
    } finally {
      this.setData({ isUploading: false });
      wx.hideLoading();
    }
  },
  onUploadRemove(event) {
    const { index } = event.currentTarget.dataset;
    const nextFiles = this.data.uploadFiles.filter(
      (_, currentIndex) => currentIndex !== Number(index),
    );

    this.setData({
      uploadFiles: nextFiles,
      images: getUploadUrls(nextFiles),
    });
  },
  async onSave() {
    const bannerImage = String(this.data.bannerImage || "").trim();
    const bannerTitle = String(this.data.bannerTitle || "").trim();
    const title = String(this.data.title || "").trim();
    const description = String(this.data.description || "").trim();
    const conclusion = String(this.data.conclusion || "").trim();
    const startTime = String(this.data.startTime || "").trim();
    const endTime = String(this.data.endTime || "").trim();
    const routeUrl = String(this.data.routeUrl || "").trim();

    if (!bannerImage) {
      wx.showToast({
        title: "请添加封面图片",
        icon: "none",
      });
      return;
    }

    if (!bannerTitle) {
      wx.showToast({
        title: "请填写轮播标题",
        icon: "none",
      });
      return;
    }

    if (!title) {
      wx.showToast({
        title: "请填写标题",
        icon: "none",
      });
      return;
    }

    if (this.data.images.length === 0) {
      wx.showToast({
        title: "请至少添加一张图片",
        icon: "none",
      });
      return;
    }

    if (routeUrl && !routeUrl.startsWith("/pages/")) {
      wx.showToast({
        title: "请使用 /pages/ 路由",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "保存中...",
    });

    try {
      await updateActivity(this.data.activityId, {
        bannerTitle,
        title,
        description,
        conclusion,
        startTime,
        endTime,
        routeUrl,
        bannerImage,
        images: this.data.images,
        isBanner: this.data.isBanner,
      });

      wx.showToast({
        title: "活动已保存",
        icon: "success",
      });

      wx.navigateBack();
    } catch (error) {
      wx.showToast({
        title: error.message || "保存失败",
        icon: "none",
      });
    } finally {
      wx.hideLoading();
    }
  },
});
