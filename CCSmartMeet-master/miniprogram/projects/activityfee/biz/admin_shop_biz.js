/**
 * Notes: 资讯后台管理模块业务逻辑
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2020-11-14 07:48:00
 */

const BaseBiz = require("../../../comm/biz/base_biz.js");
const projectSetting = require("../public/project_setting.js");

class AdminShopBiz extends BaseBiz {
  /** 表单初始化相关数据 */
  static initFormData(id = "") {
    // let cateIdOptions = [];

    return {
      id,

      contentDesc: "",

      // 分类
      // cateIdOptions,

      fields: projectSetting.SHOP_FIELDS,

      // 图片数据
      imgList: [],

      // 表单数据
      formOrder: 9999,
      formTitle: "",
      formDesc: "",
      // formContent: [],
      // formCateId: (cateIdOptions.length == 1) ? cateIdOptions[0].val : '',
      formForms: [],
    };
  }

  static selectLocation(that) {
    let callback = function (res) {
      if (!res || !res.name || !res.address || !res.latitude || !res.longitude)
        return;

      let formAddress = res.address + "  " + res.name;

      let formAddressGeo = {};
      formAddressGeo.name = res.name;
      formAddressGeo.address = res.address;
      formAddressGeo.latitude = res.latitude;
      formAddressGeo.longitude = res.longitude;
      that.setData({
        formAddressGeo,
        formAddress,
      });
    };
    if (that.data.formAddressGeo && that.data.formAddressGeo.latitude > 0) {
      wx.chooseLocation({
        latitude: that.data.formAddressGeo.latitude,
        longitude: that.data.formAddressGeo.longitude,
        success: function (res) {
          callback(res);
        },
      });
    } else {
      wx.chooseLocation({
        success: function (res) {
          callback(res);
        },
        fail: function (err) {
          console.log(err);
        },
      });
    }
  }

  // static getCateName(cateId) {
  // 	let cateList = projectSetting.SHOP_CATE;

  // 	for (let k = 0; k < cateList.length; k++)  {
  // 		if (cateList[k].id == cateId) return cateList[k].title;
  // 	}
  // 	return '';
  // }
}

/** 表单校验  本地 */
AdminShopBiz.CHECK_FORM = {
  name: "formTitle|must|string|min:4|max:50|name=店铺名称",
	address: 'formAddress|must|string|name=位置',
  addressGeo: "formAddressGeo|must|object|name=位置GEO",
  // cateId: 'formCateId|must|id|name=分类',
  order: "formOrder|must|int|min:0|max:9999|name=排序号",
  desc: "formDesc|string|min:10|max:200|name=简介",
  forms: "formForms|array",
};

module.exports = AdminShopBiz;
