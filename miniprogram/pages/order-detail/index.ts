import { orderService, ticketService } from "../../service/index";

Page({
  data: {
    currentIndex: 0,
    detailInfo: {},
    type: "",
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
    this.setData({
      type,
    });
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
      const data = res.data;
      if (Object.prototype.toString.call(data?.ticket) !== "[object Array]") {
        data.ticketList = [data.ticket];
      }
      this.setData({
        detailInfo: data,
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
  onAddressTap() {
    const { arena } = this.data?.detailInfo;

    if (!arena || !arena?.venueAddress) {
      wx.showToast({
        title: "地址信息不完整",
        icon: "none",
      });
      return;
    }

    // 检查是否有经纬度信息
    if (arena.venueLat && arena.venueLng) {
      const latitude = parseFloat(arena.venueLat);
      const longitude = parseFloat(arena.venueLng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        // 有经纬度信息，使用微信内置地图导航
        wx.openLocation({
          latitude,
          longitude,
          name: arena.name || "比赛场馆",
          address: arena.venueAddress,
          scale: 18,
          success: () => {
            console.log("打开地图成功");
          },
          fail: (error) => {
            console.error("打开地图失败:", error);
            this.showNavigationOptions(arena.venueAddress);
          },
        });
        return;
      }
    }

    // 没有经纬度信息，显示导航选项
    this.showNavigationOptions(arena.venueAddress);
  },
  showNavigationOptions(address: string) {
    wx.showActionSheet({
      itemList: ["复制地址", "使用系统地图导航"],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制地址
          wx.setClipboardData({
            data: address,
            success: () => {
              wx.showToast({
                title: "地址已复制",
                icon: "success",
              });
            },
            fail: () => {
              wx.showToast({
                title: "复制失败",
                icon: "none",
              });
            },
          });
        } else if (res.tapIndex === 1) {
          // 使用系统地图导航（这里可以调用第三方地图API）
          this.openSystemMap(address);
        }
      },
    });
  },
  openSystemMap(address: string) {
    // 复制地址到剪贴板，用户可以粘贴到地图应用中
    wx.setClipboardData({
      data: address,
      success: () => {
        wx.showModal({
          title: "导航提示",
          content:
            "已复制地址到剪贴板，您可以在高德地图、百度地图等导航应用中搜索该地址进行导航。",
          showCancel: false,
          confirmText: "知道了",
        });
      },
    });
  },
});
