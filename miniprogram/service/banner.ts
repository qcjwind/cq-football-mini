// service/banner.ts - 首页 Banner 服务
import BaseService from "./base";

// Banner 信息接口
export interface BannerInfo {
  id: number;
  gmtCreate: string;
  gmtModify: string;
  title: string;
  imageUrl: string;
  jumpType: string;
  jumpTarget: string;
  sortNumber: number;
  status: string;
  startTime: string;
  endTime: string;
  remark: string;
  deleted: string;
}

// Banner 列表响应接口
interface BannerListResponse {
  code: number;
  msg: string;
  data: BannerInfo[];
}

class BannerService extends BaseService {
  // 获取首页 Banner 列表
  async getBannerList(): Promise<BannerListResponse> {
    return this.post("/app/banner/list", {}, { showLoading: false });
  }
}

const bannerService = new BannerService();
export default bannerService;

