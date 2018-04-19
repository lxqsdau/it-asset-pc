/**
 *  自助柜补货
 *  author 刘玄清
 *  2018-2-1
 *  日常 0.1.1
 *  线上 0.0.8
 */

import Button from 'uxcore-button';
import Form from 'uxcore-form';
import Table from 'uxcore-table';
import Dialog from 'uxcore-dialog';
import RadioGroup from 'uxcore-radiogroup';
import moment from 'moment';
import ReplacePeople from 'components/ReplacePeople';
import { http } from '../../lib/http';
import './selfAddGoods.less';

const { Constants } = Table;
const Message = require('uxcore-message'); // 全局提醒
// 本地开发 true
// 线上false
// 导航没有margin
// 内容 内边距20px
const { Item } = RadioGroup;
const {
	InputFormField: Input,
	SelectFormField,
	FormRow: Row,
	TextAreaFormField: TextArea,
} = Form;

// 提示信息
function errorTip(type, msg) {
	Message[type](msg, 3);
}

// 时间格式化
function timeFormat(time) {
	return moment(time).format('YYYY-MM-DD HH:mm:ss');
	// 1注意不传字段时也会返回显示时间，要处理下
	// 2 H 24小时制  h 12小时制
}

// 字符串不足6为，前面补全
function stringFormat(str) {
	const { length } = str;
	if (length < 6) {
		const cha = 6 - length;
		for (let i = 0; i < cha; i += 1) {
			str = '0' + str.toString();
		}
	}
	return str;
}

