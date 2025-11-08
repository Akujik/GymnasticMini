/**
 * Notes: 资讯模块后台管理-控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2021-07-11 10:20:00 
 */

const BaseProjectAdminController = require('./base_project_admin_controller.js');

const AdminShopService = require('../../service/admin/admin_shop_service.js');

const timeUtil = require('../../../../framework/utils/time_util.js');
const contentCheck = require('../../../../framework/validate/content_check.js');
const ShopModel = require('../../model/shop_model.js');

class AdminShopController extends BaseProjectAdminController {

// 把列表转换为显示模式
transShopList(list) {
  let ret = [];
  for (let k = 0; k < list.length; k++) {
    let node = {};
    node.type = 'shop';
    node.id = list[k]._id;
    node.SHOP_ID = list[k].SHOP_ID;
    node.SHOP_ADDRESS = list[k].SHOP_ADDRESS;
    node.SHOP_NAME = list[k].SHOP_NAME;
    node.SHOP_ADD_TIME = list[k].SHOP_ADD_TIME;
    node.pic = list[k].SHOP_PIC[0];
    node.SHOP_ADDRESS_GEO= list[k].SHOP_ADDRESS_GEO;
    node.SHOP_ORDER= list[k].SHOP_ORDER;
    node.SHOP_STATUS=list[k].SHOP_STATUS;
    ret.push(node);
  }
  return ret;
} 

	/** 店铺状态修改 */
	async statusShop() {
		await this.isAdmin();

		// 数据校验
		let rules = {
			id: 'must|id',
			status: 'must|int',
		};

		// 取得数据
		let input = this.validateData(rules);
		let service = new AdminShopService();
		await service.status(input.id, input.status);

	}

	/** 店铺列表 */
	async getAdminShopList() {
		await this.isAdmin();

    let rules = {
      sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序', 
			page: 'must|int|default=1',
			size: 'int|defalut=10',
			isTotal: 'bool',
			oldTotal: 'int',
		};

		// 取得数据
		let input = this.validateData(rules);
		let service = new AdminShopService();
		let result = await service.getShopList(input);
    
    
		// 数据格式化
		let list = result.list;
    console.log( result);
		for (let k = 0; k < list.length; k++) {
			list[k].SHOP_ADD_TIME = timeUtil.timestamp2Time(list[k].SHOP_ADD_TIME, 'Y-M-D');

		}
		result.list = this.transShopList(list);
   // console.log(result);
		return result;

	

	}

	


	/** 发布店铺信息 */
	async insertShop() {
		await this.isAdmin();

		// 数据校验 
		let rules = {
			name: 'must|string|min:4|max:50|name=店铺名称',
			order: 'must|int|min:0|max:9999|name=排序号',
      desc: 'must|string|min:10|max:200|name=简介',
      address: 'must|string|name=活动地点',
      addressGeo: 'must|object|name=活动地点GEO',
		};


		// 取得数据
		let input = this.validateData(rules);

		// 内容审核
    let service = new AdminShopService();
    console.log('input ----->' ,input);
		let result = await service.insertShop(input);

		this.logNews('添加了门店《' + input.name + '》');

		return result;

	}

  /** 删除店铺信息 */
  async detail() {
		await this.isAdmin();
	// 数据校验
    let rules = {
      id: 'must|id',
    };
		// 取得数据
		let input = this.validateData(rules);

		// 内容审核
		let service = new AdminShopService();
		let result = await service.detail(input);

		return result;
  }

  /** 删除店铺信息 */
	async delShop() {
		await this.isAdmin();
	// 数据校验
    let rules = {
      id: 'must|id',
    };
		// 取得数据
		let input = this.validateData(rules);

		// 内容审核
		let service = new AdminShopService();
		let result = await service.delShop(input.id);

		return result;
  }
  
  /** 更改店铺状态信息 */
	async statusShop() {
		await this.isAdmin();
	// 数据校验
    let rules = {
      id: 'must|id',
      status: 'must|int',
    };
		// 取得数据
		let input = this.validateData(rules);

    let service = new AdminShopService();
    console.log('status shop',input);
		let result = await service.statusShop(input.id,input.status);

		return result;
	}

  /** 编辑店铺状态信息 */
	async editShop() {
		await this.isAdmin();
	
   	// 数据校验 
		let rules = {
    	id: 'must|id',
			name: 'must|string|min:4|max:50|name=店铺名称',
			order: 'must|int|min:0|max:9999|name=排序号',
      desc: 'must|string|min:10|max:200|name=简介',
      address: 'must|string|name=活动地点',
      addressGeo: 'must|object|name=活动地点GEO',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminShopService();
		let result = await service.editShop(input);

		return result;
  }


  /**
	 * 更新图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateShopPic() {
		await this.isAdmin();

		// 数据校验
		let rules = {
			id: 'must|id',
			imgList: 'array'
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminShopService();
		return await service.updateShopPic(input);
	}

	
}

module.exports = AdminShopController;