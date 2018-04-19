
/**
 * 申请人任务单详情
 * 1.0.2  
 */
import moment from 'moment';
import Table from 'uxcore-table';
import Button from 'uxcore-button';
import Dialog from 'uxcore-dialog';
import _ from 'lodash';
import Message from 'uxcore-message';
import ResultImg from './resultImg';
import util from './util';
import { http } from '../../lib/http';
import PeoplePop from './peoplePop';
import AssetDescribe from './assetDescribe';
import './changeViewTask.less';

const { parseURL } = util;
// 资源标签
const AssetLabel = (props) => (
	<div className="assetLabel-wrapper">
		<p>大阿里编号：{props.data.ouResourceCode}</p>
		<p>资&nbsp;产&nbsp;编&nbsp;号：{props.data.resourceCode}</p>
		<p>序&nbsp;&nbsp;&nbsp; 列&nbsp;&nbsp; 号：{props.data.sn}</p>
	</div>
);
// 使用情况
const AssetUseCondation = (props) => (
	<div className="assetLabel-condation">
		<p>启用日期：{props.data.startDate ? moment(props.data.startDate).format('YYYY-MM-DD') : ''}</p>
		<p>已使用月：{props.data.usedMonths}</p>
		<p>使用说明：{props.data.useRemarkName}</p>
	</div>
);
// 处理列表返回的数据
function handleTableData(data) {
	return data.map((list) => ({
		assetDescribe: {
			categoryName: list.categoryName, // 名称
			feature: list.feature, // 特征
			userName: list.userName, // 使用人
			categoryIdString: list.categoryId, // 获取资产图片的id
			id: list.id,
			user: list.user,
			resourceId: list.resourceId,
		},
		assetLabel: {
			ouResourceCode: list.ouResourceCode, // 大阿里编号
			resourceCode: list.resourceCode, // 资产编号
			sn: list.sn, // 序列号
		},
		useCondition: {
			startDate: list.startDate, // 启用日期
			usedMonths: list.usedMonths, // 已使用月
			useRemarkName: list.useRemarkName, // 使用说明
		},
		workFlowName: list.workFlowName,
		workFlowType: list.workFlowType,
		instanceId: list.instanceId,
		resourceId: list.id,
	}));
}

function arrTransformLogs(arr) {
	const newData = Object.keys(arr[0]).map((key) => ({
		activityName: arr[0][key],
	}));
	['operatorId', 'action', 'gmtCreated', 'audit'].forEach((value, index) => {
		Object.keys(arr[index + 1]).forEach((key) => { // key 3,4
			newData[key - 1][value] = arr[index + 1][key];
		});
	});
	return newData;
}

const columns = [
	{
		dataKey: 'jsxid',
		title: '流程',
		width: 100,
		render: id => id + 1,
	},
	{
		dataKey: 'activityName',
		title: '审批节点',
		width: 200,
	},
	{
		dataKey: 'operatorId', // 值不能是对象
		title: '审批人（花名）',
		width: 200,
		render: item => <PeoplePop className="step-person" peopleIcon person={item} />, //
	},
	{
		dataKey: 'action',
		title: '审批结果',
		width: 200,
		render: item => <PeoplePop className="step-person" peopleIcon person={item} />,
	},
	{
		dataKey: 'gmtCreated',
		title: '审批时间',
		width: 200,
		render: item => item ? moment(item).format('YYYY-MM-DD HH:mm:ss') : '', // 注意：时间为空时，返回空，有时间值转化。moment为空也会返回个时间
	},
	{
		dataKey: 'audit',
		title: '审批意见',
		width: 200,
	},
];

const confirm = Dialog.confirm;

