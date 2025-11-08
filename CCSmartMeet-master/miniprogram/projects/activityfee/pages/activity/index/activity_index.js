const ProjectBiz = require("../../../biz/project_biz.js");
const pageHelper = require("../../../../../helper/page_helper.js");
const ActivityBiz = require("../../../biz/activity_biz.js");
const ProjectSetting = require("../../../public/project_setting.js");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoad: false,
    _params: null,
    shopId: null,
    sortMenus: [],
    sortItems: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    ProjectBiz.initPage(this);
    if (options) {
      this._getSearchMenu();
      const params = {};
      const data = {};
      if (options.id) {
        // params.cateId = options.id;
        params.sortType = "cateId";
        params.sortVal = options.id;
      }
      const shop = wx.getStorageSync("shop");
      params.shopId = shop.id;
      data.shopId = shop.id;
      this.setData({
        isLoad: true,
        _params: params,
        ...data,
      });
      // ActivityBiz.setCateTitle();
      ActivityBiz.setShopIdOptions(this);
    } else {
      this._getSearchMenu();
      this.setData({
        isLoad: true,
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    const shop = wx.getStorageSync("shop");
    if (this.data.shopId !== shop.id) {
      this.setData({
        _params: { sortType: "cateId", sortVal: "", shopId: shop.id },
        shopId: shop.id,
      });
    }
    // this.setData({
    //   _params: { sortType: "cateId", sortVal: "", shopId: shop.id },
    //   shopId: shop.id,
    // });
    // ActivityBiz.setShopIdOptions(this);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  url: async function (e) {
    pageHelper.url(e, this);
  },

  handleShop: function (e) {
    const shopId = e.detail;
    const shop = this.data.shopIdOptions.find((i) => i.val === shopId);
    wx.setStorageSync("shop", shop.rawData);
    // console.info(this.data);
    this.setData({
      // _params: { ...this.data._params, shopId },
      _params: { sortType: "cateId", sortVal: "", shopId },
    });
  },

  bindCommListCmpt: function (e) {
    pageHelper.commListListener(this, e);
  },

  onShareAppMessage: function () {
    return {
      title: ProjectSetting.SHARE_TITLE,
      imageUrl: ProjectSetting.SHARE_IMAGE,
    };
  },

  _getSearchMenu: function () {
    let sortItem1 = [{ label: "全部", type: "cateId", value: "" }];
    if (ActivityBiz.getCateList().length > 1)
      sortItem1 = sortItem1.concat(ActivityBiz.getCateList());
    let sortItems = [];
    let sortMenus = [...sortItem1];
    this.setData({
      sortItems,
      sortMenus,
    });
  },
});
