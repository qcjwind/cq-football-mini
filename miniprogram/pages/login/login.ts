// login.ts
Page({
  data: {
    formData: {
      name: '',
      idType: '',
      idNumber: ''
    },
    idTypeOptions: [
      { label: '身份证', value: '身份证' },
      { label: '护照', value: '护照' },
      { label: '军官证', value: '军官证' },
      { label: '港澳通行证', value: '港澳通行证' },
      { label: '台胞证', value: '台胞证' }
    ],
    backgroundImage: '/assets/login_back.png' // 使用本地背景图片
  },

  onLoad() {
    // 页面加载时的初始化逻辑
    console.log('登录页面加载完成');
  },

  // 姓名输入处理
  onNameInput(e: any) {
    const name = e.detail.value;
    this.setData({
      'formData.name': name
    });
  },

  // 证件类型选择
  onIdTypeSelect() {
    const options = this.data.idTypeOptions.map(item => item.label);
    
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const selectedType = this.data.idTypeOptions[res.tapIndex];
        this.setData({
          'formData.idType': selectedType.value
        });
      },
      fail: (res) => {
        console.log('用户取消选择证件类型', res);
      }
    });
  },

  // 证件号输入处理
  onIdNumberInput(e: any) {
    const idNumber = e.detail.value;
    this.setData({
      'formData.idNumber': idNumber
    });
  },

  // 登录处理
  onLogin() {
    const { name, idType, idNumber } = this.data.formData;
    
    // 表单验证
    if (!name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!idType) {
      wx.showToast({
        title: '请选择证件类型',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!idNumber.trim()) {
      wx.showToast({
        title: '请输入证件号',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 证件号格式验证
    if (idType === '身份证' && !this.validateIdCard(idNumber)) {
      wx.showToast({
        title: '请输入正确的身份证号',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 显示加载状态
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    // 模拟登录请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 登录成功
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 2000
      });

      // 保存登录信息到本地存储
      wx.setStorageSync('userInfo', {
        name: name,
        idType: idType,
        idNumber: idNumber,
        loginTime: new Date().getTime()
      });

      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);

    }, 2000);
  },

  // 身份证号验证
  validateIdCard(idCard: string): boolean {
    // 简单的身份证号格式验证
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
  },
});
