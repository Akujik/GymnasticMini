/**
 * Notes: 店铺后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2021-07-11 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js'); 
const dataUtil = require('../../../../framework/utils/data_util.js');
const util = require('../../../../framework/utils/util.js'); 
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');

const ShopModel = require('../../model/shop_model.js');

class AdminShopService extends BaseProjectAdminService {


	/**添加门店 */
	async insertShop({
		name,
		desc, 
    address,
		addressGeo,
		order
	}) {


		// 重复性判断
		let where = {
		  SHOP_NAME: name,
		}
		if (await ShopModel.count(where))
			this.AppError('该门店已经存在');

		// 赋值 
		let data = {};
		data.SHOP_NAME = name;
		data.SHOP_DESC = dataUtil.fmtText(desc, 100);;
		data.SHOP_ADDRESS = address;
		data.SHOP_ADDRESS_GEO= addressGeo;
    data.SHOP_ORDER = order;

    console.log('shop insert',data);
		let id = await ShopModel.insert(data);

		return {
			id
		};
	}

	/**删除资讯数据 */
	async delShop(id) {
		let where = {
			_id: id
		}
		// 取出图片数据
		let shop = await ShopModel.getOne(where, '*');
		if (!shop) return;
		await ShopModel.del(where);
		// 异步删除图片  
		cloudUtil.deleteFiles(shop.SHOP_PIC);

	}

	/**获取店铺信息 */
	async getShopDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let shop = await ShopModel.getOne(where, fields);
		if (!shop) return null;

		return shop;
	}

	// 更新店铺状态
	async statusShop(id, status) {
    let data = {
			SHOP_STATUS: status
		}
		let where = {
			_id: id
    }
    
    //console.log('---where',where,':----data',data)
    return await ShopModel.edit(where, data);
	}

	/**更新店铺数据 */
	async editShop({
		id,
    name,
		desc, 
    address,
		addressGeo,
		order
	}) {

		// 重复性判断
		let where = {
			SHOP_NAME: name,
			_id: ['<>', id]
    }
    console.log('wherer***__',where);
    let ccunt=await ShopModel.count(where);
    console.log('ccunt***__',ccunt);
		if (ccunt>0)
			this.AppError('该门店已经存在');


		// 赋值 
		let data = {};
		data.SHOP_NAME = name;
		data.SHOP_DESC = dataUtil.fmtText(desc, 100);;
		data.SHOP_ADDRESS = address;
		data.SHOP_ADDRESS_GEO= addressGeo;
    data.SHOP_ORDER = order;
    
		return await ShopModel.edit(id, data);
  }
  
  /** 取得分页列表 */
	async getShopList({
    sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序 
		page,
		size,
		isTotal,
    oldTotal,
	}) {

		orderBy = orderBy || {
			'SHOP_ORDER': 'asc',
			'SHOP_ADD_TIME': 'desc'
		};
		let fields = '_id,SHOP_ADDRESS,SHOP_ADDRESS_GEO,SHOP_NAME,SHOP_DESC,SHOP_STATUS,SHOP_ORDER,SHOP_PIC,SHOP_ADD_TIME,SHOP_EDIT_TIME';

    let where = {
     
    }
    
    if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					where.and ={
            SHOP_STATUS : Number(sortVal),
          };
					break; 
			}
		}
		

    
    let result =  await  ShopModel.getList(where, fields, orderBy, page, 10);
    return result;
  }  
  
  
  /**
	 * 更新图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateShopPic({
		id,
		imgList // 图片数组
	}) {

		// 获取数据库里的图片数据
		let shop = await ShopModel.getOne(id, 'SHOP_PIC');

		// 处理 新旧文件
		let picList = await cloudUtil.handlerCloudFiles(shop.SHOP_PIC, imgList);

		//更新数据库
		let data = {
			SHOP_PIC: picList
		};
		await ShopModel.edit(id, data);

	}


  /**
	 * 获取店铺详情
	 */
	async detail({
		id
	}) {

		// 获取数据库里的图片数据
		let shop = await ShopModel.getOne(id);

		return shop;

	}
}

module.exports = AdminShopService;