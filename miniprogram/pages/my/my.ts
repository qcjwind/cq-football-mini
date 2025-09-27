// pages/my/my.ts
import ticketService, { TicketInfo } from '../../service/ticket';
import orderService, { OrderInfo } from '../../service/order';
import authService from '../../service/auth';

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      name: '',
      nickname: '',
      avatarUrl: ''
    },
    needRegister: false, // 是否需要注册
    activeTab: 'order', // 默认显示订单tab
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
    pageSize: 10 // 每页数量
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp<IAppOption>()
    const loginUserInfo = app.globalData.loginUserInfo || {};
    
    // 处理字符串 "undefined" 的情况
    const getValidValue = (value: any) => {
      if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        return '';
      }
      return value || '';
    };
    
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      needRegister: app.globalData.needRegister || false,
      userInfo: {
        name: getValidValue(loginUserInfo.name),
        nickname: getValidValue(loginUserInfo.nickname),
        avatarUrl: getValidValue(loginUserInfo.avatarUrl)
      }
    })
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 选择头像
  async onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail;
    
    try {
      // 先更新本地显示
      this.setData({
        "userInfo.avatarUrl": avatarUrl
      });
      
      // 调用更新用户信息接口
      const response = await authService.updateUser({
        avatarUrl: avatarUrl
      });
      
      if (response.code === 200) {
        // 更新全局用户信息缓存
        const app = getApp<IAppOption>();
        const updatedUserInfo = {
          ...app.globalData.loginUserInfo,
          avatarUrl: avatarUrl
        };
        
        // 更新全局状态
        app.globalData.loginUserInfo = updatedUserInfo;
        
        // 更新本地存储
        wx.setStorageSync('userInfo', updatedUserInfo);
      } else {
        // 更新失败，恢复原头像
        const app = getApp<IAppOption>();
        this.setData({
          "userInfo.avatarUrl": app.globalData.loginUserInfo?.avatarUrl || ''
        });
      }
    } catch (error) {
      console.error('更新头像失败:', error);
      
      // 恢复原头像
      const app = getApp<IAppOption>();
      this.setData({
        "userInfo.avatarUrl": app.globalData.loginUserInfo?.avatarUrl || ''
      });
    }
  },

  // 昵称输入变化
  async onInputChange(e: any) {
    const nickName = e.detail.value;
    
    if (!nickName.trim()) {
      return; // 空昵称不处理
    }
    
    try {
      // 先更新本地显示
      this.setData({
        "userInfo.nickname": nickName,
      });
      
      // 调用更新用户信息接口
      const response = await authService.updateUser({
        nickname: nickName
      });
      
      if (response.code === 200) {
        // 更新全局用户信息缓存
        const app = getApp<IAppOption>();
        const updatedUserInfo = {
          ...app.globalData.loginUserInfo,
          nickname: nickName
        };
        
        // 更新全局状态
        app.globalData.loginUserInfo = updatedUserInfo;
        
        // 更新本地存储
        wx.setStorageSync('userInfo', updatedUserInfo);
        
        wx.showToast({
          title: '昵称更新成功',
          icon: 'success',
          duration: 2000
        });
      } else {
      }
    } catch (error) {
      console.error('更新昵称失败:', error);
    }
  },


  // Tab切换
  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
    
    // 根据tab类型加载对应数据
    if (tab === 'order' && this.data.orderList.length === 0) {
      this.loadOrderList()
    } else if (tab === 'ticket' && this.data.ticketList.length === 0) {
      this.loadTicketList()
    }
  },

  // 加载订单列表
  async loadOrderList(refresh: boolean = false) {
    if (this.data.orderLoading) return;
    
    try {
      this.setData({ orderLoading: true });
      
      const pageNumber = refresh ? 1 : this.data.orderPageNumber;
      const response = await orderService.getMyOrderList({
        pageNumber,
        pageSize: this.data.pageSize
      });
      
      if (response.code === 200) {
        const newOrderList = response.data || [];
        const orderList = refresh ? newOrderList : [...this.data.orderList, ...newOrderList];
        
        this.setData({
          orderList,
          orderPageNumber: pageNumber + 1,
          orderHasMore: newOrderList.length === this.data.pageSize,
          orderLoading: false
        });
      } else {
        wx.showToast({
          title: response.message || '获取订单列表失败',
          icon: 'none'
        });
        this.setData({
          orderLoading: false
        });
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({
        orderLoading: false
      });
    }
  },

  // 加载票务列表
  async loadTicketList(refresh: boolean = false) {
    if (this.data.ticketLoading) return;
    
    try {
      this.setData({ ticketLoading: true });
      
      const pageNumber = refresh ? 1 : this.data.ticketPageNumber;
      const response = await ticketService.getMyTicketList({
        pageNumber,
        pageSize: this.data.pageSize
      });
      
      if (response.code === 200) {
        const newTicketList = response.data || [];
        const ticketList = refresh ? newTicketList : [...this.data.ticketList, ...newTicketList];
        
        this.setData({
          ticketList,
          ticketPageNumber: pageNumber + 1,
          ticketHasMore: newTicketList.length === this.data.pageSize,
          ticketLoading: false
        });
      } else {
        wx.showToast({
          title: response.message || '获取票务列表失败',
          icon: 'none'
        });
        this.setData({
          ticketLoading: false
        });
      }
    } catch (error) {
      console.error('加载票务列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({
        ticketLoading: false
      });
    }
  },

  // 订单卡片点击事件
  onOrderCardTap(e: any) {
    const orderId = e.currentTarget.dataset.id
    console.log('点击订单卡片:', orderId)
    
    // 这里可以跳转到订单详情页
    wx.showToast({
      title: '查看订单详情',
      icon: 'none'
    })
  },

  // 票夹卡片点击事件
  onTicketCardTap(e: any) {
    const ticketId = e.detail.id
    console.log('点击票夹卡片:', ticketId)
    
    // 这里可以跳转到票夹详情页
    wx.showToast({
      title: '查看票夹详情',
      icon: 'none'
    })
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 页面显示时检查登录状态
  onShow() {
    this.checkLoginStatus()
    
    // 检查是否需要重定向到登录页面
    const app = getApp<IAppOption>()
    if (!app.checkAndHandleLoginStatus()) {
      // 如果需要重定向，则不需要继续执行后续逻辑
      return
    }
    
    // 更新用户信息
    const loginUserInfo = app.globalData.loginUserInfo || {};
    
    // 处理字符串 "undefined" 的情况
    const getValidValue = (value: any) => {
      if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        return '';
      }
      return value || '';
    };
    
    this.setData({
      userInfo: {
        name: getValidValue(loginUserInfo.name),
        nickname: getValidValue(loginUserInfo.nickname),
        avatarUrl: getValidValue(loginUserInfo.avatarUrl)
      }
    })
    
    // 如果已登录且是默认的订单tab且还未加载数据，则加载订单数据
    if (this.data.isLoggedIn && this.data.activeTab === 'order' && this.data.orderList.length === 0) {
      this.loadOrderList()
    }
  }
})
