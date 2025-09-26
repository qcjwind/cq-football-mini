// match-detail.ts
import matchService from '../../service/match';

Page({
  data: {
    matchInfo: null as any,
    arenaInfo: null as any,
    skuList: [] as any[],
    loading: true
  },

  onLoad(options: any) {
    const matchId = options.id
    if (matchId) {
      this.loadMatchDetail(matchId)
    }
  },

  async loadMatchDetail(matchId: string) {
    try {
      console.log('加载赛事详情:', matchId)
      
      // 调用真实的API接口
      const response = await matchService.getMatchInfo(Number(matchId))
      
      if (response.code === 200 && response.data) {
        const { match, arena, skuList } = response.data
        
        this.setData({
          matchInfo: match,
          arenaInfo: arena,
          skuList: skuList || [],
          loading: false
        })
      } else {
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
        this.setData({
          loading: false
        })
      }
    } catch (error) {
      console.error('加载赛事详情失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({
        loading: false
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
