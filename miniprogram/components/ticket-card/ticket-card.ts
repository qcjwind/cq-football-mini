// components/ticket-card/ticket-card.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
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
        matchTitle: this.data.matchTitle
      })
    }
  }
})
