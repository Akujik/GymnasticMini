/**
 * Notes: 店铺模块控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2020-09-29 04:00:00 
 */

const BaseProjectController = require('./base_project_controller.js');
const ShopService = require('../service/shop_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

class ShopController extends BaseProjectController {

	// 把列表转换为显示模式
	transShopList(list) {
		let ret = [];
		for (let k = 0; k < list.length; k++) {
			let node = {};
			node.type = 'shop';
			node.id = list[k]._id;
			node.shopId = list[k].SHOP_ID;
      node.shopAddress = list[k].SHOP_ADDRESS;
      node.shopName = list[k].SHOP_NAME;
			node.ext = list[k].SHOP_ADD_TIME;
      node.pic = list[k].SHOP_PIC[0];
      node.shopAddressGeo= list[k].SHOP_ADDRESS_GEO;
			ret.push(node);
		}
		return ret;
	} 

	/** 店铺列表 */
	async getShopList() {
   
		// 数据校验
		let rules = {
			//search: 'string|min:1|max:30|name=搜索条件',
			//sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序', 
			page: 'must|int|default=1',
			size: 'int|defalut=10',
			isTotal: 'bool',
			oldTotal: 'int',
		};

		// 取得数据
		let input = this.validateData(rules);
    console.log('input aaaa',input);
		let service = new ShopService();
		let result = await service.getShopList(input);
    
    
		// 数据格式化
		let list = result.list;
    //console.log( result);
		for (let k = 0; k < list.length; k++) {
			list[k].SHOP_ADD_TIME = timeUtil.timestamp2Time(list[k].SHOP_ADD_TIME, 'Y-M-D');

		}
		result.list = this.transShopList(list);
   // console.log(result);
		return result;

	}


	/** 浏览店铺信息 */
	async viewShop() {
		// 数据校验
		let rules = {
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new ShopService();
		let shop = await service.viewShop(input.id);

		if (shop) {
			// 显示转换 
			shop.SHOP_ADD_TIME = timeUtil.timestamp2Time(shop.SHOP_ADD_TIME, 'Y-M-D');
		}
   
		return shop;
	}



}

module.exports = ShopController;