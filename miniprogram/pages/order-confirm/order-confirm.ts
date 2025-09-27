// order-confirm.ts
import orderService, { BuyTicketParams } from '../../service/order';
import matchService from '../../service/match';

interface AttendeeInfo {
  name: string;
  idNumber: string;
  phone?: string;
  idType?: string;
}

interface OrderConfirmData {
  matchInfo: any;
  attendeeList: AttendeeInfo[];
  totalPrice: number;
  matchId: string;
  skuId: string;
  ticketPrice: number;
  ticketCount: number;
  matchTimeStr: string;
}

Page({
  data: {
    matchInfo: null as any,
    attendeeList: [] as AttendeeInfo[],
    totalPrice: 0,
    matchId: '',
    skuId: '',
    ticketPrice: 0,
    ticketCount: 1,
    matchTimeStr: '2025.08.22 周六 17:20'
  } as OrderConfirmData,

  onLoad(options: any) {
    console.log('订单确认页面参数:', options);
    
    const { matchId, skuId } = options;
    
    // 设置基本数据
    this.setData({
      matchId: matchId || '',
      skuId: skuId || '',
      ticketPrice: 0, // 默认价格，后续从接口获取
      ticketCount: 1,  // 默认购买1张票
      totalPrice: 0   // 默认总价
    });

    // 加载用户信息作为观赛人
    this.loadUserAttendeeInfo();
    
    // 加载赛事信息
    if (matchId) {
      this.loadMatchInfo(matchId);
    }
  },

  // 加载用户信息作为观赛人
  loadUserAttendeeInfo() {
    try {
      // 从本地存储获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        const attendee: AttendeeInfo = {
          name: userInfo.name || '',
          idNumber: userInfo.idNo || '',
          phone: userInfo.mobile || '',
          idType: userInfo.idType || 'ID_CARD'
        };
        
        // 生成指定数量的观赛人信息
        const attendeeList: AttendeeInfo[] = Array(this.data.ticketCount).fill(null).map(() => ({ ...attendee }));
        
        this.setData({
          attendeeList
        });
      } else {
        // 如果没有用户信息，使用默认数据
        this.loadDefaultAttendees();
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      this.loadDefaultAttendees();
    }
  },

  // 加载默认观赛人信息（备用）
  loadDefaultAttendees() {
    const defaultAttendees: AttendeeInfo[] = [
      {
        name: '林元购',
        idNumber: '5110*************932',
        phone: '138****8888',
        idType: 'ID_CARD'
      }
    ];

    this.setData({
      attendeeList: defaultAttendees
    });
  },

  // 加载赛事信息
  async loadMatchInfo(matchId: string) {
    try {
      wx.showLoading({
        title: '加载赛事信息...'
      });

      const response = await matchService.getMatchInfo(Number(matchId));
      
      if (response.code === 200 && response.data) {
        const { match, venue } = response.data;
        
        // 格式化赛事信息
        const matchInfo = {
          id: match.id,
          name: match.name,
          startTime: match.startTime,
          location: venue?.venueAddress || '天府新区文化体路888号'
        };

        // 格式化时间显示
        const matchTimeStr = this.formatMatchTime(match.startTime);

        this.setData({
          matchInfo,
          matchTimeStr
        });
      } else {
        wx.showToast({
          title: response.message || '加载赛事信息失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载赛事信息失败:', error);
      wx.showToast({
        title: '加载赛事信息失败',
        icon: 'none'
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
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      // 获取星期几
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[date.getDay()];
      
      return `${year}.${month}.${day} ${weekDay} ${hours}:${minutes}`;
    } catch (error) {
      console.error('格式化时间失败:', error);
      return '2025.08.22 周六 17:20';
    }
  },

  // 移除观赛人
  removeAttendee(e: any) {
    const index = e.currentTarget.dataset.index;
    const attendeeList = [...this.data.attendeeList];
    
    if (attendeeList.length <= 1) {
      wx.showToast({
        title: '至少需要一名观赛人',
        icon: 'none'
      });
      return;
    }

    attendeeList.splice(index, 1);
    
    this.setData({
      attendeeList,
      ticketCount: attendeeList.length,
      totalPrice: this.data.ticketPrice * attendeeList.length
    });
  },

  // 添加观赛人
  addAttendee() {
    if (this.data.attendeeList.length >= 8) {
      wx.showToast({
        title: '最多只能添加8名观赛人',
        icon: 'none'
      });
      return;
    }

    // 跳转到添加观赛人页面
    wx.navigateTo({
      url: `/pages/add-attendee/add-attendee?matchId=${this.data.matchId}&skuId=${this.data.skuId}`
    });
  },

  // 确认购买
  async confirmPurchase() {
    if (this.data.attendeeList.length === 0) {
      wx.showToast({
        title: '请添加观赛人信息',
        icon: 'none'
      });
      return;
    }

    // 验证观赛人信息
    for (const attendee of this.data.attendeeList) {
      if (!attendee.name || !attendee.idNumber) {
        wx.showToast({
          title: '请完善观赛人信息',
          icon: 'none'
        });
        return;
      }
    }

    try {
      // 生成UUID作为请求ID（幂等性）
      const requestNo = this.generateUUID();
      
      // 构建购票参数
      const buyTicketParams: BuyTicketParams = {
        requestNo,
        skuId: Number(this.data.skuId),
        listJsonStr: JSON.stringify(this.data.attendeeList.map(attendee => ({
          name: attendee.name,
          idNo: attendee.idNumber,
          idType: attendee.idType || 'ID_CARD',
          mobile: attendee.phone || ''
        })))
      };

      console.log('购票参数:', buyTicketParams);

      // 调用购票接口
      const response = await orderService.buySaleTicket(buyTicketParams);

      if (response.code === 200) {
        // 购票成功，跳转到支付页面
        // wx.navigateTo({
        //   url: `/pages/payment/payment?orderId=${response.data.id}&amount=${response.data.totalPrice}&orderNo=${response.data.orderNo}`
        // });
        wx.showToast({
          title: '购票成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: response.message || '购票失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('购票失败:', error);
      wx.showToast({
        title: '购票失败，请重试',
        icon: 'none'
      });
    }
  },

  // 生成UUID（无连字符）
  generateUUID(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // 页面显示时刷新数据
  onShow() {
    // 检查是否有新增的观赛人信息
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage.options && currentPage.options.from === 'add-attendee') {
      // 从添加观赛人页面返回，刷新观赛人列表
      this.loadUserAttendeeInfo();
    }
  }
});
