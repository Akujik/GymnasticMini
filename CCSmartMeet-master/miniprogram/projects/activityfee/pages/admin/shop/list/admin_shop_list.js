const AdminBiz = require("../../../../../../comm/biz/admin_biz.js");
const pageHelper = require("../../../../../../helper/page_helper.js");
const cloudHelper = require("../../../../../../helper/cloud_helper.js");
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
      title: projectSetting.SHOP_NAME + "-管理",
    });
    this.setData({
      SHOP_NAME: projectSetting.SHOP_NAME,
    });

    //设置搜索菜单
    this._getSearchMenu();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {},

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

  bindCommListCmpt: function (e) {
    pageHelper.commListListener(this, e);
  },

  _del: async function (e) {
    if (!AdminBiz.isAdmin(this)) return;
    let id = pageHelper.dataset(e, "id");

    let params = {
      id,
    };

    let callback = async () => {
      try {
        let opts = {
          title: "删除中",
        };
        await cloudHelper
          .callCloudSumbit("admin/shop_del", params, opts)
          .then((res) => {
            pageHelper.delListNode(id, this.data.dataList.list, "id");
            this.data.dataList.total--;
            this.setData({
              dataList: this.data.dataList,
            });
            pageHelper.showSuccToast("删除成功");
          });
      } catch (e) {
        console.log(e);
      }
    };
    pageHelper.showConfirm("确认删除？删除不可恢复", callback);
  },

  bindStatusMoreTap: async function (e) {
    if (!AdminBiz.isAdmin(this)) return;
    let itemList = ["启用", "停用 (不可见)", "删除"];
    wx.showActionSheet({
      itemList,
      success: async (res) => {
        switch (res.tapIndex) {
          case 0: {
            //启用
            e.currentTarget.dataset["status"] = 1;
            await this._setStatus(e);
            break;
          }
          case 1: {
            //停止
            e.currentTarget.dataset["status"] = 0;
            await this._setStatus(e);
            break;
          }
          case 2: {
            //删除
            await this._del(e);
            break;
          }
        }
      },
      fail: function (res) {},
    });
  },

  _setStatus: async function (e) {
    if (!AdminBiz.isAdmin(this)) return;
    let id = pageHelper.dataset(e, "id");
    let status = Number(pageHelper.dataset(e, "status"));
    let params = {
      id,
      status,
    };

    try {
      await cloudHelper
        .callCloudSumbit("admin/shop_status", params)
        .then((res) => {
          pageHelper.modifyListNode(
            id,
            this.data.dataList.list,
            "SHOP_STATUS",
            status,
            "id"
          );
          this.setData({
            dataList: this.data.dataList,
          });
          pageHelper.showSuccToast("设置成功");
        });
    } catch (e) {
      console.log(e);
    }
  },

  _getSearchMenu: function () {
    let cateIdOptions = [];

    let sortItems = [];

    let sortMenus = [
      { label: "全部", type: "", value: "" },
      { label: "正常", type: "status", value: 1 },
      { label: "停用", type: "status", value: 0 },
    ];

    this.setData({
      search: "",
      cateIdOptions,
      sortItems,
      sortMenus,
      isLoad: true,
    });
  },
});
