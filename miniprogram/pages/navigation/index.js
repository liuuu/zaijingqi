const venue = {
  name: "在惊奇",
  shortName: "在惊奇",
  address: "四川省成都市成华区地铁4号线万年场站B口",
  guide: "导航定位到地铁4号线万年场站B口，出站后按现场指引前往。",
  latitude: 30.64664,
  longitude: 104.11654,
};

Page({
  data: {
    venue,
  },

  openMap() {
    wx.showLoading({
      title: "打开地图",
      mask: true,
    });

    wx.openLocation({
      latitude: venue.latitude,
      longitude: venue.longitude,
      name: venue.name,
      address: venue.address,
      scale: 18,
      success() {
        wx.hideLoading();
      },
      fail(err) {
        wx.hideLoading();
        console.error("openLocation failed", err);
        wx.showModal({
          title: "地图打开失败",
          content: "可以先复制地址，再在微信地图或手机地图中搜索“地铁4号线万年场站B口”。",
          confirmText: "复制地址",
          cancelText: "知道了",
          success(res) {
            if (res.confirm) {
              wx.setClipboardData({
                data: `${venue.name}，${venue.address}`,
              });
            }
          },
        });
      },
    });
  },

  copyAddress() {
    wx.setClipboardData({
      data: `${venue.name}，${venue.address}`,
      success() {
        wx.showToast({
          title: "地址已复制",
          icon: "success",
        });
      },
    });
  },

  onShareAppMessage() {
    return {
      title: `${venue.shortName}到店导航`,
      path: "/pages/navigation/index",
    };
  },

  onShareTimeline() {
    return {
      title: `${venue.shortName}到店导航`,
      query: "",
    };
  },
});
