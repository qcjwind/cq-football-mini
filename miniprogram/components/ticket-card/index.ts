// components/order-card/order-card.ts
import { OrderInfo } from '../../service/order';

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    ticketInfo: {
      type: Object,
      value: {} as OrderInfo
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
        orderId: this.data.ticketInfo.id || null,
        type: 'ticket'
      })
    }
  }
})
