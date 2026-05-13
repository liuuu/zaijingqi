const {
  createActivity,
  isAdminUnlocked,
} = require("../../utils/activity-store");
const dayjs = require("dayjs");
const {
  getUploadUrls,
  uploadImageFile,
} = require("../../utils/activity-image");

Page({
  data: {
    routeUrl: "",
    bannerImage: "",
    bannerUploadFiles: [],
    title: "",
    description: "",
    conclusion: "",
    startTime: "",
    endTime: "",
    timePickerTitle: "选择时间",
    timePickerValue: "",
    timePickerVisible: false,
    activeTimeField: "",
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
  onShow() {
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
    const value = String(
      this.data[field] || dayjs().format("YYYY-MM-DD HH:mm"),
    ).trim();
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
      activeTimeField:
        trigger === "confirm-btn" ? this.data.activeTimeField : "",
    });
  },
  onUseDetailRoute() {
    this.setData({
      routeUrl: "",
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
        const index = nextFiles.findIndex(
          (item) => item.name === uploadedFile.name,
        );

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
    const { index } = event.detail;
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

    if (!title) {
      wx.showToast({
        title: "请填写标题",
        icon: "none",
      });
      return;
    }

    if (!description) {
      wx.showToast({
        title: "请填写活动介绍",
        icon: "none",
      });
      return;
    }

    if (!startTime) {
      wx.showToast({
        title: "请填写开始时间",
        icon: "none",
      });
      return;
    }

    if (!endTime) {
      wx.showToast({
        title: "请填写结束时间",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "创建中...",
    });

    try {
      await createActivity({
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
        title: "活动已创建",
        icon: "success",
      });

      wx.navigateBack();
    } catch (error) {
      console.log("error", error);
      wx.showToast({
        title: error.message || "创建失败",
        icon: "none",
      });
    } finally {
      wx.hideLoading();
    }
  },
});
