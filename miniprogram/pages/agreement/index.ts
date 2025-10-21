import { matchService } from "../../service/index";

Page({
  data: {
    text: "",
  },
  onLoad(options: any) {
    this.getMatchInfo(options.matchId, options.index, options.type, options.ticketBid);
  },
  getMatchInfo(matchId: string, index: number, type: string, ticketBid: string) {
    let params = { matchId: Number(matchId) };
    if (type === "gift") {
      params = { ticketBid: ticketBid || "" };
    }
    matchService.getMatchInfo(params).then((res) => {
      const agreementInfo = JSON.parse(res.data.match?.agreementInfo || "[]");
      console.log("agreementInfo", agreementInfo);
      wx.setNavigationBarTitle({
        title: agreementInfo[index].name,
      });
      this.setData({
        text: agreementInfo[index].text,
      });
    });
  },
});
