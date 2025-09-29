// index.ts
import matchService, { MatchInfo } from "../../service/match";
import { checkGiftSuccess } from "../../utils/index";

Page({
  data: {
    matchList: [] as MatchInfo[], // 赛事列表
    loading: false, // 加载状态
    hasMore: true, // 是否还有更多数据
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    showEmpty: false, // 是否显示空态
    emptyText: "暂无赛事信息", // 空态提示文字
    emptyImage: "/assets/empty.png", // 空态图片
    // 搜索相关状态
    searchKeyword: "", // 搜索关键词
  },

  // 访客模式初始化
  initGuestMode() {
    // 直接加载赛事列表，无需登录检查
    this.loadMatchList(true);
  },

  // 搜索输入框输入事件
  onSearchInput(e: any) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
    });
  },

  // 搜索输入框确认事件
  onSearchConfirm(e: any) {
    const keyword = e.detail.value ? e.detail.value.trim() : "";
    this.performSearch(keyword);
  },

  // 搜索按钮点击事件
  onSearchBtnClick() {
    const keyword = this.data.searchKeyword
      ? this.data.searchKeyword.trim()
      : "";

    this.performSearch(keyword);
  },

  // 执行搜索
  async performSearch(keyword: string) {
    // 设置搜索关键词并重新加载列表
    this.setData({
      searchKeyword: keyword,
      page: 1, // 重置页码
      hasMore: true,
    });

    // 调用loadMatchList方法，它会自动使用searchKeyword
    this.loadMatchList(true);
  },

  // 选择城市
  onLocationSelect() {
    wx.showActionSheet({
      itemList: ["重庆"], // 暂时只支持重庆
      success: (res) => {
        const cities = ["重庆"]; // 暂时只支持重庆
        const selectedCity = cities[res.tapIndex];
        // 这里可以更新页面上的城市显示
        console.log("选择城市:", selectedCity);
      },
    });
  },

  // 查看赛事详情
  onMatchDetail(e: any) {
    const matchId = e.currentTarget.dataset.id;
    const saleStatus = e.currentTarget.dataset.saleStatus;
    
    // 检查赛事状态，如果是FINISHED则提示比赛已结束
    if (saleStatus === 'FINISHED') {
      wx.showToast({
        title: '比赛已结束',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/match-detail/match-detail?id=${matchId}`,
    });
  },

  // 格式化赛事数据
  formatMatchData(matchList: MatchInfo[]): MatchInfo[] {
    return matchList.map((match) => ({
      ...match,
      // 格式化时间显示
      // startTime: this.formatDateTime(match.startTime),
      // // 格式化销售状态
      // saleStatus: this.formatSaleStatus(match.saleStatus)
    }));
  },

  // 格式化日期时间
  formatDateTime(dateTimeStr: string): string {
    if (!dateTimeStr) return "";
    try {
      const date = new Date(dateTimeStr);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return dateTimeStr;
    }
  },

  // 格式化销售状态
  formatSaleStatus(status: string): string {
    const statusMap: Record<string, string> = {
      ON_SALE: "售票中",
      SOLD_OUT: "已售罄",
      NOT_ON_SALE: "未开售",
      CANCELLED: "已取消",
    };
    return statusMap[status] || status;
  },

  // 获取赛事列表
  async loadMatchList(refresh: boolean = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      wx.showLoading({ title: "loading..." });
      const page = refresh ? 1 : this.data.page;

      // 调用列表接口，如果有搜索关键词则携带matchName参数
      const params: any = {
        page,
        pageSize: this.data.pageSize,
      };

      // 只有当searchKeyword不为空时才传递matchName参数
      if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
        params.matchName = this.data.searchKeyword.trim();
      }

      console.log("调用赛事列表接口，参数:", params);

      const response = await matchService.getMatchList(params);

      console.log("接口响应:", response);
      wx.hideLoading();
      if (response.code === 200) {
        const newMatchList = this.formatMatchData(response.data);
        const matchList = refresh
          ? newMatchList
          : [...this.data.matchList, ...newMatchList];

        this.setData({
          matchList,
          page: page + 1,
          hasMore: response.data.length === this.data.pageSize,
          showEmpty: matchList.length === 0, // 当列表为空时显示空态
        });
      } else {
        wx.showToast({
          title: response.message || "获取赛事列表失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("获取赛事列表失败:", error);
      wx.showToast({
        title: "网络请求失败",
        icon: "none",
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadMatchList(true);
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMatchList();
    }
  },

  // 查看更多赛事
  onViewMoreMatches() {
    if (this.data.hasMore) {
      this.loadMatchList();
    } else {
      wx.showToast({
        title: "没有更多赛事了",
        icon: "none",
      });
    }
  },

  // 页面加载时执行
  onShow() {
    console.log("首页加载完成 - 访客模式");
    this.initGuestMode();
    // checkGiftSuccess()
  },

  // 页面隐藏时执行
  onHide() {
    console.log("首页隐藏");
  },

  // 页面卸载时执行
  onUnload() {
    console.log("首页卸载");
  },
});