class ChangeViewTask extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			headerInfo: {}, // 头部信息
			auditList: [], // 审批流程
			stepIndex: 0, // 到哪个节点了
			assocList: [], // 资产领用明细
			wfRequest: {}, //
			procInsId: '',
			isCancel: false, // 是否可撤销 true 显示撤销
			fileList: [],
			stepsData: [],
			loading: true,
			isReplace: true,
			responsibility: '', // 责任人
			viewResult: '', // 审批结果
			assetData: [], // 资产列表数据
		};
		this.cancelTask = this.cancelTask.bind(this);
	}
	componentDidMount() {
		const url = window.location.href;
		const params = parseURL(url).params;
		this.setState({
			procInsId: params.procInsId,
		});
		http.get('/workflow/task/getBillData.json?procInsId=' + params.procInsId + '&key=' + params.key).then((res) => {
			this.handleData(res);
		});
		
		// 是否显示报销
		http.get('/workflow/task/canCancel.json?procInsId=' + params.procInsId).then((res) => {
			this.setState({
				isCancel: res.cancel,
			});
		});
	}
	// 根据工号获取人
	requestApplicant(workNo) {
		return http.get('/workflow/myassets/nikeName.json?workNo=' + workNo);
	}
	
	// 处理数据
	handleData(response) {
		this.requestApplicant(response.wfRequest.applicantWorkId).then((res) => {
			// 返回数据处理
			const result = _.cloneDeep(arrTransformLogs(response.auditList));
			const resultData = [];
			resultData.showAwait = false;
			let readyOperatorId;
			const hebingData = ['资产准备', 'armory审批', '蚂蚁安全审批'];
			resultData.push(result[0]);
			for (let i = 1, length = result.length; i < length; i += 1) {
				if (result[i].activityName === '等待领用(自助柜)') {
					result[i].operatorId = result[0].operatorId;
				}
				if (!result[i].activityName && result[i].operatorId[0] === 'system') {
					continue;
				}
				// if (result[i].activityName === '资产发放') { // 不能在这儿改变，资产发放在前，取不到readyOperatorId
				// 	result[i].operatorId = readyOperatorId;
				// }
				if (result[i].activityName === '资产准备(自助柜)') {
					result[i].operatorId = ['资产小助手'];
				}
				if (result[i].operatorId[0] === 'V00_WORKER_voc_asset' && result[i].activityName !== '等待领用(自助柜)') {
					result[i].operatorId = ['资产小助手'];
				}
				if (result[i].activityName === '资产准备' && result[i].action) {
					readyOperatorId = result[i].operatorId;
				}
				// 等待领用只能显示一个，且资产准备有审批结果才显示
				if (result[i].activityName === '资产准备' && result[i].action) { // 资产准备有审批结果，可插入等待领用
					resultData.showAwait = true; // 可显示等待领用
				}
				if (result[i].activityName === resultData[resultData.length - 1].activityName && (hebingData.indexOf(result[i].activityName) !== -1)) { // 相同 合并 operatorId
					resultData[resultData.length - 1].operatorId.push(result[i].operatorId[0]);
				} else { // 不同直接插入
					resultData.push(result[i]);
				}
				if (result[i].action === '否决') {
					break;
				}
			}
			// 转交放到审批结果后
			const zhuanjaiData = _.cloneDeep(resultData);
			const resultX = [];
			resultX.push(zhuanjaiData[0]);
			for (let j = 1, length = zhuanjaiData.length; j < length; j += 1) {
				if (zhuanjaiData[j].hasZhuan) { // 转交已经被放置到上个节点了
					continue; // 不插入
				}
				// 资产准备下面有转交节点，执行放到审批结果后面
				if (zhuanjaiData[j + 1] && (zhuanjaiData[j + 1].action === '转交' || zhuanjaiData[j + 1].activityName === '转交') && zhuanjaiData[j].activityName === '资产准备') {
					zhuanjaiData[j].action += '**' + zhuanjaiData[j + 1].operatorId;
					zhuanjaiData[j + 1].hasZhuan = true;
				} 
				resultX.push(zhuanjaiData[j]);
			}

			/**
			 * 四、资产发放放最后
			 */
			const shenpiDone = resultX.filter((list) => list.activityName === '资产发放');
			if (shenpiDone.length) {
				shenpiDone[0].operatorId = readyOperatorId; // 因为资产发放不一定在最后，取到资产准备的人后执行
				resultX.splice(resultX.indexOf(shenpiDone[0]), 1);
				resultX.push(shenpiDone[0]);
			}
			/**
			 * 六、判断是否是代申请
			 */
			const startPerson = resultData[0].operatorId[0] && result[0].operatorId[0].split(',')[1];
			const isReplace = res.workNo === startPerson; // false 是代理人
			
			this.setState({
				loading: false,
				headerInfo: {
					...response.bill,
					creator: res.nikeName + ',' + res.workNo,
				},
				responsibility: isReplace ? res.nikeName + ',' + res.workNo : resultX[0].operatorId,
				isReplace,
				assocList: response.wfRequest.items.filter((item) => !item.returnType),
				wfRequest: response.wfRequest,
				fileList: response.fileList || [],
				auditList: resultX,
				viewResult: response.bill.status,
				assetData: handleTableData([response.detailMap]),
			});
		});
	}
	// 撤销
	cancelTask() {
		const me = this;
		confirm({
			title: '确认要撤销吗？',
			onOk() {
				http.get('/workflow/audit/cancel.json?procInsId=' + me.state.procInsId).then((res) => {
					if (!res.hasError) {
						Message.success('撤销成功！');
						window.location.href = '/workflow/task/mysubmit.htm';
					} else {
						Message.error(res.errors[0].msg, 3);
					}
				});
			},
		});
	}
	render() {
		const assetColumns = [
			{
				dataKey: 'equipmentConfigureId',
				title: '资产名称',
				width: 200,
			},
			{
				dataKey: 'requestAmount',
				title: '申请数量',
				width: 200,
			},
			{
				dataKey: 'assocQty',
				title: '已分配数量',
				width: 200,
			},
			{
				dataKey: 'creator',
				title: '责任人',
				width: 200,
				render: () => <PeoplePop person={this.state.responsibility} />,
			},
		];
		const { 
			headerInfo, 
			auditList, 
			wfRequest,
			assocList,
			fileList,
		} = this.state;
		const renderAuditListProps = {
			jsxdata: { data: auditList },
			jsxcolumns: columns,
		};
		const renderAssetProps = {
			jsxdata: { data: assocList },
			jsxcolumns: assetColumns,
			width: 850,
		};
		const columnsAssetData = [
			{
				dataKey: 'assetDescribe',
				title: '资源描述',
				width: 399,
				render: (data) => (<AssetDescribe data={data} />),
			},
			{
				dataKey: 'assetLabel',
				title: '资源标签',
				width: 365,
				render: (data) => (<AssetLabel data={data} />),
			},
			{
				dataKey: 'useCondition',
				title: '使用情况',
				width: 185,
				render: (data) => (<AssetUseCondation data={data} />),
			},
		];
		const renderTable = {
			jsxdata: { data: this.state.assetData },
			jsxcolumns: columnsAssetData,
			doubleClickToEdit: false,
		};
		return (
			<div className="page-changeViewTask">
				{this.state.loading ? <div className="mask">
					<img className="mask-icon" alt="" src="https://aliwork.alicdn.com/tps/TB1fPYRMXXXXXcdXFXXXXXXXXXX-480-238.svg" />
				</div> : ''}
				<div className="task-title">
					<span>{headerInfo.title}<ResultImg result={this.state.viewResult} /></span>
				</div>
				<div className="task-info">
					<span className="content">申请单号：{wfRequest.code}</span>
					<span className="content">申请人：<PeoplePop person={headerInfo.creator} />{this.state.isReplace ? '' : '代'} {!this.state.isReplace ? <PeoplePop showLine person={auditList[0] && auditList[0].operatorId} /> : ''}{!this.state.isReplace ? '申请' : ''}</span>
					<span>申请日期：{wfRequest.gmtCreated && moment(wfRequest.gmtCreated).format('YYYY-MM-DD HH:mm:ss')}</span>
				</div>
				
				<div className="task-progress">
					<div className="header header-progress">审批进度</div>
					<div className="step">
						<div className="step-info">
							<Table {...renderAuditListProps} />
						</div>
					</div>
				</div>
				<div className="asset-info">
					<div className="header header-asset">更换资产申请明细</div>
					<div className="asset">
						<Table {...renderTable} />
					</div>
				</div>
				<div className="asset-info">
					<div className="header header-asset">领用资产明细</div>
					<div className="asset">
						<Table {...renderAssetProps} />
					</div>
				</div>
				<div className="apply-reason">
					<div className="header header-reason">申请原因</div>
					<div className="reason">
						{wfRequest.reason}
						{fileList.length ? 
							<div>共 {fileList.length} 个附件（{fileList.map((file) => (<span>
								<a download href={'/workflow/common/GetAnyFile.json?path=' + file.path}><img className="downloadImg" alt="" src="https://img.alicdn.com/tfs/TB1v.g7c4rI8KJjy0FpXXb5hVXa-48-48.png" /></a>
								<span>{file.name}</span>
							</span>))} ）</div> 
							: ''
						}
					</div>
				</div>
				<div className="get-address">
					<div className="header header-address">领用地点</div>	
					<div className="address">
						{wfRequest.storeLocationMappingId}
					</div>
				</div>
				{this.state.isCancel ? <div className="cancel">
					<Button className="cancelBtn" onClick={this.cancelTask}>撤 回</Button>
				</div> : ''}
			</div>
		);
	}
}
//  
export default ChangeViewTask;

