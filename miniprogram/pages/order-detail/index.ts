Page({
  data: {
    billList: [{}, {}],
    currentIndex: 0,
  },
  onSwiperChange(e: any) {
    this.setData({
      currentIndex: e.detail.current,
    });
  },
});
