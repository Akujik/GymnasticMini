const AdminBiz = require("../../../../../../comm/biz/admin_biz.js");
const pageHelper = require("../../../../../../helper/page_helper.js");
const cloudHelper = require("../../../../../../helper/cloud_helper.js");
const AdminActivityBiz = require("../../../../biz/admin_activity_biz.js");
const ActivityBiz = require("../../../../biz/activity_biz.js");
const validate = require("../../../../../../helper/validate.js");
const PublicBiz = require("../../../../../../comm/biz/public_biz.js");
const projectSetting = require("../../../../public/project_setting.js");

Page({
  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    if (!AdminBiz.isAdmin(this)) return;

    wx.setNavigationBarTitle({
      title: projectSetting.ACTIVITY_NAME + "-添加",
    });

    this.setData(AdminActivityBiz.initFormData());
    this.setData({
      isLoad: true,
    });

    ActivityBiz.setShopIdOptions(this, true);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  url: function (e) {
    pageHelper.url(e, this);
  },
  switchModel: function (e) {
    pageHelper.switchModel(this, e);
  },

  bindFormSubmit: async function () {
    if (!AdminBiz.isAdmin(this)) return;
    const { shopIdOptions } = this.data;

    let data = this.data;
    data = validate.check(data, AdminActivityBiz.CHECK_FORM, this);
    if (!data) return;

    if (data.end < data.start) {
      return pageHelper.showModal("结束时间不能早于开始时间");
    }

    let forms = this.selectComponent("#cmpt-form").getForms(true);
    if (!forms) return;
    data.forms = forms;

    // 分类
    data.cateName = ActivityBiz.getCateName(data.cateId);
    if (!data.cateName) data.cateName = "全部";

    // 店铺相关数据
    if (data.shopId === "-1") {
      // 所有门店
      data.shopName = "全部";
    } else {
      // 选择门店
      const option = shopIdOptions.find((i) => i.val === data.shopId)?.rawData;
      if (!option) return pageHelper.showModal("店铺数据出错");
      Object.assign(data, {
        shopName: option.SHOP_NAME,
        address: option.SHOP_ADDRESS,
        addressGeo: option.SHOP_ADDRESS_GEO,
      });
    }

    try {
      // 创建
      let result = await cloudHelper.callCloudSumbit(
        "admin/activity_insert",
        data
      );
      let activityId = result.data.id;

      // 图片
      await cloudHelper.transFormsTempPics(
        forms,
        "activity/",
        activityId,
        "admin/activity_update_forms"
      );

      let callback = async function () {
        PublicBiz.removeCacheList("admin-activity-list");
        PublicBiz.removeCacheList("activity-list");
        wx.navigateBack();
      };
      pageHelper.showSuccToast("添加成功", 2000, callback);
    } catch (err) {
      console.log(err);
    }
  },

  bindJoinFormsCmpt: function (e) {
    this.setData({
      formJoinForms: e.detail,
    });
  },

  bindMapTap: function (e) {
    AdminActivityBiz.selectLocation(this);
  },
});
