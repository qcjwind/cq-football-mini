// match-detail.ts
Page({
  data: {
    matchInfo: {
      id: 1,
      title: "中日德兰 VS 格拉茨风暴",
      time: "2025.08.22 周六 17:20",
      venue: "成都市天府新区文化体育中心综合体育馆",
      address: "天府新区文化体路888号",
      price: 80
    }
  },

  onLoad(options: any) {
    const matchId = options.id
    if (matchId) {
      this.loadMatchDetail(matchId)
    }
  },

  loadMatchDetail(matchId: string) {
    // 根据matchId加载对应的赛事详情
    // 这里可以根据实际需求从服务器获取数据
    console.log('加载赛事详情:', matchId)
    
    // 模拟数据，实际项目中应该从API获取
    const matchData = {
      1: {
        id: 1,
        title: "中日德兰 VS 格拉茨风暴",
        time: "2025.08.22 周六 17:20",
        venue: "成都市天府新区文化体育中心综合体育馆",
        address: "天府新区文化体路888号",
        price: 80
      },
      2: {
        id: 2,
        title: "塞萨洛尼基 VS 特拉维夫马卡比",
        time: "2025.09.25 00:45",
        venue: "重庆市潼南区潼南实验中学体育场",
        address: "潼南区潼南实验中学体育场",
        price: 120
      },
      3: {
        id: 3,
        title: "赫塔菲 VS 阿拉维斯",
        time: "2025.09.25 01:00",
        venue: "天府新区文化体育中心综合体育馆",
        address: "天府新区文化体路888号",
        price: 150
      }
    }

    const matchInfo = matchData[matchId as '1' | '2' | '3']
    if (matchInfo) {
      this.setData({
        matchInfo
      })
    }
  },

  onBuyTicket() {
    wx.showToast({
      title: '购票功能开发中',
      icon: 'none'
    })
  }
})
