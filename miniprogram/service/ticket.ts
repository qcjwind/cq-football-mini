// service/ticket.ts - 票务服务
import BaseService from './base';

// 票务信息接口
interface TicketInfo {
    area: string,
    bid: string,
    gmtCreate: string,
    gmtModify: string,
    id: number,
    idNo: string,
    idType: string,
    matchId: number,
    mobile: string,
    name: string,
    orderId: number,
    price: string,
    saleStatus: string,
    saleTime: string,
    seatNo: number,
    seatRow: number,
    skuId: number,
    subArea: string,
    syncStatus: string,
    ticketType: string,
    userId: number,
    venueId: number,
}

// 票务列表响应接口
interface TicketListResponse {
    code: number;
    message: string;
    data: TicketInfo[];
    total: number;
    pageNumber: number;
    pageSize: number;
}

// 获取票务列表参数接口
interface TicketListParams {
    pageNumber?: number;
    pageSize?: number;
}

class TicketService extends BaseService {

    /**
     * 获取我的票务列表
     * @param params 查询参数
     * @returns Promise<TicketListResponse>
     */
    async getMyTicketList(params: TicketListParams = {}): Promise<TicketListResponse> {
        try {
            const response = await this.post('/app/ticket/myList', params, {
                showLoading: false,
                loadingText: '加载票务列表中...'
            });
            return response;
        } catch (error) {
            console.error('获取票务列表失败:', error);
            throw error;
        }
    }

    /**
     * 获取票务详情
     * @param ticketId 票务ID
     * @returns Promise<any>
     */
    async getTicketDetail(ticketId: string): Promise<any> {
        try {
            const response = await this.post(`/app/ticket/info`, { ticketId }, {
                showLoading: true,
                loadingText: '加载票务详情中...'
            });
            return response;
        } catch (error) {
            console.error('获取票务详情失败:', error);
            throw error;
        }
    }

    /**
     * 取消票务
     * @param ticketId 票务ID
     * @returns Promise<any>
     */
    async cancelTicket(ticketId: number): Promise<any> {
        try {
            const response = await this.post(`/app/ticket/cancel/${ticketId}`, {}, {
                showLoading: true,
                loadingText: '取消票务中...'
            });
            return response;
        } catch (error) {
            console.error('取消票务失败:', error);
            throw error;
        }
    }

    /**
     * 申请退款
     * @param ticketId 票务ID
     * @param reason 退款原因
     * @returns Promise<any>
     */
    async refundTicket(ticketId: number, reason: string): Promise<any> {
        try {
            const response = await this.post(`/app/ticket/refund/${ticketId}`, {
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
     * 获取票务二维码
     * @param ticketId 票务ID
     * @returns Promise<any>
     */
    async getTicketQRCode(ticketId: number): Promise<any> {
        try {
            const response = await this.get(`/app/ticket/qrcode/${ticketId}`, {}, {
                showLoading: true,
                loadingText: '生成二维码中...'
            });
            return response;
        } catch (error) {
            console.error('获取二维码失败:', error);
            throw error;
        }
    }
}

// 创建单例实例
const ticketService = new TicketService();

export default ticketService;
export { TicketInfo, TicketListResponse, TicketListParams };
