Page({
  data: {
    url: "",
  },
  onLoad(options: any) {
    this.setData({
      url: decodeURIComponent(options.url),
    });
    wx.setNavigationBarTitle({
      title: options.title,
    });
  },
});
