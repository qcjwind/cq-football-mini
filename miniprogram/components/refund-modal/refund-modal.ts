// refund-modal.ts
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    refundRules: {
      type: Array,
      value: []
    },
    endTime: {
      type: String,
      value: ''
    }
  },

  data: {
    // 组件内部数据
  },

  methods: {
    // 点击遮罩层关闭弹窗
    onOverlayTap() {
      this.triggerEvent('close');
    },

    // 点击弹窗内容区域（阻止事件冒泡）
    onModalTap() {
      // 空方法，用于阻止事件冒泡
    },

    // 点击关闭按钮
    onClose() {
      this.triggerEvent('close');
    },

    // 点击取消按钮
    onCancel() {
      this.triggerEvent('cancel');
    },

    // 点击确定退款按钮
    onConfirm() {
      this.triggerEvent('confirm');
    },
  }
});
