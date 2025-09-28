// match-detail.ts
import matchService from "../../service/match";

// 获取应用实例
const app = getApp<IAppOption>();

Page({
  data: {
    matchInfo: null as any,
    arenaInfo: null as any,
    skuList: [] as any[],
    loading: true,
  },

  onLoad(options: any) {
    const matchId = options.id;
    if (matchId) {
      this.loadMatchDetail(matchId);
    }
  },

  async loadMatchDetail(matchId: string) {
    try {
      console.log("加载赛事详情:", matchId);

      // 调用真实的API接口
      const response = await matchService.getMatchInfo(Number(matchId));

      if (response.code === 200 && response.data) {
        const { match, venue, skuList } = response.data;

        this.setData({
          matchInfo: match,
          arenaInfo: venue,
          skuList: skuList || [],
          loading: false,
        });
      } else {
        wx.showToast({
          title: response.message || "加载失败",
          icon: "none",
        });
        this.setData({
          loading: false,
        });
      }
    } catch (error) {
      console.error("加载赛事详情失败:", error);
      wx.showToast({
        title: "加载失败，请重试",
        icon: "none",
      });
      this.setData({
        loading: false,
      });
    }
  },

  previewImage() {
    wx.previewImage({
      urls: [this.data.matchInfo.cover],
      current: this.data.matchInfo.cover,
    });
  },

  onBuyTicket() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: "/pages/login/login",
      });
      return;
    }

    // 已登录，跳转到购票选择页面
    wx.navigateTo({
      url: `/pages/ticket-select/ticket-select?id=${this.data.matchInfo.id}`,
    });
  },

  // 点击地址唤起导航
  onAddressTap() {
    const { arenaInfo } = this.data;

    if (!arenaInfo || !arenaInfo.venueAddress) {
      wx.showToast({
        title: "地址信息不完整",
        icon: "none",
      });
      return;
    }

    // 检查是否有经纬度信息
    if (arenaInfo.venueLat && arenaInfo.venueLng) {
      const latitude = parseFloat(arenaInfo.venueLat);
      const longitude = parseFloat(arenaInfo.venueLng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        // 有经纬度信息，使用微信内置地图导航
        wx.openLocation({
          latitude,
          longitude,
          name: arenaInfo.name || "比赛场馆",
          address: arenaInfo.venueAddress,
          scale: 18,
          success: () => {
            console.log("打开地图成功");
          },
          fail: (error) => {
            console.error("打开地图失败:", error);
            this.showNavigationOptions(arenaInfo.venueAddress);
          },
        });
        return;
      }
    }

    // 没有经纬度信息，显示导航选项
    this.showNavigationOptions(arenaInfo.venueAddress);
  },

  // 显示导航选项
  showNavigationOptions(address: string) {
    wx.showActionSheet({
      itemList: ["复制地址", "使用系统地图导航"],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制地址
          wx.setClipboardData({
            data: address,
            success: () => {
              wx.showToast({
                title: "地址已复制",
                icon: "success",
              });
            },
            fail: () => {
              wx.showToast({
                title: "复制失败",
                icon: "none",
              });
            },
          });
        } else if (res.tapIndex === 1) {
          // 使用系统地图导航（这里可以调用第三方地图API）
          this.openSystemMap(address);
        }
      },
    });
  },

  // 打开系统地图
  openSystemMap(address: string) {
    // 复制地址到剪贴板，用户可以粘贴到地图应用中
    wx.setClipboardData({
      data: address,
      success: () => {
        wx.showModal({
          title: "导航提示",
          content:
            "已复制地址到剪贴板，您可以在高德地图、百度地图等导航应用中搜索该地址进行导航。",
          showCancel: false,
          confirmText: "知道了",
        });
      },
    });
  },
});
