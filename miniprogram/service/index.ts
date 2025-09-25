// service/index.ts - 服务入口文件
import authService from './auth';
import matchService from './match';

// 导出所有服务
export {
  authService,
  matchService,
  // 可以在这里添加其他服务
  // userService,
  // orderService,
  // ticketService
};

// 默认导出认证服务（最常用的服务）
export default authService;
