// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {
    isLoggedIn: false,
    isLoading: true,
    userInfo: null,
    matchList: [
      {
        id: 1,
        title: "中日德兰 VS 格拉茨风暴",
        time: "2025.09.25 00:45",
        location: "成都市 | 天府新区实验中学中心综合体育馆",
        overlayText: "足下生风, 青春无悔",
        overlaySubtitle: "2025城市足球联赛观赛指南"
      },
      {
        id: 2,
        title: "塞萨洛尼基 VS 特拉维夫马卡比",
        time: "2025.09.25 00:45",
        location: "重庆市 | 重庆市潼南区潼南实验中学体育场",
        overlayText: "足球盛宴, 全城瞩目",
        overlaySubtitle: "2025城市足球联赛观赛指南"
      },
      {
        id: 3,
        title: "赫塔菲 VS 阿拉维斯",
        time: "2025.09.25 01:00",
        location: "重庆市 | 天府新区文化体育中心综合体育馆",
        overlayText: "激情碰撞, 精彩对决",
        overlaySubtitle: "2025城市足球联赛观赛指南"
      }
    ]
  },
  
  // 搜索功能
  onSearch() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  },
  
  // 选择城市
  onLocationSelect() {
    wx.showActionSheet({
      itemList: ['成都', '重庆', '北京', '上海', '广州'],
      success: (res) => {
        const cities = ['成都', '重庆', '北京', '上海', '广州']
        const selectedCity = cities[res.tapIndex]
        // 这里可以更新页面上的城市显示
        console.log('选择城市:', selectedCity)
      }
    })
  },
  
  // 查看赛事详情
  onMatchDetail(e: any) {
    const matchId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/match-detail/match-detail?id=${matchId}`
    })
  },
  
  // 查看更多赛事
  onViewMoreMatches() {
    wx.showToast({
      title: '更多赛事功能开发中',
      icon: 'none'
    })
  },
  
  // 检查登录状态
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      
      if (userInfo && userInfo.name) {
        // 用户已登录
        this.setData({
          isLoggedIn: true,
          isLoading: false,
          userInfo: userInfo
        })
        console.log('用户已登录:', userInfo.name)
      } else {
        // 用户未登录
        this.setData({
          isLoggedIn: false,
          isLoading: false
        })
        console.log('用户未登录')
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.setData({
        isLoggedIn: false,
        isLoading: false
      })
    }
  },

  // 跳转到登录页
  goToLogin() {
    wx.redirectTo({
      url: '/pages/login/login'
    })
  },

  // 页面加载时执行
  onLoad() {
    console.log('首页加载完成')
    this.checkLoginStatus()
  },

  // 页面显示时检查登录状态
  onShow() {
    this.checkLoginStatus()
  }
})
