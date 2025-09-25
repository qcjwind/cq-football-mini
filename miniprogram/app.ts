// app.ts
App<IAppOption>({
  globalData: {
    isLoggedIn: false,
    loginUserInfo: null
  },
  
  onLaunch() {
    // 检查用户登录状态
    this.checkLoginStatus()
  },

  // 检查用户登录状态
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      
      if (userInfo && userInfo.name) {
        // 登录有效
        this.globalData.isLoggedIn = true
        this.globalData.loginUserInfo = userInfo
        console.log('用户已登录:', userInfo.name)
        
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        })
      } else {
        // 未登录，跳转到登录页
        // this.redirectToLogin()
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.redirectToLogin()
    }
  },

  // 跳转到登录页
  redirectToLogin() {
    wx.redirectTo({
      url: '/pages/login/login'
    })
  },

  // 清除登录信息
  clearLoginInfo() {
    wx.removeStorageSync('userInfo')
    this.globalData.isLoggedIn = false
    this.globalData.loginUserInfo = null
  },

  // 设置登录状态
  setLoginStatus(userInfo: any) {
    this.globalData.isLoggedIn = true
    this.globalData.loginUserInfo = userInfo
  },

  // 获取登录状态
  getLoginStatus() {
    return {
      isLoggedIn: this.globalData.isLoggedIn,
      userInfo: this.globalData.loginUserInfo
    }
  }
})