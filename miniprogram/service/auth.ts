// service/auth.ts - 认证服务
import BaseService from './base';

// 登录响应接口
interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    userDO: {
      avatarUrl: string;
      gmtCreate: string;
      gmtModify: string;
      id: number;
      idNo: string;
      idType: "ID_CARD";
      mobile: string;
      name: string;
      nickname: string;
      openid: string;
    };
    openid: string;
    reg: boolean; // 是否需要注册
  };
}

// 注册请求参数接口
interface RegisterParams {
  /**
   * 手机号加密数据(微信返回的)
   */
  encryptedData: string;
  
  /** 证件号 */
  idNo: string;
  
  
  idType: 'ID_CARD' | 'GAT_JM_JZZ' | 'GA_JM_LWND_TXZ' | 'TW_JM_LWDL_TXZ' | 'PASSPORT' | 'WGR_YJJL_SFZ' | 'WL_GG_TXZ';
  
  // 手机号iv(微信返回的)
  iv: string;

  name: string;
  
  openid: string;
  
  sessionKey: string;

}

// 注册响应接口
interface RegisterResponse {
  code: number;
  message: string;
  data: {
    token: string;
    userDO: {
      avatarUrl: string;
      gmtCreate: string;
      gmtModify: string;
      id: number;
      idNo: string;
      idType: string;
      mobile: string;
      name: string;
      nickname: string;
      openid: string;
    };
  };
}

class AuthService extends BaseService {
  
  /**
   * 登录接口
   * @returns Promise<LoginResponse>
   */
  async login(): Promise<LoginResponse> {
    try {
      // 获取微信登录code
      const loginResult = await wx.login();
      
      const response = await this.request<LoginResponse['data']>({
        url: '/app/auth/login',
        method: 'POST',
        data: { code: loginResult.code },
        showLoading: false // 不在服务层显示loading，由调用方控制
      });

      // 登录成功后保存token（只有reg为false时才保存）
      if (response.code === 200 && response.data.token && !response.data.reg) {
        this.saveToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 注册接口
   * @param params 注册参数
   * @returns Promise<RegisterResponse>
   */
  async register(params: RegisterParams): Promise<RegisterResponse> {
    try {
      // 注册接口不需要获取微信code，因为openid和sessionKey已经通过参数传入
      const response = await this.request<RegisterResponse['data']>({
        url: '/app/auth/register',
        method: 'POST',
        data: params,
        showLoading: false // 不在服务层显示loading，由调用方控制
      });

      // 注册成功后保存token
      if (response.code === 200 && response.data.token) {
        this.saveToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  /**
   * 检查登录状态
   * @returns boolean
   */
  checkLoginStatus(): boolean {
    return this.isLoggedIn();
  }

  /**
   * 登出
   */
  logout(): void {
    this.clearToken();
  }

}

// 创建单例实例
const authService = new AuthService();

export default authService;
export { LoginResponse, RegisterParams, RegisterResponse };
