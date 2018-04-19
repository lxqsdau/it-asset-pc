/**
 * 第一步：选择更换设备
 * 1.0.3
 */
import moment from 'moment';
import Dialog from 'uxcore-dialog';
import Button from 'uxcore-button';
import Table from 'uxcore-table';
import RadioGroup from 'uxcore-radiogroup';
import Icon from 'uxcore-icon';
import Message from 'uxcore-message';
import Pagination from 'uxcore-pagination';
import Form from 'uxcore-form';
import CheckboxGroup from 'uxcore-checkbox-group';
import ReplacePeople from 'components/ReplacePeople';
import { http } from '../../lib/http';
import AssetDescribe from './assetDescribe';
import './changeSelectAsset.less';

const { SelectFormField, SearchFormField } = Form;
const { Item } = CheckboxGroup;
const ItemRadio = RadioGroup.Item;
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
			categoryIdString: list.categoryIdString, // 获取资产图片的id
			id: list.id,
			user: list.user,
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
		resourceId: list.id + '*' + list.idString, // id
		idString: list.idString,
		statusDetail: list.statusDetail,
	}));
}
class ChangeSelectAsset extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			checkboxValue: '', // 代理人激活按钮
			replaceInputDisabled: true, // 代理人选择框状态
			hiddenLoading: false, // 显示loading
			assetData: [], // 资产列表数据
			totalcount: '', // 一共多少条数据
			currentPage: '', // 当前页
			changeTypeVisible: false, // 选择更换方式弹窗
			returnTypeData: [], // 归还方式单选列表
			changeTypeRadioValue: '', //
			resourceId: '', // 选择需要更换的资产的id
			principleWorkId: '', // 代理人
		};
		this.checkboxChange = this.checkboxChange.bind(this); // 激活按钮
		this.handleReplaceSelect = this.handleReplaceSelect.bind(this); // 选择代理人
		this.search = this.search.bind(this); // 搜索
		this.pageChange = this.pageChange.bind(this); // 页码改变
		this.handleTypeChange = this.handleTypeChange.bind(this); // 选择更换方式单选
		this.handleNextStep = this.handleNextStep.bind(this); // 弹窗下一步
	}
	componentDidMount() {
		// 判断是否有更换流程
		http.get('/workflow/common/isInProcess.json?workflowType=Change').then((res) => {
			if (res) { // 有，弹出弹窗
				Dialog.error({
					htmlClassName: 'workflowType',
					content: <span>亲，您已有同类流程在处理了哦，同类流程只能提交一次。如需更改需求请在<a href="/workflow/task/mysubmit.htm">任务中心</a>撤销之前的流程后重新提交！</span>,
					onOk() {
						window.location.href = '/workflow/myassets/index';
					},
					onCancel() {
						window.location.href = '/workflow/myassets/index';
					},
				});
			} else {
				// 获取名下资产
				this.requestAsset();
			}
		});
	}
	// 代理人激活框
	checkboxChange(value) {
		if (value.length === 2) { // 选中
			this.setState({
				checkboxValue: value,
				replaceInputDisabled: false,
			});
		} else {
			// 判断有没有选人，有--> 清空，触发数据
			// 没有--> 不触发数据
			const replacePerson = this.form_replace_person.getValues().values.replacePerson;
			if (replacePerson) { // 有人
				this.form_replace_person.resetValues(); // 清数据
				const searchContent = this.form_select_Asset.getValues().values.search_content;
				this.requestAsset(1, searchContent && searchContent.main, '');
			}
			this.setState({
				checkboxValue: value,
				replaceInputDisabled: true,
			});
		}
	}
	// 代理人选择，选了人后再去请求数据
	handleReplaceSelect(value) {
		const me = this;
		this.setState({
			principleWorkId: value.replacePerson.key.padStart(6, '0'),
		});
		http.get('/workflow/common/isInProcess.json?workflowType=Change&userId=' + value.replacePerson.key.padStart(6, '0')).then((res) => {
			if (res) { // 有
				Dialog.error({
					content: '当前代理人已有同类流程在处理，不能选择当前代理人。',
					onOk() {
						me.form_replace_person.resetValues(); // 清数据
					},
					onCancel() {
						me.form_replace_person.resetValues(); // 清数据
					},
				});
			} else {
				const searchContent = me.form_select_Asset.getValues().values.search_content;
				me.requestAsset(1, searchContent && searchContent.main, value.replacePerson.key.padStart(6, '0'));
			}
		});
	}
	
	// 获取名下资产(表格数据)，函数参数默认值
	requestAsset(page = 1, searchContent = '', workId = '') {
		this.setState({
			hiddenLoading: false,
		});
		http({
			method: 'POST',
			url: '/workflow/event/queryPersonAssets.json',
			data: {
				page,
				search_content: searchContent,
				// work_id: workId,
				isPagination: true,
				is_category_other: false,
				is_use_mode_other: false,
				'use_mode[]': 1,
				'categorys[]': '100201301401000101',
			},
			transformRequest: [(data) => {
				let ret = '';
				for (const it in data) {
					ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&';
				}
				ret += encodeURIComponent('categorys[]') + '=100201301401000102&' + encodeURIComponent('categorys[]') + '=100201301401000106&';
				if (workId) {
					ret += '&work_id=' + workId;
				}
				return ret;
			}],
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		}).then((res) => {
			this.setState({
				assetData: handleTableData(res.itemcontext),
				totalcount: res.totalcount,
				currentPage: res.page,
				hiddenLoading: true,
			});
		});
	}
	// 搜索
	search() {
		const searchContent = this.form_select_Asset.getValues().values.search_content;
		const replacePerson = this.form_replace_person.getValues().values.replacePerson;
		searchContent && this.requestAsset(1, searchContent.main, replacePerson ? replacePerson.key.padStart(6, '0') : '');
	}
	// 更换按钮
	handleAssetChange(rowData) {
		http.get('/workflow/change/getReturnType.json', {
			params: {
				resourceId: rowData.resourceId.split('*')[1],
				useMonths: rowData.useCondition.usedMonths,
			},
		}).then((res) => {
			if (res.hasError) {
				Message.error(res.content, 3);
			} else {
				// 弹出更换方式
				this.setState({
					returnTypeData: res,
					changeTypeVisible: true,
					resourceId: rowData.resourceId,
					changeTypeRadioValue: '', // 清空
				});
			}
		});
	}
	// 页码改变
	pageChange(page) {
		const searchContent = this.form_select_Asset.getValues().values.search_content;
		const replacePerson = this.form_replace_person.getValues().values.replacePerson;
		this.requestAsset(page, searchContent && searchContent.main, replacePerson ? replacePerson.key.padStart(6, '0') : '');
	}
	// 更换方式
	handleTypeChange(value) {
		this.setState({
			changeTypeRadioValue: value,
		});
	}
	// 弹窗下一步
	handleNextStep() {
		const radioValue = this.state.changeTypeRadioValue;
		if (!radioValue) {
			Message.error('请选择归还方式！', 3);
			return;
		}
		const principleWorkId = this.state.principleWorkId;
		const returnType = radioValue.split('*')[0];
		const needAttchs = radioValue.split('*')[2] === 'true' ? 1 : 0;
		const resourceIdState = this.state.resourceId.split('*');
		// const resourceId = returnType === 'direct' ? resourceIdState[1] : resourceIdState[0];
		const resourceId = resourceIdState[1];
		const returnTypeName = radioValue.split('*')[3];
		const href = '/workflow/change/changeRequest?resourceId=' + resourceId + '&returnType=' + returnType + '&needAttchs=' + needAttchs + '&userId=' + principleWorkId + '&returnTypeName=' + returnTypeName + '&xxx=' + this.state.resourceId;
		window.location.href = href;
	}
	render() {
		const columns = [
			{
				dataKey: 'assetDescribe',
				title: '资源描述',
				width: 299,
				render: (data) => (<AssetDescribe data={data} />),
			},
			{
				dataKey: 'assetLabel',
				title: '资源标签',
				width: 265,
				message: <span>大阿里编号：号码为<font style={{ color: 'red' }}>TD</font>开头的标签。<br />资产标签：号码为<font style={{ color: 'red' }}>T50</font>或<font style={{ color: 'red' }}>B50</font>等等开头的标签。<br />电脑上贴的标签号码只要与前面2个中的其中1个对的上就可以了。</span>,
				render: (data) => (<AssetLabel data={data} />),
			},
			{
				dataKey: 'useCondition',
				title: '使用情况',
				width: 185,
				render: (data) => (<AssetUseCondation data={data} />),
			},
			{
				dataKey: 'action1',
				title: '操作',
				width: 112,
				type: 'action',
				actions: [
					{
						title: '更换',
						render: (title, rowData) => {
							if (rowData.workFlowType === 'PROC-BF6665B1-C6YYU5XQFQB6P795DQMX1-5NGQYW7I-3') {
								return <div onClick={() => { window.open('/workflow/task/viewTask.do?procInsId=' + rowData.instanceId, '_blank'); }} className="workFlowName">{rowData.workFlowName}</div>;
							}
							return <span onClick={() => { this.handleAssetChange(rowData); }} className="changeBtn">{title}</span>;
						},
					},
				],
			},
		];
		const renderTable = {
			jsxdata: { data: this.state.assetData },
			jsxcolumns: columns,
			doubleClickToEdit: false,
			height: 575,
		};
		return (
			<div className="page-change1">
				<div className="change-title">
					<span>资产更换</span>
				</div>
				<div className="tip">
					<Icon name="jinggao-full" className="icon" />
					<div className="important-tip">重要提示：</div>
					<p>1. 工作文档禁止存储在个人移动存储设备（如U盘、个人移动硬盘、私人电脑等）。</p>
					<p>2. 若因电脑更换/维修等原因，须数据迁移，请到您所在办公区IT服务台，借专用加密硬盘， 在IT同学陪同下现场进行操作。</p>
					<p>3. 若您所在区域尚未配备专用加密硬盘，请点击：移动存储使用报备，进行报备审批通过后，方可 使用个人存储设备进行文档转移。</p>
					<p>注意：在进行线上报备时，请确保填写的拷贝发生时间与实际拷贝时间一致，否则报备无效。</p>
				</div>
				<div className="replace-box">
					<div className="top">
						<CheckboxGroup onChange={this.checkboxChange} value={this.state.checkboxValue}>
							<Item text="代他人申请" value="replace" />
						</CheckboxGroup>
						<div className="replace-tip">*主管可代直接下属申请；直接上级主管相同的员工可相互代理</div>
					</div>
					<div className="bottom">
						<Form
							ref={(c) => { this.form_replace_person = c; }}
							jsxonChange={this.handleReplaceSelect}
						>
							<SelectFormField
								jsxdisabled={this.state.replaceInputDisabled}
								jsxplaceholder="选择代领人"
								jsxname="replacePerson"
								jsxfetchUrl="https://work.alibaba-inc.com/work/xservice/open/api/v1/suggestion/suggestionAt.jsonp"
								dataType="jsonp"
								className="replace-select"
								beforeFetch={(data) => {
									data.key = data.q;
									data.offset = 0;
									data.size = 8;
									data.accessToken = 'A7d8b411a-d06b-4b7a-865e-4e8b738bb703C';
									return data;
								}}
								afterFetch={(obj) => {
									let data = null;
									data = obj.userList.map(item => ({
										text: <ReplacePeople userList={item} />,
										value: item.emplid, // 返回数据 key:
									}));
									return data;
								}}
							/>
						</Form>
					</div>
				</div>
				<div className="select-asset">
					<div className="font">选择需要更换的设备</div>
					<div className="select-box">
						<div className="select-form-label">搜索</div>
						<Form ref={(c) => { this.form_select_Asset = c; }}>
							<SearchFormField
								jsxname="search_content"
								tidy
								placeholder="资产编号/大阿里编号/序列号"
								onIconClick={this.search}
							/>
						</Form>
					</div>
				</div>
				<div className="table-wrapper">
					<Table ref={(c) => { this.table = c; }} {...renderTable} />
					{this.state.hiddenLoading ? '' : <div className="loading-box">
						<img alt="" src="https://img.alicdn.com/tfs/TB132EFhntYBeNjy1XdXXXXyVXa-64-64.gif" />
					</div>}
				</div>
				<div className="page-wrapper">
					<Pagination onChange={this.pageChange} total={this.state.totalcount} current={this.state.currentPage} showTotal pageSize={5} />
				</div>
				{/* 选择归还方式 */}
				<Dialog title="选择归还方式"
					className="changeType"
					visible={this.state.changeTypeVisible}
					onCancel={() => {
						this.setState({
							changeTypeVisible: false,
						});
					}}
					footer={[<Button key="back" 
						onClick={() => {
							this.setState({
								changeTypeVisible: false,
							}); 
						}}
						type="secondary"
					>取 消</Button>,
					<Button key="submit" onClick={this.handleNextStep}>下一步</Button>,
					]}
				>
					<RadioGroup value={this.state.changeTypeRadioValue} onChange={this.handleTypeChange}>
						{this.state.returnTypeData.map((list, index) => (
							<ItemRadio value={list.returnType + '*' + index + '*' + list.needAttchs + '*' + list.name} text={<span dangerouslySetInnerHTML={{ __html: (list.name + (list.tip || '')) }} />} disabled={!list.choose} />
						))}
					</RadioGroup>
				</Dialog>
			</div>
		);
	}
}

export default ChangeSelectAsset;
// list.name + (list.tip || '')
