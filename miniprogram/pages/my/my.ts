// pages/my/my.ts
Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    needRegister: false, // 是否需要注册
    activeTab: 'order', // 默认显示订单tab
    ticketList: [
      {
        id: 1,
        matchTitle: "塞萨洛尼基 VS 特拉维夫马卡比",
        coverImage: "",
        orderTime: "2025-07-21 13:36"
      },
      {
        id: 2,
        matchTitle: "中日德兰 VS 格拉茨风暴",
        coverImage: "",
        orderTime: "2025-07-20 15:22"
      }
    ]
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp<IAppOption>()
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      needRegister: app.globalData.needRegister || false
    })
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // Tab切换
  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
  },

  // 票夹卡片点击事件
  onTicketCardTap(e: any) {
    const { matchTitle } = e.detail
    console.log('点击票夹卡片:', matchTitle)
    
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


  // 页面加载时执行
  onLoad() {
    console.log('我的页面加载完成')
    this.checkLoginStatus()
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
  }
})
