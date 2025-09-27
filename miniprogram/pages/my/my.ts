// pages/my/my.ts
import ticketService, { TicketInfo } from "../../service/ticket";
import orderService, { OrderInfo } from "../../service/order";

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      maskName: "",
    },
    needRegister: false, // 是否需要注册
    activeTab: "order", // 默认显示订单tab
    // 票务相关数据
    ticketList: [] as TicketInfo[], // 票务列表
    ticketLoading: false, // 票务加载状态
    ticketHasMore: true, // 票务是否还有更多数据
    ticketPageNumber: 1, // 票务当前页码
    // 订单相关数据
    orderList: [] as OrderInfo[], // 订单列表
    orderLoading: false, // 订单加载状态
    orderHasMore: true, // 订单是否还有更多数据
    orderPageNumber: 1, // 订单当前页码
    pageSize: 10, // 每页数量
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp<IAppOption>();
    const loginUserInfo = app.globalData.loginUserInfo || {};

    // 处理字符串 "undefined" 的情况
    const getValidValue = (value: any) => {
      if (
        value === undefined ||
        value === null ||
        value === "undefined" ||
        value === "null"
      ) {
        return "";
      }
      return value || "";
    };

    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      needRegister: app.globalData.needRegister || false,
      userInfo: {
        maskName: getValidValue(loginUserInfo.maskName),
      },
    });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: "/pages/login/login",
    });
  },

  // Tab切换
  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
    });

    // 根据tab类型重新加载数据
    if (tab === "order") {
      this.loadOrderList(true); // 强制刷新
    } else if (tab === "ticket") {
      this.loadTicketList(true); // 强制刷新
    }
  },

  // 加载订单列表
  async loadOrderList(refresh: boolean = false) {
    if (this.data.orderLoading) return;

    try {
      this.setData({ orderLoading: true });
      wx.showLoading({ title: "loading..." });
      const pageNumber = refresh ? 1 : this.data.orderPageNumber;
      const response = await orderService.getMyOrderList({
        pageNumber,
        pageSize: this.data.pageSize,
      });

      if (response.code === 200) {
        const newOrderList = response.data || [];
        const orderList = refresh
          ? newOrderList
          : [...this.data.orderList, ...newOrderList];

        this.setData({
          orderList,
          orderPageNumber: pageNumber + 1,
          orderHasMore: newOrderList.length === this.data.pageSize,
          orderLoading: false,
        });
        wx.hideLoading();
      } else {
        wx.showToast({
          title: response.message || "获取订单列表失败",
          icon: "none",
        });
        this.setData({
          orderLoading: false,
        });
        wx.hideLoading();
      }
    } catch (error) {
      console.error("加载订单列表失败:", error);
      wx.showToast({
        title: "加载失败，请重试",
        icon: "none",
      });
      this.setData({
        orderLoading: false,
      });
    }
  },

  // 加载票务列表
  async loadTicketList(refresh: boolean = false) {
    if (this.data.ticketLoading) return;

    try {
      this.setData({ ticketLoading: true });
      wx.showLoading({ title: "loading..." });
      const pageNumber = refresh ? 1 : this.data.ticketPageNumber;
      const response = await ticketService.getMyTicketList({
        pageNumber,
        pageSize: this.data.pageSize,
      });

      if (response.code === 200) {
        const newTicketList = response.data || [];
        const ticketList = refresh
          ? newTicketList
          : [...this.data.ticketList, ...newTicketList];

        this.setData({
          ticketList,
          ticketPageNumber: pageNumber + 1,
          ticketHasMore: newTicketList.length === this.data.pageSize,
          ticketLoading: false,
        });
        wx.hideLoading();
      } else {
        wx.showToast({
          title: response.message || "获取票务列表失败",
          icon: "none",
        });
        this.setData({
          ticketLoading: false,
        });
        wx.hideLoading();
      }
    } catch (error) {
      console.error("加载票务列表失败:", error);
      wx.showToast({
        title: "加载失败，请重试",
        icon: "none",
      });
      this.setData({
        ticketLoading: false,
      });
    }
  },

  // 订单卡片点击事件
  onOrderCardTap(e: any) {
    const { orderId, type } = e.detail;
    console.log("点击订单卡片:", orderId);

    // 跳转到订单详情页
    wx.navigateTo({
      url: `/pages/order-detail/index?orderId=${orderId}&type=${type}`,
    });
  },

  // 票夹卡片点击事件
  onTicketCardTap(e: any) {
    const { orderId, type } = e.detail;

    // 跳转到订单详情页
    wx.navigateTo({
      url: `/pages/order-detail/index?orderId=${orderId}&type=${type}`,
    });
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },

  // 页面显示时检查登录状态
  onShow() {
    this.checkLoginStatus();

    // 检查是否需要重定向到登录页面
    const app = getApp<IAppOption>();
    if (!app.checkAndHandleLoginStatus()) {
      // 如果需要重定向，则不需要继续执行后续逻辑
      return;
    }

    // 更新用户信息
    const loginUserInfo = app.globalData.loginUserInfo || {};

    // 处理字符串 "undefined" 的情况
    const getValidValue = (value: any) => {
      if (
        value === undefined ||
        value === null ||
        value === "undefined" ||
        value === "null"
      ) {
        return "";
      }
      return value || "";
    };

    this.setData({
      userInfo: {
        maskName: getValidValue(loginUserInfo.maskName),
      },
    });
    // 如果已登录且是默认的订单tab且还未加载数据，则加载订单数据
    if (
      this.data.isLoggedIn &&
      this.data.activeTab === "order" &&
      this.data.orderList.length === 0
    ) {
      this.loadOrderList();
    }
  },
});
