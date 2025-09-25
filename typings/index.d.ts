/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    isLoggedIn: boolean,
    loginUserInfo: any,
    needRegister: boolean,
    loginData: any,
    isLoggingIn: boolean
  }
  autoLogin(): Promise<void>,
  checkLoginStatus(): void,
  setLoginStatus(userInfo: any): void,
  redirectToLogin(): void,
  checkAndHandleLoginStatus(): boolean,
  forceCheckLoginStatus(): Promise<void>,
  clearLoginStatus(): void,
  notifyLoginSuccess(): void
}