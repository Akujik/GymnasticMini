const AdminBiz = require("../../../../../../comm/biz/admin_biz.js");
const pageHelper = require("../../../../../../helper/page_helper.js");
const cloudHelper = require("../../../../../../helper/cloud_helper.js");
const validate = require("../../../../../../helper/validate.js");
const AdminShopBiz = require("../../../../biz/admin_shop_biz.js");
const PublicBiz = require("../../../../../../comm/biz/public_biz.js");
const projectSetting = require("../../../../public/project_setting.js");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoad: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    if (!AdminBiz.isAdmin(this)) return;
    if (!pageHelper.getOptions(this, options)) return;

    wx.setNavigationBarTitle({
      title: projectSetting.SHOP_NAME + "-修改",
    });

    this._loadDetail();
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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: async function () {
    await this._loadDetail();
    wx.stopPullDownRefresh();
  },

  model: function (e) {
    pageHelper.model(this, e);
  },

  _loadDetail: async function () {
    if (!AdminBiz.isAdmin(this)) return;

    let id = this.data.id;
    if (!id) return;

    if (!this.data.isLoad) this.setData(AdminShopBiz.initFormData(id)); // 初始化表单数据

    let params = {
      id,
    };
    let opt = {
      title: "bar",
    };
    let shop = await cloudHelper.callCloudData(
      "admin/shop_detail",
      params,
      opt
    );
    if (!shop) {
      this.setData({
        isLoad: null,
      });
      return;
    }

    this.setData({
      isLoad: true,

      imgList: shop.SHOP_PIC,

      // 表单数据
      // formCateId: shop.SHOP_CATE_ID,
      formOrder: shop.SHOP_ORDER,

      formTitle: shop.SHOP_NAME,
      // formContent: shop.SHOP_CONTENT,

      formDesc: shop.SHOP_DESC,

      formForms: shop.SHOP_FORMS,
      formAddress: shop.SHOP_ADDRESS,
      formAddressGeo: shop.SHOP_ADDRESS_GEO,
    });
  },

  /**
   * 数据提交
   */
  bindFormSubmit: async function () {
    if (!AdminBiz.isAdmin(this)) return;

    // 数据校验
    let data = this.data;
    // if (this.data.formContent.length == 0) {
    // 	return pageHelper.showModal('详细内容不能为空');
    // }
    data = validate.check(data, AdminShopBiz.CHECK_FORM, this);
    if (!data) return;

    let forms = this.selectComponent("#cmpt-form").getForms(true);
    if (!forms) return;
    data.forms = forms;

    // data.cateName = AdminShopBiz.getCateName(data.cateId);

    try {
      let shopId = this.data.id;
      data.id = shopId;

      if (this.data.imgList.length == 0) {
        return pageHelper.showModal("请上传封面图");
      }

      // 提取简介
      // data.desc = PublicBiz.getRichEditorDesc(data.desc, this.data.formContent);

      // 先修改，再上传
      await cloudHelper.callCloudSumbit("admin/shop_edit", data);

      // 封面图片 提交处理
      wx.showLoading({
        title: "提交中...",
        mask: true,
      });
      await cloudHelper.transCoverTempPics(
        this.data.imgList,
        "shop/",
        shopId,
        "admin/shop_pic_update"
      );

      // 富文本图片
      // let formContent = this.data.formContent;
      // wx.showLoading({
      // 	title: '提交中...',
      // 	mask: true
      // });
      // let content = await cloudHelper.transRichEditorTempPics(formContent, 'shop/', shopId, 'admin/shop_update_content');
      // this.setData({
      // 	formContent: content
      // });

      // await cloudHelper.transFormsTempPics(
      //   forms,
      //   "shop/",
      //   shopId,
      //   "admin/shop_update_forms"
      // );

      let callback = async () => {
        // 更新列表页面数据
        let node = {
          SHOP_NAME: data.name,
          SHOP_ORDER: data.order,
        };

        pageHelper.modifyPrevPageListNodeObject(
          shopId,
          node,
          2,
          "dataList",
          "id"
        );

        wx.navigateBack();
      };
      pageHelper.showSuccToast("修改成功", 2000, callback);
    } catch (err) {
      console.log(err);
    }
  },

  bindImgUploadCmpt: function (e) {
    this.setData({
      imgList: e.detail,
    });
  },

  bindMapTap: function (e) {
    AdminShopBiz.selectLocation(this);
  },

  url: function (e) {
    pageHelper.url(e, this);
  },
});
