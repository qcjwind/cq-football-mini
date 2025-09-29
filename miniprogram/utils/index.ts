export const checkGiftSuccess = () => {
  const ticketBid = wx.getStorageSync("giftSuccess");
  if (ticketBid) {
    wx.redirectTo({
      url: `/pages/order-confirm/order-confirm?type=gift&ticketBid=${ticketBid}`,
    });
  }
};

export const clearGiftSuccess = () => {
  wx.removeStorageSync("giftSuccess");
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};