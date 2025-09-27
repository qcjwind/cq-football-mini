// components/ticket-card/ticket-card.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    orderInfo: {
      type: Object,
      value: {}
    },
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
        orderId: this.data.orderInfo.id || null,
        type: 'order'
      })
    }
  }
})
