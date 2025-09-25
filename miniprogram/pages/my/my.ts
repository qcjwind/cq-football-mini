// pages/my/my.ts
const app = getApp<IAppOption>()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
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
    // 使用微信原生能力，简化登录状态检查
    // open-data组件会自动处理用户信息的显示
    try {
      // 可以检查是否有用户授权信息
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userInfo']) {
            this.setData({
              isLoggedIn: true
            })
          } else {
            this.setData({
              isLoggedIn: false
            })
          }
        }
      })
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.setData({
        isLoggedIn: false
      })
    }
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


  // 页面加载时执行
  onLoad() {
    console.log('我的页面加载完成')
    this.checkLoginStatus()
  },

  // 页面显示时检查登录状态
  onShow() {
    this.checkLoginStatus()
  }
})
