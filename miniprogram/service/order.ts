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
      return response;
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
  async getOrderDetail(orderId: number): Promise<any> {
    try {
      const response = await this.get(`/app/order/detail/${orderId}`, {}, {
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
   * 取消订单
   * @param orderId 订单ID
   * @returns Promise<any>
   */
  async cancelOrder(orderId: number): Promise<any> {
    try {
      const response = await this.post(`/app/order/cancel/${orderId}`, {}, {
        showLoading: true,
        loadingText: '取消订单中...'
      });
      return response;
    } catch (error) {
      console.error('取消订单失败:', error);
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
   * 申请退款
   * @param orderId 订单ID
   * @param reason 退款原因
   * @returns Promise<any>
   */
  async refundOrder(orderId: number, reason: string): Promise<any> {
    try {
      const response = await this.post(`/app/order/refund/${orderId}`, {
        reason
      }, {
        showLoading: true,
        loadingText: '申请退款中...'
      });
      return response;
    } catch (error) {
      console.error('申请退款失败:', error);
      throw error;
    }
  }

  /**
   * 确认收货
   * @param orderId 订单ID
   * @returns Promise<any>
   */
  async confirmOrder(orderId: number): Promise<any> {
    try {
      const response = await this.post(`/app/order/confirm/${orderId}`, {}, {
        showLoading: true,
        loadingText: '确认收货中...'
      });
      return response;
    } catch (error) {
      console.error('确认收货失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const orderService = new OrderService();

export default orderService;
export { OrderInfo, OrderListResponse, OrderListParams };
