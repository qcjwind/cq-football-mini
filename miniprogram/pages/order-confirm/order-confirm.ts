// order-confirm.ts
import orderService, { BuyTicketParams } from "../../service/order";
import matchService from "../../service/match";
import authService, { IdNoValidParams } from "../../service/auth";
import { sleep } from "../../utils/index";

interface AttendeeInfo {
  name: string;
  idNumber: string;
  phone?: string;
  idType?: string;
  containsMySelf?: boolean;
}

interface OrderConfirmData {
  matchInfo: any;
  attendeeList: AttendeeInfo[];
  totalPrice: number;
  matchId: string;
  skuId: string;
  ticketPrice: number;
  agreementInfo?: null | any[];
  ticketCount: number;
  matchTimeStr: string;
  showAddModal: boolean;
  newAttendee: AttendeeInfo;
  idTypeOptions: { label: string; value: string }[];
  idTypeValues: string[];
  currentIdTypeIndex: number;
  isPurchasing: boolean;
  type?: string;
  ticketBid?: string;
  hasReadNotices: boolean;
}

Page({
  data: {
    type: "",
    ticketBid: "",
    matchInfo: null as any,
    attendeeList: [] as AttendeeInfo[],
    totalPrice: 0,
    matchId: "",
    skuId: "",
    ticketPrice: 0,
    ticketCount: 1,
    matchTimeStr: "2025.08.22 周六 17:20",
    showAddModal: false,
    agreementInfo: null,
    newAttendee: {
      name: "",
      idNumber: "",
      phone: "",
      idType: "ID_CARD",
    } as AttendeeInfo,
    idTypeOptions: [
      { label: "身份证", value: "ID_CARD" },
      { label: "护照", value: "PASSPORT" },
      { label: "港澳通行证", value: "GAT_TXZ" },
    ],
    idTypeValues: ["ID_CARD", "PASSPORT", "GAT_TXZ"],
    currentIdTypeIndex: 0,
    isPurchasing: false, // 防抖标志
    hasReadNotices: false, // 是否已阅读须知
  } as OrderConfirmData,

  onLoad(options: any) {
    console.log("订单确认页面参数:", options);
    const { matchId, skuId, ticketBid, type, price } = options;

    // 设置基本数据
    this.setData({
      matchId: matchId || "",
      skuId: skuId || "",
      ticketBid,
      type,
      ticketPrice: price || 0, // 默认价格，后续从接口获取
      ticketCount: 1, // 默认购买1张票
      totalPrice: price || 0, // 默认总价
    });

    // 加载用户信息作为观赛人
    this.loadUserAttendeeInfo();

    // 加载赛事信息
    this.loadMatchInfo(matchId, type);
  },

  // 加载用户信息作为观赛人
  loadUserAttendeeInfo() {
    try {
      // 从本地存储获取用户信息
      const userInfo = wx.getStorageSync("userInfo");
      if (userInfo) {
        const attendee: AttendeeInfo = {
          name: userInfo.name || "",
          idNumber: userInfo.idNo || "",
          phone: userInfo.mobile || "",
          idType: userInfo.idType || "ID_CARD",
          containsMySelf: true,
        };

        // 生成指定数量的观赛人信息
        const attendeeList: AttendeeInfo[] = Array(this.data.ticketCount)
          .fill(null)
          .map(() => ({ ...attendee }));
        console.log("attendeeList", attendeeList);

        this.setData({
          attendeeList,
        });
      } else {
        // 如果没有用户信息，使用默认数据
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  },

  openAgreement(e: any) {
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: `/pages/agreement/index?matchId=${this.data.matchId}&index=${index}`,
    });
  },
  // 加载赛事信息
  async loadMatchInfo(matchId: string, type: string) {
    try {
      wx.showLoading({
        title: "加载赛事信息...",
      });

      let params = { matchId: Number(matchId) };

      if (type === "gift") {
        params = { ticketBid: this.data.ticketBid || "" };
      }

      const response = await matchService.getMatchInfo(params);

      if (response.code === 200 && response.data) {
        const { match, venue } = response.data;

        // 格式化赛事信息
        const matchInfo = {
          id: match.id,
          name: match.name,
          buyLimit: match.buyLimit,
          startTime: match.startTime,
          location: venue?.venueAddress || "天府新区文化体路888号",
        };

        // 格式化时间显示
        const matchTimeStr = this.formatMatchTime(match.startTime);
        const agreementInfo = JSON.parse(match.agreementInfo || "[]");
        this.setData({
          matchInfo,
          matchTimeStr,
          agreementInfo,
        });
      } else {
        wx.showToast({
          title: response.message || "加载赛事信息失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("加载赛事信息失败:", error);
      wx.showToast({
        title: "加载赛事信息失败",
        icon: "none",
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 格式化赛事时间
  formatMatchTime(startTime: string): string {
    try {
      const date = new Date(startTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      // 获取星期几
      const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekDay = weekDays[date.getDay()];

      return `${year}.${month}.${day} ${weekDay} ${hours}:${minutes}`;
    } catch (error) {
      console.error("格式化时间失败:", error);
      return "2025.08.22 周六 17:20";
    }
  },

  // 移除观赛人
  removeAttendee(e: any) {
    const index = e.currentTarget.dataset.index;
    const attendeeList = [...this.data.attendeeList];

    if (attendeeList.length <= 1) {
      wx.showToast({
        title: "至少需要一名观赛人",
        icon: "none",
      });
      return;
    }

    attendeeList.splice(index, 1);

    this.setData({
      attendeeList,
      ticketCount: attendeeList.length,
      totalPrice: this.data.ticketPrice * attendeeList.length,
    });
  },

  // 添加观赛人
  addAttendee() {
    if (this.data.attendeeList.length >= this.data.matchInfo.buyLimit) {
      wx.showToast({
        title: `最多只能添加${this.data.matchInfo.buyLimit}名观赛人`,
        icon: "none",
      });
      return;
    }

    // 显示弹窗，保持之前的输入内容
    this.setData({
      showAddModal: true,
    });
  },

  // 确认购买
  async confirmPurchase() {
    // 防抖处理：如果正在购买中，直接返回
    if (this.data.isPurchasing) {
      wx.showToast({
        title: "正在处理中，请稍候...",
        icon: "none",
      });
      return;
    }

    if (!this.data.hasReadNotices && this.data.agreementInfo && this.data.agreementInfo.length > 0) {
      wx.showToast({
        title: "请阅读购票须知",
        icon: "none",
      });
      return;
    }

    if (this.data.attendeeList.length === 0) {
      wx.showToast({
        title: "请添加观赛人信息",
        icon: "none",
      });
      return;
    }

    // 验证观赛人信息
    for (const attendee of this.data.attendeeList) {
      if (!attendee.name || !attendee.idNumber) {
        wx.showToast({
          title: "请完善观赛人信息",
          icon: "none",
        });
        return;
      }
    }

    // 设置购买状态，防止重复点击
    this.setData({
      isPurchasing: true,
    });

    // 赠票逻辑
    if (this.data.type === "gift") {
      try {
        const response = await orderService.buyGiftTicket({
          ticketBid: this.data.ticketBid || "",
        });
        if (response.code === 200) {
          // 购票成功，跳转到支付页面
          wx.showToast({
            title: "购票成功",
            icon: "success",
            duration: 1500,
          });

          this.setData({
            isPurchasing: false,
          });
          await sleep(1500);
          wx.reLaunch({
            url: `/pages/order-detail/index?orderId=${response.data.id}&type=ticket`,
          });
        } else {
          wx.showToast({
            title: response.msg || "购票失败",
            icon: "none",
          });
          this.setData({
            isPurchasing: false,
          });
        }
      } catch (error) {
        this.setData({
          isPurchasing: false,
        });
      }

      return;
    }

    try {
      // 生成UUID作为请求ID（幂等性）
      const requestNo = this.generateUUID();

      // 构建购票参数
      const buyTicketParams: BuyTicketParams = {
        requestNo,
        skuId: Number(this.data.skuId),
        listJsonStr: JSON.stringify(
          this.data.attendeeList.map((attendee) => ({
            name: attendee.name,
            idNo: attendee.idNumber,
            idType: attendee.idType || "ID_CARD",
            mobile: attendee.phone || "",
            mySelf: attendee.containsMySelf || false,
          }))
        ),
      };

      console.log("购票参数:", buyTicketParams);

      // 调用购票接口
      const response = await orderService.buySaleTicket(buyTicketParams);

      if (response.code === 200) {
        if (response.data.orderStatus === "WAIT_PAY" && response.data.payInfo) {
          try {
            const pay = JSON.parse(response.data.payInfo);
            wx.requestPayment({
              timeStamp: pay.timeStamp,
              nonceStr: pay.nonceStr,
              package: pay.packageValue,
              signType: pay.signType,
              paySign: pay.paySign,
              success: () => {
                wx.reLaunch({
                  url: `/pages/order-detail/index?orderId=${response.data.id}&type=order&payStatus=PAY_SUCCESS`,
                });
              },
              fail: () => {
                wx.reLaunch({
                  url: `/pages/order-detail/index?orderId=${response.data.id}&type=order`,
                });
              },
            });
          } catch (error) {}
          return;
        }
        // 购票成功
        wx.showToast({
          title: "购票成功",
          icon: "success",
          duration: 1500,
        });
        await sleep(1500);
        wx.reLaunch({
          url: `/pages/order-detail/index?orderId=${response.data.id}&type=order`,
        });
      } else {
        wx.showToast({
          title: response.msg || "购票失败",
          icon: "none",
        });
        // 购票失败，重置状态
        this.setData({
          isPurchasing: false,
        });
      }
    } catch (error) {
      console.error("购票失败:", error);
      // 发生错误，重置状态
      this.setData({
        isPurchasing: false,
      });
      wx.showToast({
        title: (error as any)?.msg || "购票失败，请重试",
        icon: "none",
      });
    }
  },

  // 生成UUID（无连字符）
  generateUUID(): string {
    return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showAddModal: false,
      // 不重置表单数据，保持用户输入的内容
    });
  },

  // 阻止弹窗内容区域的事件冒泡
  preventClose() {
    // 空方法，用于阻止事件冒泡
  },

  // 输入框变化处理
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;

    this.setData({
      [`newAttendee.${field}`]: value,
    });
  },

  // 证件类型选择
  onIdTypeChange(e: any) {
    const { value } = e.detail;
    const idTypeValues = this.data.idTypeValues;
    const selectedType = idTypeValues[value] || "ID_CARD";

    console.log("证件类型选择:", { value, selectedType, idTypeValues });

    this.setData({
      "newAttendee.idType": selectedType,
      currentIdTypeIndex: value,
    });
  },

  // 确认添加观赛人
  async confirmAddAttendee() {
    const { newAttendee } = this.data;

    // 验证表单
    if (!newAttendee.name.trim()) {
      wx.showToast({
        title: "请输入姓名",
        icon: "none",
      });
      return;
    }

    if (!newAttendee.idNumber.trim()) {
      wx.showToast({
        title: "请输入证件号",
        icon: "none",
      });
      return;
    }

    if (!newAttendee.phone || !newAttendee.phone.trim()) {
      wx.showToast({
        title: "请输入电话号码",
        icon: "none",
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (newAttendee.phone && !phoneRegex.test(newAttendee.phone)) {
      wx.showToast({
        title: "请输入正确的手机号",
        icon: "none",
      });
      return;
    }

    // 验证证件号格式
    if (
      !this.validateIdNumber(
        newAttendee.idType || "身份证",
        newAttendee.idNumber
      )
    ) {
      const errorMessage = this.getIdNumberErrorMessage(
        newAttendee.idType || "身份证",
        newAttendee.idNumber
      );
      wx.showToast({
        title: errorMessage,
        icon: "none",
      });
      return;
    }

    // 只有身份证类型才进行实名认证
    if (newAttendee.idType === "ID_CARD") {
      // 调用实名认证接口
      try {
        const validParams: IdNoValidParams = {
          name: newAttendee.name,
          idNo: newAttendee.idNumber,
          idType: "ID_CARD",
        };

        const response = await authService.idNoValid(validParams);

        if (response.code === 200) {
          if (response.data.valid) {
            // 实名认证成功，添加到观赛人列表
            this.addAttendeeToList(newAttendee);
          } else {
            // 实名认证失败
            wx.showToast({
              title: response.data.message || "身份信息验证失败",
              icon: "none",
              duration: 3000,
            });
          }
        } else {
          wx.showToast({
            title: response.message || "身份验证失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("实名认证失败:", error);
        wx.showToast({
          title: "身份验证失败，请重试",
          icon: "none",
        });
      }
    } else {
      // 非身份证类型直接添加，不进行实名认证
      this.addAttendeeToList(newAttendee);
    }
  },

  // 添加观赛人到列表
  addAttendeeToList(attendee: AttendeeInfo) {
    const attendeeList = [...this.data.attendeeList, { ...attendee }];

    this.setData({
      attendeeList,
      ticketCount: attendeeList.length,
      totalPrice: this.data.ticketPrice * attendeeList.length,
      showAddModal: false,
      // 成功添加后重置表单数据
      newAttendee: {
        name: "",
        idNumber: "",
        phone: "",
        idType: attendee.idType,
      },
    });

    wx.showToast({
      title: "添加成功",
      icon: "success",
    });
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

  // 页面显示时刷新数据
  onShow() {
    // 检查是否有新增的观赛人信息
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];

    if (currentPage.options && currentPage.options.from === "add-attendee") {
      // 从添加观赛人页面返回，刷新观赛人列表
      this.loadUserAttendeeInfo();
    }
  },

  // 打开购票须知
  openPurchaseNotice() {
    wx.navigateTo({
      url: "/pages/web-view/index?url=https://yuchao2025.zszlchina.com/buyTicket.html",
    });
  },

  // 打开安检须知
  openSecurityNotice() {
    wx.navigateTo({
      url: "/pages/web-view/index?url=https://yuchao2025.zszlchina.com/securityCheck.html",
    });
  },

  // 打开入场须知
  openEntryNotice() {
    wx.navigateTo({
      url: "/pages/web-view/index?url=https://yuchao2025.zszlchina.com/admissionNoticead.html",
    });
  },

  // 处理须知单选框状态变化
  onNoticeRadioChange() {
    this.setData({
      hasReadNotices: !this.data.hasReadNotices,
    });
  },
});
