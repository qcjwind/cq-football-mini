// service/base.ts - API服务基类
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
  errorToast?: boolean;
}

class BaseService {
  protected baseURL = 'http://yuchao2025.zszlchina.com';
  // protected baseURL = 'http://10.113.1.26:80';
  protected token = '';

  constructor() {
    this.loadToken();
  }

  // 从本地存储加载token
  private loadToken() {
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.error('加载token失败:', error);
    }
  }

  // 保存token到本地存储
  protected saveToken(token: string) {
    try {
      wx.setStorageSync('token', token);
      this.token = token;
    } catch (error) {
      console.error('保存token失败:', error);
    }
  }

  // 清除token
  protected clearToken() {
    try {
      wx.removeStorageSync('token');
      this.token = '';
    } catch (error) {
      console.error('清除token失败:', error);
    }
  }

  // 通用请求方法
  protected async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { url, method = 'GET', data, header = {}, showLoading = false, loadingText = '加载中...', errorToast = true } = config;

    console.log('config:', config);
    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      });
    }

    // 构建请求头
    const requestHeader: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...header
    };

    // 每次请求都重新加载token
    this.loadToken();

    // 如果有token，添加到请求头
    if (this.token) {
      requestHeader['token'] = `${this.token}`;
    }

    // 处理POST请求的数据格式
    let requestData = data;
    // if (method === 'POST' && data && typeof data === 'object') {
    //   // 使用URL编码格式，数组直接JSON字符串化
    //   requestHeader['Content-Type'] = 'application/x-www-form-urlencoded';
    //   requestData = this.objectToUrlEncoded(data);
    //   console.log('requestData:', requestData);
    // }

    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseURL + url,
        method,
        data: requestData,
        header: requestHeader,
        success: (res) => {
          // 隐藏加载提示
          if (showLoading) {
            wx.hideLoading();
          }

          const response = res.data as ApiResponse<T>;

          // 处理业务错误
          if (response.code !== 200) {
            // 如果是token过期，清除本地token
            if (response.code === 401) {
              this.clearToken();
              wx.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none'
              });
              // 跳转到登录页面
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }, 1500);
            } else {
              if (errorToast) {
                wx.showToast({
                  title: response.message || '请求失败',
                  icon: 'none'
                });
              }
            }
            reject(response);
            return;
          }

          resolve(response);
        },
        fail: (error) => {
          // 隐藏加载提示
          if (showLoading) {
            wx.hideLoading();
          }

          console.error('网络请求失败:', error);
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  }

  // GET请求
  protected async get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    let requestUrl = url;
    if (params) {
      const queryString = this.objectToUrlEncoded(params);
      requestUrl += `?${queryString}`;
    }

    return this.request<T>({
      url: requestUrl,
      method: 'GET',
      ...config
    });
  }

  // POST请求
  protected async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config
    });
  }

  // PUT请求
  protected async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    });
  }

  // DELETE请求
  protected async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
    });
  }


  // 将对象转换为URL编码格式
  private objectToUrlEncoded(obj: any): string {
    const params: string[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        let value = obj[key];
        // 如果是对象或数组，先转换为JSON字符串
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }
    }
    return params.join('&');
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.token;
  }

  // 获取当前token
  getToken(): string {
    return this.token;
  }

  // 登出
  logout() {
    this.clearToken();
  }
}

export default BaseService;
