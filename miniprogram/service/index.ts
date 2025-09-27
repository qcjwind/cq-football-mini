// service/index.ts - 服务入口文件
import authService from './auth';
import matchService from './match';
import ticketService from './ticket';
import orderService from './order';

// 导出所有服务
export {
  authService,
  matchService,
  ticketService,
  orderService,
  // 可以在这里添加其他服务
  // userService
};

// 默认导出认证服务（最常用的服务）
export default authService;
