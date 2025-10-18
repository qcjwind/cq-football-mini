import { matchService } from "../../service/index";

Page({
  data: {
    text: "",
  },
  onLoad(options: any) {
    this.getMatchInfo(options.matchId, options.index);
  },
  getMatchInfo(matchId: string, index: number) {
    matchService.getMatchInfo({ matchId: Number(matchId) }).then((res) => {
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
