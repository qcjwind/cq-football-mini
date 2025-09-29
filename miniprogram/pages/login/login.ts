// login.ts
import authService from "../../service/auth";

interface LoginQuery {
  ticketBid?: string;
  type?: string;
}

Page({
  data: {
    formData: {
      name: "",
      idType: "身份证",
      idNumber: "",
    },
    ticketBid: "",
    type: "",
    phoneData: null as { encryptedData: string; iv: string } | null, // 存储手机号加密数据
    loginData: null as { openid: string; sessionKey: string } | null, // 存储login接口返回的数据
    idTypeOptions: [
      { label: "身份证", value: "身份证" },
      { label: "护照", value: "护照" },
      { label: "港澳通行证", value: "港澳通行证" },
    ],
    backgroundImage: "/assets/login_back.png", // 使用本地背景图片
  },

  onLoad(query: LoginQuery) {
    // 页面加载时的初始化逻辑
    const q = decodeURIComponent(query?.q);
    const params = this.getUrlParams(q);
    if (params?.type === "gift") {
      wx.setStorageSync("giftSuccess", params?.ticketBid);
    }
    this.setData({
      ticketBid: params?.ticketBid,
      type: params?.type,
    });

    this.getLoginData();
  },

  getUrlParams(url: string) {
    // 解析url查询参数 微信不支持URLSearchParams
    const obj = {};
    url
      .split("?")[1]
      .split("&")
      .forEach((item) => {
        const [key, value] = item.split("=");
        obj[key] = value;
      });
    console.log("params", obj);
    return obj;
  },

  // 获取login接口数据
  async getLoginData() {
    try {
      const app = getApp<IAppOption>();

      // 优先使用全局的login数据
      if (app.globalData.loginData) {
        console.log("使用全局login数据");
        this.setData({
          loginData: {
            openid: app.globalData.loginData.data.openid,
            sessionKey: app.globalData.loginData.data.sessionKey,
          },
        });
        console.log("获取login数据成功:", this.data.loginData);
        return;
      }

      // 如果全局没有数据，说明app.ts的login调用可能失败了，需要重新调用
      console.log("全局没有login数据，重新调用login接口...");
      const response = await authService.login();
      if (response.code === 200) {
        this.setData({
          loginData: {
            openid: response.data.openid,
            sessionKey: response.data.openid, // 暂时使用openid，如果接口有专门的sessionKey字段需要调整
          },
        });
        console.log("获取login数据成功:", this.data.loginData);
        console.log("Login响应数据:", response.data);
        if (!response.data.reg) {
          wx.switchTab({
            url: "/pages/index/index",
          });
        }
      } else {
        console.error("获取login数据失败:", response.msg);
        wx.showToast({
          title: response.msg || "获取登录信息失败，请重试",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("获取login数据异常:", error);
      wx.showToast({
        title: error?.msg || "获取登录信息失败，请重试",
        icon: "none",
      });
    }
  },

  // 姓名输入处理
  onNameInput(e: any) {
    const name = e.detail.value;
    this.setData({
      "formData.name": name,
    });
  },

  // 证件类型选择
  onIdTypeSelect() {
    const options = this.data.idTypeOptions.map((item) => item.label);

    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const selectedType = this.data.idTypeOptions[res.tapIndex];
        this.setData({
          "formData.idType": selectedType.value,
        });
      },
      fail: (res) => {
        console.log("用户取消选择证件类型", res);
      },
    });
  },

  // 证件号输入处理
  onIdNumberInput(e: any) {
    const idNumber = e.detail.value;
    this.setData({
      "formData.idNumber": idNumber,
    });
  },

  // 登录按钮点击事件
  onLogin() {
    const { name, idType, idNumber } = this.data.formData;

    // 表单验证
    if (!name.trim()) {
      wx.showToast({
        title: "请输入姓名",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    if (!idType) {
      wx.showToast({
        title: "请选择证件类型",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    if (!idNumber.trim()) {
      wx.showToast({
        title: "请输入证件号",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 证件号格式验证
    if (!this.validateIdNumber(idType, idNumber)) {
      const errorMessage = this.getIdNumberErrorMessage(idType, idNumber);
      wx.showToast({
        title: errorMessage,
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 检查是否已登录
    const app = getApp<IAppOption>();
    if (app.globalData.isLoggedIn) {
      wx.showToast({
        title: "您已登录，无需重复注册",
        icon: "none",
      });
      return;
    }

    // 如果已经有手机号数据，直接执行登录
    if (this.data.phoneData) {
      this.performLogin();
    }
    // 否则等待用户点击按钮获取手机号
  },

  // 获取手机号回调
  onGetPhoneNumber(e: any) {
    console.log("获取手机号结果:", e.detail);
    if (e.detail.encryptedData) {
      this.setData({
        phoneData: {
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv,
        },
      });
      // 获取手机号成功后，继续执行登录逻辑
      this.performLogin();
    } else {
      wx.showToast({
        title: "获取手机号失败",
        icon: "none",
      });
    }
  },

  // 执行登录逻辑
  async performLogin() {
    const { name, idType, idNumber } = this.data.formData;

    // 表单验证
    if (!name.trim()) {
      wx.showToast({
        title: "请输入姓名",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    if (!idType) {
      wx.showToast({
        title: "请选择证件类型",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    if (!idNumber.trim()) {
      wx.showToast({
        title: "请输入证件号",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 证件号格式验证
    if (!this.validateIdNumber(idType, idNumber)) {
      const errorMessage = this.getIdNumberErrorMessage(idType, idNumber);
      wx.showToast({
        title: errorMessage,
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 检查是否已获取手机号
    if (!this.data.phoneData) {
      wx.showToast({
        title: "请先获取手机号",
        icon: "none",
      });
      return;
    }

    // 检查是否已获取login数据，如果没有则先获取
    if (!this.data.loginData) {
      console.log("需要获取login数据");
      wx.showLoading({
        title: "获取登录信息...",
        mask: true,
      });

      try {
        await this.getLoginData();
        wx.hideLoading();
      } catch (error) {
        wx.hideLoading();
        return;
      }
    }

    // 调用注册接口
    try {
      // 证件类型映射
      const idTypeMap: {
        [key: string]: "ID_CARD" | "GA_JM_LWND_TXZ" | "PASSPORT";
      } = {
        身份证: "ID_CARD",
        护照: "PASSPORT",
        港澳通行证: "GA_JM_LWND_TXZ",
      };

      // 调用注册接口
      console.log("注册参数:", {
        name,
        idType: idTypeMap[idType] || "ID_CARD",
        idNo: idNumber,
        openid: this.data.loginData.openid,
        encryptedData: this.data.phoneData.encryptedData,
        iv: this.data.phoneData.iv,
        sessionKey: this.data.loginData.sessionKey,
      });

      const response = await authService.register({
        name,
        idType: idTypeMap[idType] || "ID_CARD",
        idNo: idNumber,
        openid: this.data.loginData.openid,
        encryptedData: this.data.phoneData.encryptedData,
        iv: this.data.phoneData.iv,
        sessionKey: this.data.loginData.sessionKey,
      });

      if (response.code === 200) {
        // 注册成功
        wx.showToast({
          title: "注册成功",
          icon: "success",
          duration: 2000,
        });

        // 保存登录信息到本地存储
        const userInfo = {
          ...response.data.userDO,
          // 覆盖表单中的信息
          name: name,
          idType: idType,
          idNumber: idNumber,
        };
        wx.setStorageSync("userInfo", userInfo);

        // 更新全局登录状态
        const app = getApp<IAppOption>();
        app.setLoginStatus(userInfo);

        // 验证token和userInfo都已正确保存
        console.log("注册成功，状态验证:", {
          hasToken: authService.isLoggedIn(),
          globalIsLoggedIn: app.globalData.isLoggedIn,
          userInfo: app.globalData.loginUserInfo,
        });

        // 赠票逻辑
        if (this.data.type === "gift") {
          wx.redirectTo({
            url: `/pages/order-confirm/order-confirm?type=gift&ticketBid=${this.data.ticketBid}`,
          });
          return;
        }

        // 跳转到首页
        wx.switchTab({
          url: "/pages/index/index",
          success: () => {
            console.log("跳转首页成功，调用notifyLoginSuccess");
            // 直接调用app的notifyLoginSuccess方法，确保逻辑统一
            app.notifyLoginSuccess();
          },
        });
      } else {
        // 注册失败
        wx.showToast({
          title: response.message || "注册失败",
          icon: "none",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("注册请求失败:", error);
      wx.showToast({
        title: "网络请求失败，请重试",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 身份证号验证
  validateIdCard(idCard: string): boolean {
    // 简单的身份证号格式验证
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
  },

  // 其他证件类型长度验证
  validateOtherIdNumber(idType: string, idNumber: string): boolean {
    const trimmedNumber = idNumber.trim();

    // 定义各种证件类型的长度要求
    const lengthRules: { [key: string]: { min: number; max: number } } = {
      护照: { min: 6, max: 20 }, // 护照号长度6-20位
      军官证: { min: 6, max: 18 }, // 军官证长度6-18位
      港澳通行证: { min: 8, max: 12 }, // 港澳通行证长度8-12位
      台胞证: { min: 8, max: 12 }, // 台胞证长度8-12位
    };

    const rule = lengthRules[idType];
    if (!rule) {
      return true; // 未知证件类型，不进行校验
    }

    const length = trimmedNumber.length;
    return length >= rule.min && length <= rule.max;
  },

  // 通用证件号验证
  validateIdNumber(idType: string, idNumber: string): boolean {
    const trimmedNumber = idNumber.trim();

    if (!trimmedNumber) {
      return false;
    }

    // 身份证特殊处理
    if (idType === "身份证") {
      return this.validateIdCard(trimmedNumber);
    }

    // 其他证件类型进行长度校验
    return this.validateOtherIdNumber(idType, trimmedNumber);
  },

  // 获取证件号校验错误信息
  getIdNumberErrorMessage(idType: string, idNumber: string): string {
    const trimmedNumber = idNumber.trim();

    if (!trimmedNumber) {
      return "请输入证件号";
    }

    if (idType === "身份证") {
      if (!this.validateIdCard(trimmedNumber)) {
        return "请输入正确的身份证号";
      }
    } else {
      if (!this.validateOtherIdNumber(idType, trimmedNumber)) {
        const lengthRules: { [key: string]: { min: number; max: number } } = {
          护照: { min: 6, max: 20 },
          军官证: { min: 6, max: 18 },
          港澳通行证: { min: 8, max: 12 },
          台胞证: { min: 8, max: 12 },
        };
        const rule = lengthRules[idType];
        if (rule) {
          return `${idType}号码长度为${rule.min}-${rule.max}位`;
        }
      }
    }

    return "";
  },
});
