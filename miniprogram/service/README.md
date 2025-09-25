# Service 服务层使用说明

## 概述

Service层封装了所有API调用，提供了统一的接口和错误处理机制。

## 文件结构

```
service/
├── base.ts          # 基础服务类，提供通用HTTP请求方法
├── auth.ts          # 认证服务，包含登录和注册接口
├── index.ts         # 服务入口文件
└── README.md        # 使用说明文档
```

## 使用方法

### 1. 认证服务 (AuthService)

#### 导入服务
```typescript
import authService from '../../service/auth'
// 或者
import { authService } from '../../service'
```

#### 登录接口
```typescript
// 自动登录（使用微信code）
const response = await authService.login()
if (response.code === 200) {
  if (response.data.reg) {
    // 需要注册
    console.log('用户需要注册')
  } else {
    // 登录成功
    console.log('登录成功', response.data.token)
  }
}
```

#### 注册接口
```typescript
// 用户注册
const response = await authService.register({
  name: '张三',
  idType: '身份证',
  idNumber: '123456789012345678',
  mobile: '13800138000' // 可选
})

if (response.code === 200) {
  console.log('注册成功', response.data.token)
}
```

#### 其他方法
```typescript
// 检查登录状态
const isLoggedIn = authService.checkLoginStatus()

// 注意：getUserInfo 和 updateUserInfo 方法已从服务中移除
// 如需使用，请根据实际需求重新实现

// 登出
authService.logout()
```

### 2. 赛事服务 (MatchService)

**注意：赛事相关接口需要在用户登录后才能调用，未登录状态下会返回401错误。**

#### 基本用法
```typescript
import matchService from '../../service/match'

// 获取赛事列表（需要登录）
const response = await matchService.getMatchList({
  page: 1,
  pageSize: 10,
  status: 'upcoming' // 可选：upcoming, live, finished
})

// 获取赛事详情（需要登录）
const detail = await matchService.getMatchDetail(123)

// 获取热门赛事（需要登录）
const hotMatches = await matchService.getHotMatches(5)

// 搜索赛事（需要登录）
const searchResults = await matchService.searchMatches('足球', {
  page: 1,
  pageSize: 10
})
```

#### 在页面中的使用
```typescript
// 首页示例
Page({
  data: {
    matchList: [] as MatchInfo[],
    loading: false
  },

  // 页面加载时检查登录状态
  onLoad() {
    this.checkLoginStatus()
    // 页面加载时不立即加载列表，等待登录完成
  },

  // 登录成功后加载赛事列表（由app.ts调用）
  onLoginSuccess() {
    this.loadMatchList(true)
  },

  // 加载赛事列表
  async loadMatchList(refresh: boolean = false) {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });
      const response = await matchService.getMatchList({
        page: refresh ? 1 : this.data.page,
        pageSize: 10
      });
      
      if (response.code === 200) {
        // 处理赛事列表数据
        const matchList = refresh ? response.data.list : [...this.data.matchList, ...response.data.list];
        this.setData({ 
          matchList,
          showEmpty: matchList.length === 0 // 当列表为空时显示空态
        });
      }
    } catch (error) {
      console.error('获取赛事列表失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  }
})
```

#### 空态处理
当赛事列表为空时，会自动显示空态页面：
- 显示空态图片（`/assets/empty.png`）
- 显示提示文字："暂无赛事信息"
- 显示操作提示："下拉刷新试试"
- 支持下拉刷新重新加载数据

```typescript
// 数据结构
data: {
  matchList: [] as MatchInfo[], // 赛事列表
  showEmpty: false, // 是否显示空态
  emptyText: '暂无赛事信息', // 空态提示文字
  emptyImage: '/assets/empty.png' // 空态图片
}
```

### 3. 基础服务类 (BaseService)

如果需要创建新的服务，可以继承BaseService：

```typescript
import BaseService from './base'

class UserService extends BaseService {
  async getUserProfile() {
    return this.get('/app/user/profile')
  }
  
  async updateProfile(data: any) {
    return this.post('/app/user/update', data, {
      showLoading: true,
      loadingText: '更新中...'
    })
  }
}

export default new UserService()
```

## 特性

1. **自动Token管理**: 登录成功后自动保存token，后续请求自动添加token头
2. **统一错误处理**: 自动处理网络错误和业务错误
3. **Loading状态**: 支持可选的加载提示
4. **数据格式转换**: 自动将POST数据转换为URL编码格式
5. **TypeScript支持**: 完整的类型定义和智能提示

## 接口地址

- 登录: `POST /app/auth/login`
- 注册: `POST /app/auth/register`
- 用户信息: `GET /app/user/info`
- 更新用户: `POST /app/user/update`

## 注意事项

1. 所有服务都基于BaseService，确保一致的错误处理
2. Token会在登录成功后自动保存，无需手动管理
3. 401错误会自动清除token并跳转到登录页面
4. 建议在页面onShow时检查登录状态
