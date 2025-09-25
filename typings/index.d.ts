/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    isLoggedIn: boolean,
    loginUserInfo: any
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
  checkLoginStatus(): void,
  redirectToLogin(): void,
  clearLoginInfo(): void,
  setLoginStatus(userInfo: any): void,
  getLoginStatus(): { isLoggedIn: boolean, userInfo: any }
}