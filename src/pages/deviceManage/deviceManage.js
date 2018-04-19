/**
 *  设备信息配置
 *  author 刘玄清
 *  2018-2-11
 */

import Form from 'uxcore-form';
import Button from 'uxcore-button';
import Icon from 'uxcore-icon';
import Table from 'uxcore-table';
import Dialog from 'uxcore-dialog';
import Message from 'uxcore-message'; // 全局提醒
import Uploader from 'components/uploader';
import { http } from '../../lib/http';
import './deviceManage.less';

const {
	InputFormField,
	TextAreaFormField,
	SelectFormField,
	NumberInputFormField,
} = Form;
const { TextAreaCount } = TextAreaFormField;
class DeviceManage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showDialog: false,
			dialogTitle: '',
			modelNormal: [], // 型号大类list
			modelDetail: [], // 型号小类list
			categoryType: [], // 所属类别list
			workFlowType: [], // 所属流程list
			fileList: [],
			jsxvalues: {},
			edit: false,
			id: '', // 编辑的数据id
			keyword: '',
			editModelDetailId: '', // 编辑时保存型号小类Id
			editAmpCategoryId: '', // 编辑时保存amp资产类目Id
		};
		this.hasSelect = false; // 是否是有效的搜索
	}

	componentDidMount() {}

	// 关键字查询
	handleSelect() {
		this.hasSelect = true;
		const keyword = this.formSelet.getValues().values.keyword;
		this.setState({
			keyword,
		});
	}

	// 获取型号大类
	obtainModelNormal() {
		http.get('/newemployee/equipment/getModelNormal.json').then((res) => {
			this.setState({
				modelNormal: res.map((list) => ({
					value: list,
					text: list,
				})),
			});
		});
	}

	// 获取型号小类与amp资产类目
	obtainModelDetail() {
		http.get('/newemployee/equipment/GetModelDetail.json').then((res) => {
			this.setState({
				modelDetail: res.map((list) => ({
					value: list.modelDetail + '&' + list.modelDetailId + '*' + list.ampCategory + '&' + list.ampCategoryId,
					text: list.modelDetail,
				})),
			});
		});
	}

	// 获取所属类别
	obtainCategoryType() {
		http.get('/newemployee/equipment/getCategoryType.json?add=true').then((res) => {
			this.setState({
				categoryType: res.map((list) => ({
					value: list.name + '&' + list.id,
					text: list.name,
				})),
			});
		});
	}

	// 获取所属流程
	obtainWorkFlowType() {
		http.get('/newemployee/equipment/getWorkFlowType.json').then((res) => {
			this.setState({
				workFlowType: res.map((list) => ({
					value: list,
					text: list,
				})),
			});
		});
	}

	// 新增
	handleAdd() {
		// 清空表单
		this.setState({
			fileList: [],
			jsxvalues: {
				ampCategory: '',
			},
			edit: false,
		});
		this.form && this.form.resetValues();
		// 获取型号大类
		this.obtainModelNormal();
		// 获取型号小类与amp资产类目
		this.obtainModelDetail();
		// 获取所属类别
		this.obtainCategoryType();
		// 获取所属流程
		this.obtainWorkFlowType();
		this.setState({
			showDialog: true,
			dialogTitle: '设备新增',
		}, () => {
			const inputBtn = document.getElementsByClassName('kuma-upload-picker-visual')[0];
			const imgTip = document.getElementsByClassName('imgTip')[0];
			inputBtn.style.display = 'inline-block';
			imgTip.style.display = 'inline-block';
		});
	}

	// form表单值变化 
	handleFormChange(values) {
		const result = values.modelDetail;
		const edit = this.state.edit;
		if (result && !edit) {
			const ampCategoryValue = result.split('*')[1];
			const ampCategory = ampCategoryValue.split('&')[0];
			this.setState({
				jsxvalues: {
					ampCategory,
				},
			});
		}
	}
	// 图片上传  点击删除这个样执行一次
	handleImgChange(fileList) {
		const inputBtn = document.getElementsByClassName('kuma-upload-picker-visual')[0];
		const imgTip = document.getElementsByClassName('imgTip')[0];
		if (fileList.filter((list) => list.type !== 'delete').length >= 2) { // 最多上传两张	
			inputBtn.style.display = 'none';
			imgTip.style.display = 'none';
		} else {
			inputBtn.style.display = 'inline-block';
			imgTip.style.display = 'inline-block';
		}
		const fileListResult = fileList.map((data) => {
			if (data.__uploaderId) { // 已经上传过的有__uploaderId
				return data;
			} 
			return {
				...data,
				response: {
					data: {
						downloadUrl: '/workflow/common/getFile.json?path=' + data.response.newPath, // 放大图
						previewUrl: '/workflow/common/getFile.json?path=' + data.response.newSmallPath, // 回显图
					},
				},
				newSmallPath: data.response.newSmallPath,
				newPath: data.response.newPath,
			};
		});
		this.setState({
			fileList: fileListResult,
		});
	}
	// 图片过滤掉
	imgUploaderError() {
		Message.error('图片大小不能超过1M', 3);
	}
	// 删除图片
	handleImgDelete(file) {
		http.get('/newemployee/equipment/deleteImg.json?newPath=' + file.newPath + '&newSmallPath=' + file.newSmallPath).then((res) => {
			if (!res.hasError) {
				Message.success(res.content, 2);
			} else {
				Message.error(res.content, 2);
			}
		});
	}

	// 编辑
	async tableEdit(rowData) {
		await this.form && this.form.resetValues();
		await this.setState({
			showDialog: true,
			dialogTitle: '设备编辑',
			edit: true,
			id: rowData.id,
			fileList: [],
		});
		// 获取型号大类
		this.obtainModelNormal();
		// 获取所属类别
		this.obtainCategoryType();
		// 获取所属流程
		this.obtainWorkFlowType();
		// 型号小类不可编辑
		http.get('/newemployee/equipment/getOne.json?id=' + rowData.id).then((res) => {
			const fileList = [{
				newPath: res.bigImgPath1,
				newSmallPath: res.smallImgPath1,
				response: {
					previewUrl: '/workflow/common/getFile.json?path=' + res.smallImgPath1, // 显示的缩略图
					name: '',
					downloadUrl: '/workflow/common/getFile.json?path=' + res.bigImgPath1, // 点击放大的图片
				},
			}];
			if (res.smallImgPath2) {
				fileList.push({
					newPath: res.bigImgPath2,
					newSmallPath: res.smallImgPath2,
					response: {
						previewUrl: '/workflow/common/getFile.json?path=' + res.smallImgPath2,
						name: '',
						downloadUrl: '/workflow/common/getFile.json?path=' + res.bigImgPath2,
					},
				});
			}
			const inputBtn = document.getElementsByClassName('kuma-upload-picker-visual')[0];
			const imgTip = document.getElementsByClassName('imgTip')[0];
			// 如果两张图片，隐藏上传按钮
			if (fileList.length >= 2) {
				inputBtn.style.display = 'none';
				imgTip.style.display = 'none';
			} else {
				inputBtn.style.display = 'inline-block';
				imgTip.style.display = 'inline-block';
			}
			this.setState({
				jsxvalues: {
					modelNormal: res.modelNormal,
					modelDetail: res.modelDetail,
					ampCategory: res.ampCategory,
					categoryType: res.categoryType + '&' + res.categoryTypeId,
					workFlowType: res.workFlowType,
					sortOrder: res.sortOrder,
					configureMsg: res.configureMsg,
				},
				fileList,
				editModelDetailId: res.modelDetailId,
				editAmpCategoryId: res.ampCategoryId,
			});
		});
	}
	// 删除
	tableDelete(rowData) {
		const me = this;
		Dialog.confirm({
			title: '确定删除吗？',
			content: '目标删除后将不可恢复，如有子目标将会被同时删除！',
			onOk() {
				http.get('/newemployee/equipment/deleteEquipmentConfigure.json?id=' + rowData.id).then((res) => {
					if (res.hasError) {
						Message.error(res.content, 3);
					} else {
						Message.success(res.content, 2);
						me.table.fetchData();
					}
				});
			},
			onCancel() {},
		});
	}
	// 对话框确认
	deviceConfirm() {
		const inputValue = this.form.getValues().values;
		const modelNormal = inputValue.modelNormal; // 型号大类
		const modelDetail = inputValue.modelDetail; // 型号小类
		const categoryType = inputValue.categoryType; // 所属类别
		const workFlowType = inputValue.workFlowType; // 所属流程
		const sortOrder = inputValue.sortOrder; // 排序
		const configureMsg = inputValue.configureMsg; // 配置信息
		const imgInputList = this.state.fileList.filter((list) => list.type !== 'delete'); // 上传的图片
		if (!modelNormal) {
			Message.info('型号大类必填！');
			return;
		}
		if (!modelDetail) {
			Message.info('型号小类必填！');
			return;
		}
		if (!categoryType) {
			Message.info('所属类别必填！');
			return;
		}
		if (!workFlowType) {
			Message.info('所属流程必填！');
			return;
		}
		if (!sortOrder) {
			Message.info('排序必填！');
			return;
		}
		if (!configureMsg) {
			Message.info('配置信息必填！');
			return;
		}
		if (configureMsg && configureMsg.length > 50) {
			Message.info('配置信息仅限50个字符！');
			return;
		}
		if (!imgInputList.length) {
			Message.info('请上传图片！');
			return;
		}
		const edit = this.state.edit;
		if (edit) {
			const ampCategoryId = this.state.editAmpCategoryId;
			const modelDetailId = this.state.editModelDetailId;
			const jsonData = {
				id: this.state.id,
				modelNormal,
				categoryType: categoryType.split('&')[0],
				categoryTypeId: categoryType.split('&')[1],
				modelDetailId,
				ampCategoryId,
				workFlowType,
				sortOrder,
				configureMsg,
				bigImgPath1: imgInputList[0].newPath,
				smallImgPath1: imgInputList[0].newSmallPath,
				bigImgPath2: imgInputList[1] ? imgInputList[1].newPath : '',
				smallImgPath2: imgInputList[1] ? imgInputList[1].newSmallPath : '',
			};
			http.get('/newemployee/equipment/addOrUpdateEquipmentConfigure.json?jsonData=' + JSON.stringify(jsonData)).then((res) => {
				if (res.hasError) {
					Message.error(res.content, 3);
				} else {
					Message.success(res.content, 2);
					this.setState({
						showDialog: false,
					});
					this.table.fetchData();
				}
			});
		} else {
			const jsonData = {
				modelNormal,
				modelDetail: modelDetail.split('*')[0].split('&')[0], // 型号小类名称
				modelDetailId: modelDetail.split('*')[0].split('&')[1], // 型号小类Id
				ampCategory: modelDetail.split('*')[1].split('&')[0], // amp资产类目
				ampCategoryId: modelDetail.split('*')[1].split('&')[1], // amp资产类目Id
				categoryType: categoryType.split('&')[0], // 所属类别
				categoryTypeId: categoryType.split('&')[1], // 所属类别Id
				workFlowType,
				sortOrder,
				configureMsg,
				bigImgPath1: imgInputList[0].newPath,
				smallImgPath1: imgInputList[0].newSmallPath,
				bigImgPath2: imgInputList[1] ? imgInputList[1].newPath : '',
				smallImgPath2: imgInputList[1] ? imgInputList[1].newSmallPath : '',
			};
			http.get('/newemployee/equipment/addOrUpdateEquipmentConfigure.json?jsonData=' + JSON.stringify(jsonData)).then((res) => {
				if (res.hasError) {
					Message.error(res.content, 3);
				} else {
					Message.success(res.content, 2);
					this.setState({
						showDialog: false,
					});
					this.table.fetchData();
				}
			});
		}
	}
	// 编辑或新增
	deviceManage() {
		return (
			<Dialog
				title={this.state.dialogTitle}
				className="device-dialog"
				visible={this.state.showDialog}
				onCancel={() => {
					this.setState({
						showDialog: false,
						jsxvalues: null,
					});
				}}
				onOk={this.deviceConfirm.bind(this)}
			>
				<Form
					ref={(c) => { this.form = c; }}
					jsxvalues={this.state.jsxvalues}
					jsxonChange={(values) => { this.handleFormChange(values); }}
				>
					<SelectFormField
						jsxlabel="型号大类" 
						jsxname="modelNormal"
						jsxdata={this.state.modelNormal} 
					/>
					{!this.state.edit ? <SelectFormField 
						jsxlabel="型号小类"
						jsxname="modelDetail"
						jsxdata={this.state.modelDetail} 
					/> : ''}
					{this.state.edit ? <InputFormField
						jsxlabel="型号小类"
						jsxname="modelDetail"
						jsxdisabled
					/> : ''}
					<InputFormField
						jsxlabel="资产类目"
						jsxname="ampCategory"
						jsxdisabled
					/>
					<SelectFormField
						jsxlabel="所属类别"
						jsxname="categoryType"
						jsxdata={this.state.categoryType} 
					/>
					<SelectFormField
						jsxlabel="所属流程"
						jsxname="workFlowType"
						jsxdata={this.state.workFlowType} 
					/>
					<NumberInputFormField jsxname="sortOrder" jsxlabel="排序" />
					<TextAreaFormField jsxname="configureMsg" 
						jsxlabel="配置信息"
						jsxplaceholder="仅限50个字符"
						jsxrules={[
							{ validator(value) { return value ? value.length <= 50 : true; }, errMsg: '仅限50个字符' },
						]}
					>
						<TextAreaCount total={50} />
					</TextAreaFormField>
				</Form>
				<div className="imgUploader">
					<div className="imgLabel">图片</div>
					<Uploader
						isOnlyImg
						isVisual
						sizeLimit="1mb"
						fileList={this.state.fileList}
						accept="jpg,jpeg,png,gif,webp,bmp"
						name="assetUploadFile"
						url="/newemployee/equipment/upLoadImg.json"
						onCancel={this.handleImgDelete.bind(this)}
						onChange={this.handleImgChange.bind(this)}
						onqueuefilefiltered={this.imgUploaderError}
					/>
					<div className="imgTip">建议尺寸500 x 500px<p>图片大小不超过1M</p></div>
				</div>
			</Dialog>
		);
	}
	// table 请求之前
	tableBeforeFetch(data) {
		if (this.hasSelect) { // 查询返回第一页的数据
			data.currentPage = 1;
		}
		return data;
	}

	// 表格返回数据处理
	tableBackData(tableData) {
		this.hasSelect = false; // 数据返回后恢复为没有查询状态
		return tableData;
	}

	render() {
		const me = this;
		const columns = [
			{
				dataKey: 'modelNormal',
				title: '型号大类',
				width: 165,
			},
			{
				dataKey: 'modelDetail',
				title: '型号小类',
				width: 165,
			},
			{
				dataKey: 'ampCategory',
				title: '资产类目',
				width: 165,
			},
			{
				dataKey: 'categoryType',
				title: '所属类别',
				width: 100,
			},
			{
				dataKey: 'workFlowType',
				title: '所属流程',
				width: 100,
			},
			{
				dataKey: 'sortOrder',
				title: '排序',
				width: 100,
			},
			{
				dataKey: 'configureMsg',
				title: '配置信息',
				width: 195,
			},
			{
				dataKey: 'action',
				title: '操作',
				width: 150,
				type: 'action',
				actions: [
					{
						title: '编辑',
						callback: me.tableEdit.bind(this),
					},
					{
						title: '删除',
						callback: me.tableDelete.bind(this),
					},
				],
			},
		];
		const renderTable = {
			doubleClickToEdit: false,
			className: 'table-container',
			fetchUrl: '/newemployee/equipment/listAll.json',
			jsxcolumns: columns,
			beforeFetch: me.tableBeforeFetch.bind(me),
			fetchParams: {
				keyword: me.state.keyword,
			},
			processData: me.tableBackData.bind(this),
		};
		return (
			<div className="page-deviceManage">
				<div className="page-inner">

					<div className="title">
						<span>领用/借用设备维护</span>
					</div>

					<div className="select-area">
						<Form
							ref={(c) => { this.formSelet = c; }}
							className="select-from"
						>
							<InputFormField jsxname="keyword" jsxlabel="关键字查询：" jsxplaceholder="" />
						</Form>
						<Button className="select-btn" onClick={me.handleSelect.bind(me)}><Icon name="sousuo" /></Button>
						<div className="space" />
						<Button type="outline" className="addBtn" onClick={me.handleAdd.bind(me)}>新增</Button>
					</div>

					<div className="table-box">
						<Table ref={(c) => { this.table = c; }} {...renderTable} />
					</div>

					{this.deviceManage()}

				</div>
			</div>
		);
	}
}
// 下拉列表显示黑色 和value对应
// 编辑和新增是否用一个
export default DeviceManage;
