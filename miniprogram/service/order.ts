// service/order.ts - 订单服务
import BaseService from './base';

// 订单信息接口
interface OrderInfo {
  buyNum: number,
  gmtCreate: string,
  gmtModify: string,
  id: number,
  matchId: number,
  orderNo: string,
  skuId: number,
  totalPrice: number,
  userId: number,
  venueId: number
}

// 订单列表响应接口
interface OrderListResponse {
  code: number;
  message: string;
  data: OrderInfo[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

// 获取订单列表参数接口
interface OrderListParams {
  pageNumber?: number;
  pageSize?: number;
}

// 购票参数接口
interface BuyTicketParams {
  // list: {
  //   idNo: string;
  //   idType: string;
  //   mobile: string;
  //   name: string;
  // }[];
  listJsonStr: string;
  // 幂等，前端生成UUID
  requestNo: string;
  skuId: number;
}

// 购票响应接口
interface BuyTicketResponse {
  code: number;
  msg: string;
  data: {
    buyNum: number;
    gmtCreate: string;
    gmtModify: string;
    id: number;
    matchId: number;
    orderNo: string;
    skuId: number;
    totalPrice: number;
    userId: number;
    venueId: number;
    orderStatus: string;
    payInfo?: string;
  };
}

class OrderService extends BaseService {

  /**
   * 获取我的订单列表
   * @param params 查询参数
   * @returns Promise<OrderListResponse>
   */
  async getMyOrderList(params: OrderListParams = {}): Promise<OrderListResponse> {
    try {
      const response = await this.post('/app/order/myList', params, {
        showLoading: false,
        // loadingText: '加载订单列表中...'
      });
      return response as OrderListResponse;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @returns Promise<any>
   */
  async getOrderDetail(orderId: string): Promise<any> {
    try {
      const response = await this.post(`/app/order/myInfo`, { orderId }, {
        showLoading: true,
        loadingText: '加载订单详情中...'
      });
      return response;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }


  /**
   * 支付订单
   * @param orderId 订单ID
   * @returns Promise<any>
   */
  async payOrder(orderId: number): Promise<any> {
    try {
      const response = await this.post(`/app/order/pay/${orderId}`, {}, {
        showLoading: true,
        loadingText: '支付订单中...'
      });
      return response;
    } catch (error) {
      console.error('支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 购票接口
   * @param params 购票参数
   * @returns Promise<BuyTicketResponse>
   */
  async buySaleTicket(params: BuyTicketParams): Promise<BuyTicketResponse> {
    try {
      console.log('购票参数:', params);
      const response = await this.post('/app/order/buySaleTicket', params, {
        showLoading: true,
        loadingText: '正在购票...'
      });
      return response;
    } catch (error) {
      console.error('购票失败:', error);
      throw error;
    }
  }

  /**
   * 赠票接口
   * @param params 购票参数
   * @returns Promise<BuyTicketResponse>
   */
  async buyGiftTicket(params: {ticketBid: string}): Promise<BuyTicketResponse> {
    try {
      console.log('购票参数:', params);
      const response = await this.post('/app/order/buyGiftTicket', params, {
        showLoading: true,
        loadingText: '正在购票...'
      });
      return response;
    } catch (error) {
      console.error('购票失败:', error);
      throw error;
    }
  }
}



// 创建单例实例
const orderService = new OrderService();

export default orderService;
export { OrderInfo, OrderListResponse, OrderListParams, BuyTicketParams, BuyTicketResponse };
