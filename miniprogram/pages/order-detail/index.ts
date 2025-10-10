import dayjs from "dayjs";
import { orderService, ticketService } from "../../service/index";

Page({
  data: {
    currentIndex: 0,
    detailInfo: {},
    type: "",
    labelMap: {
      ID_CARD: "身份证",
      PASSPORT: "护照",
      GAT_TXZ: "港澳通行证",
    },
    totalPrice: 0,
    isPurchasing: false,
    // 倒计时相关
    countdown: 0, // 剩余秒数
    countdownText: "00:00", // 格式化显示文本
    isCountdownActive: false, // 是否正在倒计时
    timer: null as any, // 定时器引用
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

  confirmPay() {
    try {
      this.setData({
        isPurchasing: true,
      });
      const {
        order: { payInfo, id },
      } = (this.data.detailInfo as any) || {};
      const pay = JSON.parse(payInfo);
      wx.requestPayment({
        timeStamp: pay?.timeStamp,
        nonceStr: pay?.nonceStr,
        package: pay?.packageValue,
        signType: pay?.signType,
        paySign: pay?.paySign,
        success: (res) => {
          wx.showToast({
            title: "支付成功",
            icon: "success",
          });
          if (res.errMsg === "requestPayment:ok") {
            this.loopPayResult(id);
          }
        },
        complete: () => {
          this.setData({
            isPurchasing: false,
          });
        },
      });
    } catch (error) {
      this.setData({
        isPurchasing: false,
      });
    }
  },

  loopPayResult(id: number) {
    wx.showLoading({
      title: "查询支付结果...",
    });
    let currentTime = 0;
    const timer = setInterval(() => {
      if (currentTime > 10) {
        clearInterval(timer);
        wx.hideLoading();
        return;
      }
      currentTime++;
      ticketService.getOrderPayLoop(id).then((res) => {
        console.log(res);
        if (
          res.code === 200 &&
          res.data?.order?.orderStatus === "PAY_SUCCESS"
        ) {
          this.getOrderDetail(id + "");
          clearInterval(timer);
          wx.hideLoading();
        }
      });
    }, 1000);
  },

  cancelOrder() {
    wx.showModal({
      title: "提示",
      content: "确定取消订单吗？",
      success: (res) => {
        if (res.confirm) {
          this.cancelOrderHandle();
        }
      },
    });
  },
  cancelOrderHandle() {
    wx.showLoading({
      title: "取消订单中...",
    });
    const { order } = (this.data.detailInfo as any) || {};
    ticketService
      .cancelOrder(order.id)
      .then((res) => {
        if (res.code === 200) {
          wx.showToast({
            title: "取消订单成功",
            icon: "success",
          });
          this.getOrderDetail(order.id + "");
        }
      })
      .finally(() => {
        wx.hideLoading();
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

  // 15分钟倒计时
  startCountdown(startTime: string) {
    // 计算结束时间（订单创建时间 + 15分钟）
    const endTime = dayjs(startTime).add(15, "minutes");
    const now = dayjs();
    // 计算剩余秒数
    const remainingSeconds = endTime.diff(now, "seconds");

    // 如果已经超时，不启动倒计时
    if (remainingSeconds <= 0) {
      this.setData({
        isCountdownActive: false,
        countdown: 0,
        countdownText: "00:00",
      });
      return;
    }

    // 启动倒计时
    this.setData({
      isCountdownActive: true,
      countdown: remainingSeconds,
    });

    // 立即更新一次显示
    this.updateCountdownDisplay(remainingSeconds);

    // 设置定时器
    this.data.timer = setInterval(() => {
      const currentTime = dayjs();
      const remainingSeconds = endTime.diff(currentTime, "seconds");

      if (remainingSeconds <= 0) {
        this.stopCountdown();
        return;
      }

      this.setData({
        countdown: remainingSeconds,
      });
      this.updateCountdownDisplay(remainingSeconds);
    }, 1000);
  },

  // 更新倒计时显示文本
  updateCountdownDisplay(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeText = `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;

    this.setData({
      countdownText: timeText,
    });
  },

  // 停止倒计时
  stopCountdown() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({
        timer: null,
        isCountdownActive: false,
        countdown: 0,
        countdownText: "00:00",
      });
    }
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
        this.startCountdown(res.data?.order?.orderTime);
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
  onAddressTap() {
    const { arena } = (this.data?.detailInfo as any) || {};

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

  // 页面卸载时清理定时器
  onUnload() {
    this.stopCountdown();
  },

  // 页面隐藏时清理定时器
  onHide() {
    this.stopCountdown();
  },
});
