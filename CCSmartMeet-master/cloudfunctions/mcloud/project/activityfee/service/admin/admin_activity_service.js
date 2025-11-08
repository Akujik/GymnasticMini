/**
 * Notes: 活动后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2022-06-23 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const ActivityService = require('../activity_service.js');
const AdminHomeService = require('../admin/admin_home_service.js');
const util = require('../../../../framework/utils/util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');
const cloudBase = require('../../../../framework/cloud/cloud_base.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const ActivityModel = require('../../model/activity_model.js');
const ActivityJoinModel = require('../../model/activity_join_model.js');
const exportUtil = require('../../../../framework/utils/export_util.js');

// 导出报名数据KEY
const EXPORT_ACTIVITY_JOIN_DATA_KEY = 'EXPORT_ACTIVITY_JOIN_DATA';

class AdminActivityService extends BaseProjectAdminService {



	/**取得分页列表 */
	async getAdminActivityList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
    oldTotal,
    shopId,
	}) {

		orderBy = orderBy || {
			'ACTIVITY_ORDER': 'asc',
			'ACTIVITY_ADD_TIME': 'desc'
		};
		let fields = 'ACTIVITY_METHOD,ACTIVITY_PAY_CNT,ACTIVITY_FEE,ACTIVITY_PAY_FEE,ACTIVITY_JOIN_CNT,ACTIVITY_TITLE,ACTIVITY_CATE_ID,ACTIVITY_CATE_NAME,ACTIVITY_EDIT_TIME,ACTIVITY_ADD_TIME,ACTIVITY_ORDER,ACTIVITY_STATUS,ACTIVITY_VOUCH,ACTIVITY_MAX_CNT,ACTIVITY_START,ACTIVITY_END,ACTIVITY_STOP,ACTIVITY_CANCEL_SET,ACTIVITY_CHECK_SET,ACTIVITY_QR,ACTIVITY_OBJ,ACTIVITY_SHOP_ID,ACTIVITY_SHOP_NAME';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

    // if (util.isDefined(shopId) && shopId) {
    //   where.and = [{
    //     ACTIVITY_SHOP_ID = shopId,
    //   }]
    // };

		if (util.isDefined(search) && search) {
			where.or = [{
				ACTIVITY_TITLE: ['like', search]
			},];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.and.ACTIVITY_CATE_ID = String(sortVal);
					break;
				}
				case 'status': {
					where.and.ACTIVITY_STATUS = Number(sortVal);
					break;
				}
				case 'vouch': {
					where.and.ACTIVITY_VOUCH = 1;
					break;
				}
				case 'top': {
					where.and.ACTIVITY_ORDER = 0;
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'ACTIVITY_ADD_TIME');
					break;
				}
			}
		}

		return await ActivityModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**置顶与排序设定 */
	async sortActivity(id, sort) {
		sort = Number(sort);
		let data = {};
		data.ACTIVITY_ORDER = sort;
		await ActivityModel.edit(id, data);
	}

	/**获取信息 */
	async getActivityDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}

		let activity = await ActivityModel.getOne(where, fields);
		if (!activity) return null;

		return activity;
	}


	/**首页设定 */
	async vouchActivity(id, vouch) {
		let data = { ACTIVITY_VOUCH: Number(vouch) };
		await ActivityModel.edit(id, data);

	}

	/**添加 */
	async insertActivity({
		title,
		cateId,
		cateName,

		maxCnt,
		start,
		end,
		stop,

		method,
		fee,

		address,
		addressGeo,

		cancelSet,
		checkSet,
		isMenu,

		order,
		forms,
    joinForms,
    shopId,
    shopName,
	}) {

		// 重复性判断
		let where = {
			ACTIVITY_TITLE: title,
			ACTIVITY_CATE_ID: cateId
		}
		if (await ActivityModel.count(where))
			this.AppError('该标题已经存在');

		// 赋值 
		let data = {};

		data.ACTIVITY_TITLE = title;
		data.ACTIVITY_CATE_ID = cateId;
		data.ACTIVITY_CATE_NAME = cateName;
		data.ACTIVITY_ORDER = order;

		data.ACTIVITY_MAX_CNT = maxCnt;
		data.ACTIVITY_START = timeUtil.time2Timestamp(start + ':00');
		data.ACTIVITY_END = timeUtil.time2Timestamp(end + ':00');

		data.ACTIVITY_START_DAY = timeUtil.timestamp2Time(data.ACTIVITY_START, 'Y-M-D');
		data.ACTIVITY_END_DAY = timeUtil.timestamp2Time(data.ACTIVITY_END, 'Y-M-D');

		data.ACTIVITY_START_MONTH = timeUtil.timestamp2Time(data.ACTIVITY_START, 'Y-M');
		data.ACTIVITY_END_MONTH = timeUtil.timestamp2Time(data.ACTIVITY_END, 'Y-M');

		fee = dataUtil.fmtMoney(fee) * 100;
		fee = Math.round(Number(fee));
		if (!fee) fee = 0;
		data.ACTIVITY_FEE = fee;
		data.ACTIVITY_METHOD = method;

		data.ACTIVITY_ADDRESS = address;
		data.ACTIVITY_ADDRESS_GEO = addressGeo;

		data.ACTIVITY_STOP = timeUtil.time2Timestamp(stop + ':00');
		data.ACTIVITY_CANCEL_SET = cancelSet;
		data.ACTIVITY_CHECK_SET = checkSet;
		data.ACTIVITY_IS_MENU = isMenu;

		data.ACTIVITY_OBJ = dataUtil.dbForms2Obj(forms);
		data.ACTIVITY_FORMS = forms;

    data.ACTIVITY_JOIN_FORMS = joinForms;
    data.ACTIVITY_SHOP_ID=shopId;
    data.ACTIVITY_SHOP_NAME=shopName;

		let id = await ActivityModel.insert(data);

		let qr = await this.genDetailQr('activity', id);
		ActivityModel.edit(id, { ACTIVITY_QR: qr });

		return {
			id
		};
	}

	//#############################    

	/**删除数据 */
	async delActivity(id) {
		let where = {
			ACTIVITY_JOIN_ACTIVITY_ID: id,
			ACTIVITY_JOIN_PAY_STATUS: 1
		}
		// 判断是否有已支付
		let cnt = await ActivityJoinModel.count(where);
		if (cnt > 0)
			this.AppError('已有缴费的记录，请先取消再删除本活动');

		// 异步处理 新旧文件
		let activity = await ActivityModel.getOne(id, 'ACTIVITY_FORMS,ACTIVITY_QR');
		if (!activity) return;
		cloudUtil.handlerCloudFilesForForms(activity.ACTIVITY_FORMS, []);
		cloudUtil.deleteFiles([activity.ACTIVITY_QR]);

		await ActivityModel.del(id);


		// 删除报名用户
		ActivityJoinModel.del({ ACTIVITY_JOIN_ACTIVITY_ID: id });

	}

	// 更新forms信息
	async updateActivityForms({
		id,
		hasImageForms
	}) {
		await ActivityModel.editForms(id, 'ACTIVITY_FORMS', 'ACTIVITY_OBJ', hasImageForms);

	}

	/**更新数据 */
	async editActivity({
		id,
		title,
		cateId, // 二级分类 
		cateName,

		maxCnt,
		start,
		end,
		stop,

		method,
		fee,

		address,
		addressGeo,

		cancelSet,
		checkSet,
		isMenu,

		order,
		forms,
    joinForms,
    shopId,
    shopName
	}) {

		// 重复性判断
		let where = {
			ACTIVITY_TITLE: title,
			ACTIVITY_CATE_ID: cateId,
			_id: ['<>', id]
		}

		if (await ActivityModel.count(where))
			this.AppError('该标题已经存在');


		// 异步处理 新旧文件
		let oldForms = await ActivityModel.getOneField(id, 'ACTIVITY_FORMS');
		if (!oldForms) return;
		cloudUtil.handlerCloudFilesForForms(oldForms, forms);

		// 赋值 
		let data = {};
		data.ACTIVITY_TITLE = title;
		data.ACTIVITY_CATE_ID = cateId;
		data.ACTIVITY_CATE_NAME = cateName;
		data.ACTIVITY_ORDER = order;

		data.ACTIVITY_MAX_CNT = maxCnt;
		data.ACTIVITY_START = timeUtil.time2Timestamp(start + ':00');
		data.ACTIVITY_END = timeUtil.time2Timestamp(end + ':00');
		data.ACTIVITY_STOP = timeUtil.time2Timestamp(stop + ':00');

		data.ACTIVITY_START_DAY = timeUtil.timestamp2Time(data.ACTIVITY_START, 'Y-M-D');
		data.ACTIVITY_END_DAY = timeUtil.timestamp2Time(data.ACTIVITY_END, 'Y-M-D');

		data.ACTIVITY_START_MONTH = timeUtil.timestamp2Time(data.ACTIVITY_START, 'Y-M');
		data.ACTIVITY_END_MONTH = timeUtil.timestamp2Time(data.ACTIVITY_END, 'Y-M');

		fee = dataUtil.fmtMoney(fee) * 100;
		fee = Math.round(Number(fee));
		if (!fee) fee = 0;
		data.ACTIVITY_FEE = fee;
		data.ACTIVITY_METHOD = method;

		data.ACTIVITY_ADDRESS = address;
		data.ACTIVITY_ADDRESS_GEO = addressGeo;

		data.ACTIVITY_CANCEL_SET = cancelSet;
		data.ACTIVITY_CHECK_SET = checkSet;
		data.ACTIVITY_IS_MENU = isMenu;

		data.ACTIVITY_OBJ = dataUtil.dbForms2Obj(forms);
		data.ACTIVITY_FORMS = forms;

		data.ACTIVITY_JOIN_FORMS = joinForms;
    data.ACTIVITY_SHOP_ID=shopId;
    data.ACTIVITY_SHOP_NAME=shopName;

		let updateWhere = {
			_id: id
    }
  
		await ActivityModel.edit(updateWhere, data);


		// 小程序码
		let qr = await this.genDetailQr('activity', id);
		ActivityModel.edit(id, { ACTIVITY_QR: qr });

		// 状态变更返回
		let activity = await ActivityModel.getOne(id);
		let activityService = new ActivityService();
		return { statusDesc: activityService.getJoinStatusDesc(activity) };
	}

	/**修改状态 */
	async statusActivity(id, status) {
		let data = {
			ACTIVITY_STATUS: status
		}
		let where = {
			_id: id,
		}

		await ActivityModel.edit(where, data);

		let activity = await ActivityModel.getOne(id);
		let activityService = new ActivityService();
		return { statusDesc: activityService.getJoinStatusDesc(activity) };
	}

	//#############################
	/**报名分页列表 */
	async getActivityJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		activityId,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ACTIVITY_JOIN_ADD_TIME': 'desc'
		};
		let fields = '*';

		let where = {
			ACTIVITY_JOIN_ACTIVITY_ID: activityId
		};
		if (util.isDefined(search) && search) {
			where['ACTIVITY_JOIN_FORMS.val'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型  
					where.ACTIVITY_JOIN_STATUS = Number(sortVal);
					break;
				case 'checkin':
					// 签到
					where.ACTIVITY_JOIN_STATUS = ActivityJoinModel.STATUS.SUCC;
					if (sortVal == 1) {
						where.ACTIVITY_JOIN_IS_CHECKIN = 1;
					} else {
						where.ACTIVITY_JOIN_IS_CHECKIN = 0;
					}
					break;
			}
		}

		return await ActivityJoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**审核通过   */
	async passActivityJoin(activityJoinId) {
		let where = {
			_id: activityJoinId,
			ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.WAIT, // 待审
			ACTIVITY_JOIN_PAY_STATUS: ['in', [1, 99]] //已支付，无须支付
		}
		let activityJoin = await ActivityJoinModel.getOne(where);
		if (!activityJoin) this.AppError('找不到该报名记录');

		let data = {
			ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.SUCC,
			ACTIVITY_JOIN_IS_CHECKIN: 0, //取消签到 
			ACTIVITY_JOIN_REASON: '',

		}
		await ActivityJoinModel.edit(where, data);

		// 重新统计  
		let activityService = new ActivityService();
		activityService.statActivityJoin(activityJoin.ACTIVITY_JOIN_ACTIVITY_ID);

	}

	/** 未过审/ 取消报名 */
	async cancelActivityJoin(activityJoinId, reason) {
		let where = {
			_id: activityJoinId,
			ACTIVITY_JOIN_STATUS: ['in', [ActivityJoinModel.STATUS.WAIT, ActivityJoinModel.STATUS.SUCC]], //只有成功和待审的能取消
			ACTIVITY_JOIN_PAY_STATUS: ['in', [0, 1, 99]] //只有未支付，支付和无须支付可以取消
		}
		let activityJoin = await ActivityJoinModel.getOne(where);
		if (!activityJoin) this.AppError('找不到该记录');


		let activityService = new ActivityService();

		if (activityJoin.ACTIVITY_JOIN_PAY_STATUS == 99) {
			// 无须支付
			let data = {
				ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.ADMIN_CANCEL,
				ACTIVITY_JOIN_CANCEL_TIME: this._timestamp,
				ACTIVITY_JOIN_REASON: reason
			}
			await ActivityJoinModel.edit(where, data);
		}
		else {
			let tradeNo = activityJoin.ACTIVITY_JOIN_PAY_TRADE_NO;

			if (!await activityService.fixActivityJoinPay(tradeNo, activityJoin.ACTIVITY_JOIN_ACTIVITY_ID)) {
				this.AppError('该报名记录未支付，已取消并删除！ 请刷新页面~');
			}

			const PayService = require('../pay_service.js');
			let payService = new PayService();
			if (!await payService.refundPay(tradeNo, '后台取消报名')) return;

			let data = {
				ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.ADMIN_CANCEL,
				ACTIVITY_JOIN_CANCEL_TIME: this._timestamp,
				ACTIVITY_JOIN_REASON: reason,

				ACTIVITY_JOIN_PAY_STATUS: 8
			}
			await ActivityJoinModel.edit(where, data);
		}

		// 重新统计   
		activityService.statActivityJoin(activityJoin.ACTIVITY_JOIN_ACTIVITY_ID);

	}

	/** 自助签到码 */
	async genActivitySelfCheckinQr(page, activityId) {
		//生成小程序qr buffer
		let cloud = cloudBase.getCloud();

		if (page.startsWith('/projects/')) page = page.replace('/projects/', 'projects/');

		let result = await cloud.openapi.wxacode.getUnlimited({
			scene: activityId,
			width: 280,
			check_path: false,
			env_version: 'release', //trial,develop
			page
		});

		let upload = await cloud.uploadFile({
			cloudPath: 'activity/usercheckin/' + activityId + '.png',
			fileContent: result.buffer,
		});

		if (!upload || !upload.fileID) return;

		return upload.fileID;
	}

	/** 管理员按钮核销 */
	async checkinActivityJoin(activityJoinId, flag) {
		let activityJoin = await ActivityJoinModel.getOne(activityJoinId);

		if (!activityJoin)
			this.AppError('没有该用户的报名记录，核销失败');

		if (activityJoin.ACTIVITY_JOIN_STATUS != ActivityJoinModel.STATUS.SUCC)
			this.AppError('该用户未报名成功，核销失败');


		let data = {
			ACTIVITY_JOIN_IS_CHECKIN: flag,
			ACTIVITY_JOIN_CHECKIN_TIME: this._timestamp,
		};
		await ActivityJoinModel.edit(activityJoinId, data);
	}

	/** 管理员扫码核销 */
	async scanActivityJoin(activityId, code) {
		let where = {
			ACTIVITY_JOIN_ACTIVITY_ID: activityId,
			ACTIVITY_JOIN_CODE: code
		}
		let activityJoin = await ActivityJoinModel.getOne(where);

		if (!activityJoin)
			this.AppError('没有该用户的报名记录，核销失败');

		if (activityJoin.ACTIVITY_JOIN_STATUS != ActivityJoinModel.STATUS.SUCC)
			this.AppError('该用户未报名成功，核销失败');

		if (activityJoin.ACTIVITY_JOIN_IS_CHECKIN == 1)
			this.AppError('该用户已签到/核销，无须重复核销');

		let data = {
			ACTIVITY_JOIN_IS_CHECKIN: 1,
			ACTIVITY_JOIN_CHECKIN_TIME: this._timestamp,
		};
		await ActivityJoinModel.edit(where, data);
	}

	// #####################导出报名数据
	/**获取报名数据 */
	async getActivityJoinDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_ACTIVITY_JOIN_DATA_KEY);
	}

	/**删除报名数据 */
	async deleteActivityJoinDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_ACTIVITY_JOIN_DATA_KEY);
	}

	/**导出报名数据 */
	async exportActivityJoinDataExcel({
		activityId,
		status
	}) {
		// 取得的表单设置
		let activity = await ActivityModel.getOne(activityId, 'ACTIVITY_JOIN_FORMS');
		if (!activity) return;
		let formSet = activity.ACTIVITY_JOIN_FORMS;

		let where = {
			ACTIVITY_JOIN_ACTIVITY_ID: activityId,
		};
		if (status != 999)
			where.ACTIVITY_JOIN_STATUS = status;


		// 计算总数
		let total = await ActivityJoinModel.count(where);

		// 定义存储数据 
		let data = [];

		const options = {
			'!cols': [
				{ column: '序号', wch: 8 },
				{ column: '状态', wch: 18 },
				...dataUtil.getTitleByForm(formSet),
				{ column: '创建时间', wch: 25 },
				{ column: '是否签到', wch: 15 }
			]
		};

		// 标题栏
		let ROW_TITLE = options['!cols'].map((item) => (item.column));
		data.push(ROW_TITLE);

		// 按每次100条导出数据
		let size = 100;
		let page = Math.ceil(total / size);
		let orderBy = {
			'ACTIVITY_JOIN_EDIT_TIME': 'asc'
		}

		let order = 0;
		for (let i = 1; i <= page; i++) {
			let list = await ActivityJoinModel.getList(where, '*', orderBy, i, size, false);
			console.log('[ExportActivityJoin] Now export cnt=' + list.list.length);

			for (let k = 0; k < list.list.length; k++) {
				let node = list.list[k];

				order++;

				// 数据节点
				let arr = [];
				arr.push(order);

				arr.push(ActivityJoinModel.getDesc('STATUS', node.ACTIVITY_JOIN_STATUS));

				// 表单
				for (let k = 0; k < formSet.length; k++) {
					arr.push(dataUtil.getValByForm(node.ACTIVITY_JOIN_FORMS, formSet[k].mark, formSet[k].title));
				}

				// 创建时间
				arr.push(timeUtil.timestamp2Time(node.ACTIVITY_JOIN_ADD_TIME, 'Y-M-D h:m:s'));

				if (node.ACTIVITY_JOIN_STATUS == 1 && node.ACTIVITY_JOIN_IS_CHECKIN == 1) {
					arr.push('已签到')
				} else {
					arr.push('')
				}

				data.push(arr);
			}

		}

		return await exportUtil.exportDataExcel(EXPORT_ACTIVITY_JOIN_DATA_KEY, '活动报名数据', total, data, options);

	}
}

module.exports = AdminActivityService;