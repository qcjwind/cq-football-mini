// components/ticket-card/ticket-card.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    ticketInfo: {
      type: Object,
      value: {}
    },
    // 兼容旧版本属性
    matchTitle: {
      type: String,
      value: ''
    },
    coverImage: {
      type: String,
      value: ''
    },
    orderTime: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onCardTap() {
      this.triggerEvent('cardtap', {
        id: this.data.ticketInfo.id || null,
        matchTitle: this.data.ticketInfo.name || this.data.matchTitle
      })
    }
  }
})
