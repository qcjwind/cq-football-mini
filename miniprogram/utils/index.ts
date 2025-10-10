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

function generateUUID() {
  const s = [];
  const hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = hexDigits[(s[19] & 0x3) | 0x8];
  s[8] = s[13] = s[18] = s[23] = "";
  return s.join("");
}

// 获取UUID
export const getUUID = () => {
  let uuid = wx.getStorageSync("uuid");
  if (!uuid) {
    uuid = generateUUID();
  }
  wx.setStorageSync("uuid", uuid);
  return uuid;
};
