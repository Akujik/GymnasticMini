const pageHelper = require("../../../../../helper/page_helper.js");
const helper = require("../../../../../helper/helper.js");
const { useMitt, EventType } = require("../../../../../util/useMitt.js");
const cloudHelper = require("../../../../../helper/cloud_helper.js");
const ProjectBiz = require("../../../biz/project_biz.js");
const ProjectSetting = require("../../../public/project_setting.js");
const NewsBiz = require("../../../biz/news_biz.js");

const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    cateList: ProjectSetting.ACTIVITY_CATE,
    newsData: {},
    newsImageList: [],
    shopDistance: null,
    showContact: false,
    mitt: useMitt(),
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    ProjectBiz.initPage(this);
    // 监听地理位置状态
    this.data.mitt.addListener(EventType.Location, () => {
      this.reload();
      const { latitude, longitude } = app.globalData;
      cloudHelper.callCloudData("passport/update_addr", {
        addr: `${latitude},${longitude}`,
      });
      // console.info(app.globalData);
    });
    // 未登录直接跳注册页面
    let user = await cloudHelper.callCloudData("passport/my_detail", {});
    if (!user) return wx.redirectTo({ url: "../../my/reg/my_reg" });
    // 公告列表
    await cloudHelper.dataList(this, "newsData", "news/list", {}, {});
    const arr = this.data.newsData.list.map((i) => {
      return {
        ...i,
        src: i.pic,
        url: `../../${i.type}/detail/${i.type}_detail?id=${i.id}`,
      };
    });
    this.setData({ newsImageList: arr });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.data.mitt.clear();
  },

  _loadList: async function () {
    let opts = {
      title: "bar",
    };
    const params = {};
    const { shop } = this.data;
    if (shop) params.shopId = shop.id;
    await cloudHelper.callCloudSumbit("home/list", params, opts).then((res) => {
      this.setData({
        ...res.data,
      });
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    this.reload();
  },

  onPullDownRefresh: async function () {
    await this._loadList();
    wx.stopPullDownRefresh();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  async reload() {
    if (app.globalData.latitude) {
      let shop = wx.getStorageSync("shop");
      const list = await cloudHelper.callCloud("shop/list");
      const res = list.data.list;
      const hasShop = !!res.find((i) => i.id === shop.id);
      // 店铺不存在
      if (!hasShop) shop = null;
      if (shop) {
        const shopDistance = helper.getDistance(
          shop.shopAddressGeo,
          app.globalData
        );
        this.setData({ shop, shopDistance });
      } else {
        const { latitude: x1, longitude: y1 } = app.globalData;
        const result = res
          .map((shop) => {
            const { latitude: x2, longitude: y2 } = shop.shopAddressGeo;
            return { shop, d: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) };
          })
          .sort((x, y) => x.d - y.d)[0];
        const shop = result.shop;
        console.info(shop);
        wx.setStorageSync("shop", shop);
        const shopDistance = helper.getDistance(
          shop.shopAddressGeo,
          app.globalData
        );
        this.setData({ shop, shopDistance });
      }
    }
    this._loadList();
  },

  url: async function (e) {
    pageHelper.url(e, this);
  },

  bindShopTap() {
    wx.navigateTo({ url: "../../shop/index/shop_index" });
  },
  bindOpenMapTap() {
    const { shopAddressGeo } = this.data.shop;
    wx.openLocation({
      latitude: shopAddressGeo.latitude,
      longitude: shopAddressGeo.longitude,
    });
  },
  bindContactTap() {
    this.setData({ showContact: true });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: ProjectSetting.SHARE_TITLE,
      imageUrl: ProjectSetting.SHARE_IMAGE,
    };
  },
});
