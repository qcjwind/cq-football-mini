// app.ts
import authService from './service/auth'

App<IAppOption>({
  globalData: {
    isLoggedIn: false,
    loginUserInfo: null,
    needRegister: false, // 是否需要注册
    loginData: null, // 存储login接口返回的数据
    isLoggingIn: false // 防止重复调用login接口
  },

  onLaunch(query) {
    // 应用启动时检查登录状态
    this.checkLoginStatus()
    // 自动调用登录接口
    if(query?.path !== 'pages/login/login') {
      this.autoLogin()
    }
  },

  onShow() {
    // 应用从后台进入前台时检查登录状态
    this.checkLoginStatus()
  },

  // 自动登录
  async autoLogin() {
    try {
      // 防止重复调用
      if (this.globalData.isLoggingIn) {
        console.log('正在登录中，跳过重复调用')
        return
      }

      console.log('开始调用login接口检查用户状态...')
      wx.showLoading({
        title: 'Loading...'
      })
      const response = await authService.login()
      this.globalData.isLoggingIn = true
      console.log('login接口返回结果:', {
        code: response.code,
        reg: response.data?.reg,
        hasToken: !!response.data?.token,
        hasUserDO: !!response.data?.userDO
      });
      
      // 保存login数据到全局状态
      this.globalData.loginData = response
      
      if (response.code === 200) {
        if (response.data.reg) {
          // 需要注册，设置未登录状态
          console.log('用户需要注册，重定向到登录页面')
          this.globalData.isLoggedIn = false
          this.globalData.loginUserInfo = null
          this.globalData.needRegister = true
          // 不保存token，因为用户还没有完成注册
          
          // 延迟重定向，确保页面加载完成
          // setTimeout(() => {
          //   this.redirectToLogin()
          // }, 500)
        } else if (response.data.token) {
          // 登录成功，更新全局状态
          console.log('自动登录成功')
          this.globalData.isLoggedIn = true
          this.globalData.loginUserInfo = response.data.userDO || {}
          this.globalData.needRegister = false
          
          // 保存用户信息到本地存储
          try {
            wx.setStorageSync('userInfo', response.data.userDO || {})
            console.log('用户信息已保存到本地存储')
          } catch (error) {
            console.error('保存用户信息失败:', error)
          }
          
          // 通知首页加载赛事列表
          // this.notifyLoginSuccess()
        }
      } else {
        console.log('自动登录失败:', response.message)
        this.globalData.isLoggedIn = false
        this.globalData.loginUserInfo = null
        this.globalData.needRegister = false
        this.globalData.loginData = null
      }
    } catch (error) {
      console.error('自动登录失败:', error)
      this.globalData.isLoggedIn = false
      this.globalData.loginUserInfo = null
      this.globalData.needRegister = false
      this.globalData.loginData = null
    } finally {
      this.globalData.isLoggingIn = false
      wx.hideLoading()
    }
  },

  // 检查登录状态（基于login接口的结果）
  checkLoginStatus() {
    try {
      // 如果已经有login接口的返回结果，直接使用
      if (this.globalData.loginData) {
        console.log('使用login接口结果判断登录状态');
        if (this.globalData.loginData.code === 200 && !this.globalData.loginData.data.reg) {
          // 用户已登录且不需要注册
          this.globalData.isLoggedIn = true
          this.globalData.needRegister = false
          // 尝试从本地存储恢复用户信息
          try {
            const userInfo = wx.getStorageSync('userInfo')
            if (userInfo) {
              this.globalData.loginUserInfo = userInfo
            }
          } catch (error) {
            console.error('获取本地用户信息失败:', error)
          }
        } else {
          // 用户未登录或需要注册
          this.globalData.isLoggedIn = false
          this.globalData.needRegister = this.globalData.loginData.data.reg || false
          this.globalData.loginUserInfo = null
        }
        return
      }

      // 如果没有login接口结果，先尝试从本地存储判断（临时状态）
      const userInfo = wx.getStorageSync('userInfo')
      const hasToken = authService.checkLoginStatus()
      
      if (userInfo && hasToken) {
        console.log('使用本地存储判断登录状态（临时）');
        this.globalData.isLoggedIn = true
        this.globalData.loginUserInfo = userInfo
        this.globalData.needRegister = false
      } else {
        console.log('本地无登录信息，等待login接口调用');
        this.globalData.isLoggedIn = false
        this.globalData.loginUserInfo = null
        this.globalData.needRegister = false
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.globalData.isLoggedIn = false
      this.globalData.loginUserInfo = null
      this.globalData.needRegister = false
    }
  },


  // 设置登录状态
  setLoginStatus(userInfo: any) {
    this.globalData.isLoggedIn = true
    
    // 清理用户数据中的无效值
    if (userInfo) {
      const cleanValue = (value: any) => {
        if (value === undefined || value === null || value === 'undefined' || value === 'null') {
          return '';
        }
        return value;
      };
      
      this.globalData.loginUserInfo = {
        ...userInfo,
        name: cleanValue(userInfo.name),
        nickname: cleanValue(userInfo.nickname),
        avatarUrl: cleanValue(userInfo.avatarUrl)
      };
    } else {
      this.globalData.loginUserInfo = {};
    }
    
    this.globalData.needRegister = false
    this.globalData.loginData = null // 登录成功后清除login数据
    
    // 确保authService的状态也同步更新
    console.log('更新全局登录状态:', {
      isLoggedIn: this.globalData.isLoggedIn,
      hasToken: authService.isLoggedIn(),
      userInfo: this.globalData.loginUserInfo
    });

    // 通知首页加载赛事列表
    // this.notifyLoginSuccess();
  },

  // 通知登录成功
  // notifyLoginSuccess() {
  //   // 延迟通知，确保页面切换完成
  //   setTimeout(() => {
  //     // 获取当前页面栈
  //     const pages = getCurrentPages();
  //     const currentPage = pages[pages.length - 1];
      
  //     console.log('notifyLoginSuccess - 当前页面路由:', currentPage?.route);
      
  //     // 如果当前页面是首页，通知其加载赛事列表
  //     if (currentPage && currentPage.route === 'pages/index/index') {
  //       console.log('通知首页加载赛事列表');
  //       if (typeof currentPage.onLoginSuccess === 'function') {
  //         currentPage.onLoginSuccess();
  //       }
  //     } else {
  //       console.log('当前页面不是首页，等待页面切换完成...');
  //       // 如果当前页面不是首页，可能是正在切换中，再等待一下
  //       setTimeout(() => {
  //         const pages = getCurrentPages();
  //         const currentPage = pages[pages.length - 1];
  //         console.log('延迟检查 - 当前页面路由:', currentPage?.route);
          
  //         if (currentPage && currentPage.route === 'pages/index/index') {
  //           console.log('延迟通知首页加载赛事列表');
  //           if (typeof currentPage.onLoginSuccess === 'function') {
  //             currentPage.onLoginSuccess();
  //           }
  //         }
  //       }, 300);
  //     }
  //   }, 100);
  // },

  // 重定向到登录页面
  // redirectToLogin() {
  //   try {
  //     // 获取当前页面栈
  //     const pages = getCurrentPages()
  //     const currentPage = pages[pages.length - 1]
      
  //     // 如果当前页面不是登录页面，则跳转到登录页面
  //     if (currentPage && !currentPage.route.includes('login')) {
  //       console.log('重定向到登录页面')
  //       wx.redirectTo({
  //         url: '/pages/login/login',
  //         fail: (error) => {
  //           console.error('跳转登录页面失败:', error)
  //           // 如果navigateTo失败，尝试使用switchTab
  //           wx.switchTab({
  //             url: '/pages/my/my'
  //           })
  //         }
  //       })
  //     }
  //   } catch (error) {
  //     console.error('重定向到登录页面失败:', error)
  //   }
  // },

  // 检查并处理登录状态（供其他页面调用）
  checkAndHandleLoginStatus() {
    if (this.globalData.needRegister) {
      console.log('检测到用户需要注册，重定向到登录页面')
      // this.redirectToLogin()
      return false
    } else if (!this.globalData.isLoggedIn) {
      console.log('用户未登录，重定向到登录页面')
      // this.redirectToLogin()
      return false
    }
    return true
  },

  // 强制重新检查登录状态（调用login接口）
  async forceCheckLoginStatus() {
    console.log('强制重新检查登录状态...');
    this.globalData.loginData = null; // 清除旧的login数据
    await this.autoLogin(); // 重新调用login接口
  },

  // 清除登录状态
  clearLoginStatus() {
    this.globalData.isLoggedIn = false
    this.globalData.loginUserInfo = null
    this.globalData.needRegister = false
    this.globalData.loginData = null
    try {
      wx.removeStorageSync('userInfo')
      authService.logout()
    } catch (error) {
      console.error('清除登录信息失败:', error)
    }
  }
});