// ticket-select.ts
import matchService from '../../service/match';

interface AreaItem {
  id: string;
  name: string;
  price: number;
  status: 'available' | 'soldout' | 'outofstock' | 'full';
  selected?: boolean;
}

interface SessionItem {
  id: string;
  name: string;
  date: string;
  time: string;
  selected?: boolean;
}

Page({
  data: {
    matchInfo: null as any,
    skuList: [] as any[],
    loading: true,
    selectedSession: null as SessionItem | null,
    selectedArea: null as AreaItem | null,
    areaList: [] as AreaItem[],
    sessionList: [] as SessionItem[],
    totalPrice: 0,
    limitText: '每个身份证限购1张'
  },

  onLoad(options: any) {
    const matchId = options.id
    if (matchId) {
      this.loadMatchData(matchId)
    }
  },

  async loadMatchData(matchId: string) {
    try {
      console.log('加载购票数据:', matchId)
      
      // 调用真实的API接口
      const response = await matchService.getMatchInfo({ matchId: Number(matchId) })
      
      if (response.code === 200 && response.data) {
        const { match, skuList } = response.data
        
        // 处理场次数据
        const sessionList: SessionItem[] = this.processSessionData(match)
        
        // 处理区域数据
        const areaList: AreaItem[] = this.processSkuData(skuList)
        
        // 设置默认选中项
        const selectedSession = sessionList.length > 0 ? sessionList[0] : null
        const selectedArea = areaList.find(item => item.status === 'available') || null
        
        this.setData({
          matchInfo: match,
          skuList: skuList || [],
          sessionList,
          areaList,
          selectedSession,
          selectedArea,
          totalPrice: selectedArea?.price || 0,
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
      console.error('加载购票数据失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({
        loading: false
      })
    }
  },

  // 处理场次数据
  processSessionData(match: any): SessionItem[] {
    if (!match) return []
    
    // 格式化时间
    const startTime = new Date(match.startTime)
    const dateStr = `${startTime.getFullYear()}.${String(startTime.getMonth() + 1).padStart(2, '0')}.${String(startTime.getDate()).padStart(2, '0')}`
    const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
    
    return [{
      id: match.id.toString(),
      name: match.name,
      date: dateStr,
      time: timeStr,
      selected: true
    }]
  },

  // 处理SKU数据，转换为区域数据
  processSkuData(skuList: any[]): AreaItem[] {
    if (!skuList || skuList.length === 0) {
      return []
    }
    
    return skuList.filter(sku => sku.skuType === 'SALE_TICKET').map((sku, index) => {
      // 根据剩余票数确定区域状态
      let status: 'available' | 'soldout' | 'outofstock' | 'full' = 'available'
      
      if (sku.stockTicket === 0) {
        status = 'soldout'  // 售罄
      } else if (sku.stockTicket < 10) {
        status = 'outofstock'  // 库存不足
      } else {
        status = 'available'  // 可购买
      }
      
      return {
        id: sku.id.toString(),
        name: sku.skuName || sku.area || `区域${index + 1}`,
        price: sku.price,
        status,
        selected: index === 0 && status === 'available' // 第一个可用区域默认选中
      }
    })
  },

  onSessionSelect(e: any) {
    const sessionId = e.currentTarget.dataset.id
    const sessionList = this.data.sessionList.map(item => ({
      ...item,
      selected: item.id === sessionId
    }))
    const selectedSession = sessionList.find(item => item.selected) || null
    
    this.setData({
      sessionList,
      selectedSession
    })
  },

  onAreaSelect(e: any) {
    const areaId = e.currentTarget.dataset.id
    const areaList = this.data.areaList.map(item => ({
      ...item,
      selected: item.id === areaId
    }))
    const selectedArea = areaList.find(item => item.selected) || null
    
    if(selectedArea?.status === 'soldout'){
      wx.showToast({
        title: '该区域不可选',
        icon: 'none'
      })
      return
    }

    this.setData({
      areaList,
      selectedArea,
      totalPrice: selectedArea?.price || 0
    })
  },

  onBuyNow() {
    if (!this.data.selectedArea || !this.data.selectedArea?.selected) {
      wx.showToast({
        title: '请选择区域',
        icon: 'none'
      })
      return
    }

    if (this.data.selectedArea.status === 'soldout') {
      wx.showToast({
        title: '该区域不可选',
        icon: 'none'
      })
      return
    }

    // 跳转到订单确认页面
    wx.navigateTo({
      url: `/pages/order-confirm/order-confirm?matchId=${this.data.matchInfo.id}&skuId=${this.data.selectedArea.id}`
    })
  },

})
