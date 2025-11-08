/**
 * Notes: 门店模块业务逻辑
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2022-10-29 07:48:00 
 */

const BaseProjectService = require('./base_project_service.js');
const util = require('../../../framework/utils/util.js');
const ShopModel = require('../model/shop_model.js');

class ShopService extends BaseProjectService {

	
	/** 取得分页列表 */
	async getShopList({
		orderBy, // 排序 
		page,
		size,
		isTotal,
		oldTotal
	}) {

		orderBy = orderBy || {
			'SHOP_ORDER': 'asc',
			'SHOP_ADD_TIME': 'desc'
		};
		let fields = '_id,SHOP_ADDRESS,SHOP_ADDRESS_GEO,SHOP_NAME,SHOP_DESC,SHOP_STATUS,SHOP_ORDER,SHOP_PIC,SHOP_ADD_TIME,SHOP_EDIT_TIME';

		let where = {
    };
		where.and = {
      SHOP_STATUS :1,
		  //_pid: this.getProjectId() //复杂的查询在此处标注PID
		};


    /*
		if (util.isDefined(search) && search) {
			where.or = [
				{ SHOP_NAME: ['like', search] },
			];
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'SHOP_ADD_TIME');
					break;
				}
			}
    }
    */
  
    
    
    let result =  await  ShopModel.getList(where, fields, orderBy, page, 10);
    return result;
	}  


/** 浏览店铺信息 */
  async viewShop(id) {

    let fields = '*';

    let where = {
      _id: id,
    }
    let shop = await ShopModel.getOne(where, fields);
    if (!shop) return null;

    return shop;
  }


}

module.exports = ShopService;