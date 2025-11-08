/**
 * Notes: 资讯实体
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2020-10-28 19:20:00 
 */


const BaseProjectModel = require('./base_project_model.js');

class ShopModel extends BaseProjectModel {

}

// 集合名
ShopModel.CL = BaseProjectModel.C('shop');

ShopModel.DB_STRUCTURE = {
	_pid: 'string|true',
	SHOP_ID: 'string|true',  
  SHOP_ADDRESS: 'string|false|comment=详细地址',
  SHOP_ADDRESS_GEO: 'object|false|comment=详细地址坐标参数',
	SHOP_NAME: 'string|false|comment=店铺名字',
	SHOP_DESC: 'string|false|comment=描述',
	SHOP_STATUS: 'int|true|default=1|comment=状态 0/1',
	SHOP_ORDER: 'int|true|default=9999',   
	SHOP_PIC: 'array|false|default=[]|comment=封面图  [cloudId1,cloudId2,cloudId3...]',
	SHOP_ADD_TIME: 'int|true',
  SHOP_EDIT_TIME: 'int|true',
	SHOP_ADD_IP: 'string|false',
	SHOP_EDIT_IP: 'string|false',
};

// 字段前缀
ShopModel.FIELD_PREFIX = "SHOP_";


module.exports = ShopModel;