class SelfAddGoods extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selectFormData: '', // 查询表单值
			createGoodsDialogVisible: false, // 创建补货单弹窗的显示
			dialogRadioValue: 'ou', // 补货单弹窗单选按钮的值
			createErrorVisible: false, // 补货失败弹窗的显示
			createFeedbackInfo: '', // 补货反馈信息
			operatorInput: false, // 是否显示操作人
			accessToken: '', // 获取accessToken
		};
		this.formPreValue = null; // 判断两次的表单值有没有变化
		this.form_create = null;
	}
	componentDidMount() {
		// 调用是否显示操作人
		http.get('/admin/replenish/hiddenOperator.json').then((res) => {
			if (res.hidden) { // 隐藏
				this.setState({
					operatorInput: false,
				});
			} else {
				this.setState({
					operatorInput: true,
					accessToken: res.accessToken,
				});
			}
		});
	}

	// 查询
	selectClick() {
		const me = this;
		const formData = me.form.getValues().values;
		if (window._.isEqual(formData, this.formPreValue)) { // 相等
			this.tableE.fetchData(); // 如果每次都更新数据 会有异常
		} else {
			me.setState({
				selectFormData: formData,
			});
			this.formPreValue = formData;
		}
	}
	// 创建补货单弹窗
	createClick() {
		this.form_create && this.form_create.resetValues(); // 清空表单文本域
		this.setState({
			createGoodsDialogVisible: true,
			dialogRadioValue: 'ou', // 重置按钮
		});
	}

	// 补货单弹窗单选按钮
	dialogRadioChange(value) {
		this.setState({
			dialogRadioValue: value,
		});
	}

	// 创建补货单提交
	submitCreate() {
		const strType = this.state.dialogRadioValue;
		const textArea = this.form_create.getValues().values.create;
		this.setState({
			createFeedbackInfo: '',
		});
		if (!textArea) { // 没有输入补货单
			errorTip('info', '标签不能为空！');
			return;
		}
		const assetCodes = textArea.split('\n').join(',');
		http.post('/admin/replenish/addReplenish.json?assetCodes=' + assetCodes + '&strType=' + strType).then((res) => {
			if (res.hasError) { // 失败
				errorTip('error', res.errors[0].msg, 3);
			} else {
				this.setState({
					createFeedbackInfo: res, // 反馈信息
					createErrorVisible: true, // 显示反馈弹窗
					createGoodsDialogVisible: false, // 隐藏创建弹窗
				});
			}
		});
	}

	// 补货异常
	createError() {
		const { createFeedbackInfo } = this.state;
		const errorTotal = createFeedbackInfo.errSum;
		return (
			<Dialog
				title="补货信息反馈"
				className="create-feedback"
				visible={this.state.createErrorVisible}
				footer={[
					<Button onClick={this.errorDaochu.bind(this, errorTotal)} key="submit" size="small">{errorTotal === 0 ? '确定' : '确认并导出异常详情'}</Button>,
				]}
				onCancel={() => {
					this.setState({
						createErrorVisible: false,
					});
				}}
				width={300}
			>
				<div>成功：{createFeedbackInfo.success}条</div>
				<div>失败：{errorTotal}条</div>
			</Dialog>
		);
	}
	// 异常导出
	errorDaochu(errorTotal) {
		if (errorTotal === 0) { // 没有
			this.setState({
				createErrorVisible: false,
			});
			this.tableE.fetchData();
		} else {
			window.open('/admin/replenish/getResultExcel.json?data=' + JSON.stringify(this.state.createFeedbackInfo));
			this.setState({
				createErrorVisible: false,
			});
		}
	}
	// 撤销补货
	cancelReplenish(rowData, table) {
		Dialog.confirm({
			title: '您确定要撤销补货吗？',
			content: '撤销补货后，资产将存入“调出库房”；\n请您将实物也同步存入“调出库房”。',
			onOk() {
				http.post('/admin/replenish/cancelReplenish.json?id=' + rowData.id).then((res) => {
					if (res.hasError) {
						Message.error(res.errors[0].msg, 3);
					} else {
						Message.success(res.content, 3);
						table.fetchData(); // 更新表格数据
					}
				});
			},
			onCancel() {},
		});
	}

	// 格式化表格数据
	tableBackData(tableData) {
		return {
			...tableData,
			data: tableData.data.map(item => ({
				...item,
				__mode__: (item.replenishStatus === 'CANCEL' || item.replenishStatus === 'REPLENISHED') ? 'CANCEL' : 'view',
				gmtCreated: item.gmtCreated && timeFormat(item.gmtCreated),
				replenishDate: item.replenishDate && timeFormat(item.replenishDate),
				cancelDate: item.cancelDate && timeFormat(item.cancelDate),
				replenishStatus: item.replenishStatus === 'REPLENISHING' ? '补货中' : item.replenishStatus === 'REPLENISHED' ? '补货完成' : item.replenishStatus === 'CANCEL' ? '撤销' : '',
			})),
		};
	}

	render() {
		const me = this;
		const { selectFormData } = this.state;
		// 列配置项
		const columns = [
			{
				dataKey: 'assetCode',
				title: '资产编号', // 表头
				width: 130,
			},
			{
				dataKey: 'resourceCode', // 匹配的字段
				title: '大阿里编号',
				width: 150,
			},
			{
				dataKey: 'assetName',
				title: '资产类目',
				width: 80,
			},
			{
				dataKey: 'featureName',
				title: '特征',
				width: 100,
			},
			{
				dataKey: 'useRemark',
				title: '使用说明',
				width: 80,
			},
			{
				dataKey: 'storePosition',
				title: '调出库房',
				width: 220,
			},
			{
				dataKey: 'cabinetProperty',
				title: '存入的自助柜',
				width: 220,
			},
			{
				dataKey: 'operatorName',
				title: '操作人',
				width: 150,
			},
			{
				dataKey: 'gmtCreated',
				title: '创建时间',
				width: 150,
			},
			{
				dataKey: 'replenishDate',
				title: '存柜时间',
				width: 150,
			},
			{
				dataKey: 'replenishStatus',
				title: '补货状态',
				width: 80,
			},
			{
				dataKey: 'cancelDate',
				title: '撤销时间',
				width: 150,
			},
			{
				dataKey: 'action',
				title: '操作',
				width: 80,
				type: 'action',
				actions: [
					{
						title: '撤销',
						callback: me.cancelReplenish.bind(this),
						mode: Constants.MODE.VIEW,
					},
				],
			},
		];
		const renderProps = {
			height: 650,
			width: 1140,
			fetchUrl: '/admin/replenish/listReplenish.json',
			jsxcolumns: columns,
			showPager: true,
			showPagerTotal: true,
			fetchParams: { // 请求数据参数
				assetCode: selectFormData.assetCodes,
				operator: selectFormData.operator && stringFormat(selectFormData.operator.key),
				status: selectFormData.status === 'all' ? '' : selectFormData.status,
			},
			processData: me.tableBackData.bind(this),
			className: 'table-container',
			doubleClickToEdit: false,
		};
		return (
			<div className="page-selfAddGoods">
				<div className="page-inner">
					<div className="title">
						<span>自助柜补货</span>
					</div>
					<div className="select-area">
						<Form
							ref={(c) => { this.form = c; }}
							className="select-from"
							jsxvalues={{
								status: 'all',
							}}
						>
							<Row>
								<Input allowClear jsxname="assetCodes" jsxlabel="编号查询：" jsxplaceholder="资产编号\大阿里编号\序列号" />
								{this.state.operatorInput ? (
									<SelectFormField
										jsxname="operator"
										allowClear
										jsxlabel="操作人："
										jsxplaceholder=""
										jsxfetchUrl="https://work.alibaba-inc.com/work/xservice/open/api/v1/suggestion/suggestionAt.jsonp"
										dataType="jsonp"
										className="oprater-select"
										beforeFetch={(data) => {
											data.key = data.q;
											data.offset = 0;
											data.size = 8;
											data.accessToken = me.state.accessToken;
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
									/>) : ''}
								<SelectFormField
									jsxname="status"
									jsxlabel="补货状态："
									className="select-status"
									jsxdata={[
										{ value: 'REPLENISHING', text: '补货中' },
										{ value: 'REPLENISHED', text: '完成' },
										{ value: 'CANCEL', text: '撤销' },
										{ value: 'all', text: '全部' },
									]}
								/>
							</Row>
						</Form>
						<Button onClick={me.selectClick.bind(me)} className="select-btn">查 询</Button>
						<Button onClick={me.createClick.bind(me)} className="select-btn-create">创建补货单</Button>
						<Dialog title="创建补货单"
							visible={this.state.createGoodsDialogVisible}
							className="create-dialog"
							onOk={me.submitCreate.bind(me)}
							onCancel={() => {
								this.setState({
									createGoodsDialogVisible: false,
								});
							}}
						>
							<RadioGroup className="radio_select" value={me.state.dialogRadioValue} onChange={me.dialogRadioChange.bind(me)}>
								<Item value="ou" text="大阿里编号" />
								<Item value="assetcode" text="资产编号" />
							</RadioGroup>
							<Form ref={(c) => { this.form_create = c; }} className="dialog_form">
								<TextArea jsxname="create" jsxplaceholder="一个标签占一行，用回车换行" jsxshowLabel={false} />
							</Form>
						</Dialog>
						{this.createError()}
					</div>
					<div className="content-list">
						<Table ref={(c) => { this.tableE = c; }} {...renderProps} />
					</div>
				</div>
			</div>
		);
	}
}

export default SelfAddGoods;

/**
 * 查询 注意表单为空的情况
 * dialog 按钮value改变 可以用自定义footer
 * From jsxvalues 默认值 匹配每个jsxname
 * merge 本地
 * dialog 使用自定义footer 确认取消时间要自己加
 * 表格默认行内编辑
 * 查询每次都可更新数据，如果两次数据一样，只执行更新表格数据；如果不一样则更新state来更显表格数据
 * 下载 window.open(接口)
 * state改变 重新刷新 render ，render所有的都会执行
 * 不管state值两次有没有变化，执行setState都会触发render渲染
 * table 可能是参数两次一样不会调用接口更新数据
 * table默认可双击，进入编辑状态，操作按钮会消失  doubleClickToEdit: false
 * 在daily执行tag
 * tag 自动删除当前分支
 * 先创建一个新分支，git pull origin master
 */
