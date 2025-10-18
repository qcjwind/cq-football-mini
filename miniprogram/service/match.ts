// service/match.ts - 赛事服务
import BaseService from './base';

// 赛事信息接口
interface MatchInfo {
  cover: string;
  detail: string;
  endTime: string;
  agreementInfo: string;
  giftTicketUrl: string;
  gmtCreate: string;
  gmtModify: string;
  id: number;
  matineeName: string;
  buyLimit: number;
  name: string;
  saleStatus: 'NOT_FINISH' | 'FINISHED';
  startTime: string;
  status: 'ENABLE';
  venueId: number;
}

// 赛事列表响应接口
interface MatchListResponse {
  code: number;
  message: string;
  data: MatchInfo[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

// 场馆信息接口
interface ArenaInfo {
  areaCode: string; 
  areaName: string;
  cityCode: string;
  cityName: string;
  detail: string;
  giftSkuInfo: string;
  gmtCreate: string;
  gmtModify: string;
  id: number;
  name: string;
  provinceCode: string;
  provinceName: string;
  saleSkuInfo: string;
  venueAddress: string;
  venueLat: string;
  venueLng: string;
}

// 赛事SKU信息接口
interface SkuInfo {
  area: string;
  gmtCreate: string;
  gmtModify: string;
  id: number;
  matchId: number;
  price: number;
  skuName: string;
  skuType: 'SALE_TICKET' | 'GIFT_TICKET';
  // 剩余票数
  stockTicket: number;
  totalTicket: number;
  venueId: number;
}

// 赛事详情响应接口
interface MatchDetailResponse {
  code: number;
  message: string;
  data: {
    match: MatchInfo;
    venue: ArenaInfo;
    skuList: SkuInfo[];
  };
}

// 获取赛事列表参数接口
interface MatchListParams {
  page?: number;
  pageSize?: number;
  status?: 'upcoming' | 'live' | 'finished';
  keyword?: string;
  matchName?: string;
}

class MatchService extends BaseService {
  
  /**
   * 获取赛事列表
   * @param params 查询参数
   * @returns Promise<MatchListResponse>
   */
  async getMatchList(params: MatchListParams = {}): Promise<MatchListResponse> {
    try {
      const response = await this.post('/app/match/list', params, {
        showLoading: true,
        loadingText: '加载赛事列表中...'
      });
      return response;
    } catch (error) {
      console.error('获取赛事列表失败:', error);
      throw error;
    }
  }

  /**
   * 搜索赛事
   * @param keyword 搜索关键词
   * @param params 其他查询参数
   * @returns Promise<MatchListResponse>
   */
  async searchMatches(keyword: string, params: Omit<MatchListParams, 'keyword'> = {}): Promise<MatchListResponse> {
    try {
      const searchParams = {
        ...params,
        keyword
      };
      const response = await this.get('/app/match/search', searchParams, {
        showLoading: true,
        loadingText: '搜索赛事中...'
      });
      return response;
    } catch (error) {
      console.error('搜索赛事失败:', error);
      throw error;
    }
  }

  /**
   * 获取赛事详情信息
   * @param matchId 赛事ID
   * @returns Promise<MatchDetailResponse>
   */
  async getMatchInfo(params: { matchId?: number, ticketBid?: string }): Promise<MatchDetailResponse> {
    try {
      const response = await this.post('/app/match/info', params, {
        showLoading: false,
        loadingText: '加载赛事信息中...'
      });
      return response;
    } catch (error) {
      console.error('获取赛事信息失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const matchService = new MatchService();

export default matchService;
export { MatchInfo, MatchListResponse, MatchDetailResponse, MatchListParams };
