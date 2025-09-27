import { orderService, ticketService } from "../../service/index";

Page({
  data: {
    billList: [{}, {}],
    currentIndex: 0,
    detailInfo: {},
  },
  onLoad(options: any) {
    const { orderId, type } = options;
    if (type === "order") {
      wx.setNavigationBarTitle({
        title: "订单详情",
      });
      this.getOrderDetail(orderId);
    } else {
      wx.setNavigationBarTitle({
        title: "票务详情",
      });
      this.getTicketDetail(orderId);
    }
  },
  onSwiperChange(e: any) {
    this.setData({
      currentIndex: e.detail.current,
    });
  },

  getTicketDetail(ticketId: string) {
    wx.showLoading({
      title: "Loading...",
    });
    ticketService.getTicketDetail(ticketId).then((res) => {
      this.setData({
        detailInfo: res.data,
      });
    });
  },
  getOrderDetail(orderId: string) {
    wx.showLoading({
      title: "Loading...",
    });
    orderService
      .getOrderDetail(orderId)
      .then((res) => {
        this.setData({
          detailInfo: res.data,
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
});
