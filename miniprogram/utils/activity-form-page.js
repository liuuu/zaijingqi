const dayjs = require("dayjs");
const {
  createActivity,
  getActivityById,
  loadActivity,
  isAdminUnlocked,
  updateActivity,
} = require("./activity-store");
const {
  buildUploadFiles,
  getUploadUrls,
  uploadImageFile,
} = require("./activity-image");

function generateActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildModeText(isEditMode) {
  return isEditMode
    ? {
        pageTitle: "编辑活动",
        headingTitle: "编辑活动",
        pageDescription: "修改轮播内容、详情内容和图片。",
        submitText: "保存活动",
      }
    : {
        pageTitle: "新建活动",
        headingTitle: "新建活动",
        pageDescription: "填写活动封面、内容和图片，创建后会保存到云端。",
        submitText: "创建活动",
      };
}

function buildEmptyState(activityId = "") {
  return {
    activityId,
    pageTitle: "新建活动",
    headingTitle: "新建活动",
    pageDescription: "填写活动封面、内容和图片，创建后会保存到云端。",
    submitText: "创建活动",
    bannerUrl: "",
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
      count: 19,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
    },
    bannerUploadConfig: {
      count: 1,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
    },
  };
}

function createActivityFormPage() {
  return {
    data: buildEmptyState(),
    onLoad(options) {
      const activityId =
        String(options.id || "").trim() || generateActivityId();
      this.activityId = activityId;
      this.isEditMode = Boolean(String(options.id || "").trim());
      this.hasLoadedActivity = false;
      const modeText = buildModeText(this.isEditMode);

      this.setData({
        ...modeText,
        activityId,
      });

      wx.setNavigationBarTitle({
        title: modeText.pageTitle,
      });
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

      if (!this.isEditMode || this.hasLoadedActivity) {
        return;
      }

      const activity = await loadActivity(this.activityId);

      console.log("activity++", activity);

      if (!activity) {
        wx.showToast({
          title: "未找到活动",
          icon: "none",
        });
        wx.navigateBack();
        return;
      }

      this.hasLoadedActivity = true;
      this.setData({
        activityId: activity.id,
        bannerUrl: activity.bannerUrl,
        bannerUploadFiles: buildUploadFiles([activity.bannerUrl]),
        title: activity.title,
        description: activity.description,
        conclusion: activity.conclusion,
        startTime: activity.startTime,
        endTime: activity.endTime,
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
        timePickerTimestamp: dayjs(value).valueOf(),
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
    onBannerUploadSuccess(event) {
      const uploadedFiles = event.detail.files || [];

      this.setData({
        bannerUploadFiles: uploadedFiles,
        bannerUrl: getUploadUrls(uploadedFiles)[0] || "",
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
          bannerUrl: getUploadUrls(nextFiles)[0] || "",
        });
      } catch (error) {
        this.setData({
          bannerUploadFiles: previousFiles,
          bannerUrl: getUploadUrls(previousFiles)[0] || "",
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
        bannerUrl: "",
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
      const bannerUrl = String(this.data.bannerUrl || "").trim();
      const title = String(this.data.title || "").trim();
      const description = String(this.data.description || "").trim();
      const conclusion = String(this.data.conclusion || "").trim();
      const startTime = String(this.data.startTime || "").trim();
      const endTime = String(this.data.endTime || "").trim();

      if (!bannerUrl) {
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
        title: this.isEditMode ? "保存中..." : "创建中...",
      });

      try {
        const payload = {
          id: this.activityId,
          title,
          description,
          conclusion,
          startTime,
          endTime,
          bannerUrl,
          images: this.data.images,
          isBanner: this.data.isBanner,
        };

        if (this.isEditMode) {
          await updateActivity(this.activityId, payload);
        } else {
          await createActivity(payload);
        }

        wx.showToast({
          title: this.isEditMode ? "活动已保存" : "活动已创建",
          icon: "success",
        });

        wx.navigateBack();
      } catch (error) {
        wx.showToast({
          title: error.message || (this.isEditMode ? "保存失败" : "创建失败"),
          icon: "none",
        });
      } finally {
        wx.hideLoading();
      }
    },
  };
}

module.exports = {
  createActivityFormPage,
};
