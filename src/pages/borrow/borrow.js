import Icon from 'uxcore-icon';
import Dialog from 'uxcore-dialog';
import Message from 'uxcore-message';
import Select from 'uxcore-select2';
import Button from 'uxcore-button';
import moment from 'moment';
import Form from 'uxcore-form';
import Table from 'uxcore-table';
import classnames from 'classnames';
import CheckboxGroup from 'uxcore-checkbox-group';
import ReplacePeople from 'components/ReplacePeople';
import Tabs from 'components/Tabs';
import Uploader from 'components/uploader';
import { http } from '../../lib/http';
import AssetDescribe from './assetDescribe';
import XujieSelect from './xujieSelect';
import Asset from './asset';
import { objToArray, locationObjToArray } from '../../lib/util';
import './borrow.less';

const TabPane = Tabs.TabPane;
const { Item } = CheckboxGroup;
const Option = Select.Option;
const {
	SelectFormField, 
	DateFormField, 
	TextAreaFormField, 
	SearchFormField,
} = Form;
const { TextAreaCount } = TextAreaFormField;
function sum(arr) {
	let result = 0;
	for (let i = 0; i < arr.length; i++) {
		result += arr[i];
	}
	return result;
}
// 处理续借列表返回的数据
function handleTableData(data) {
	return data.map((list) => ({
		assetDescribe: {
			categoryName: list.categoryName, // 名称
			feature: list.feature, // 特征
			userName: list.userName, // 使用人
			categoryIdString: list.categoryIdString, // 获取资产图片的id
			id: list.id,
			user: list.user,
			reBorrowType: list.reBorrowType,
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
		reBorrowType: list.reBorrowType,
		requestType: list.reBorrowType === '日常临时借用' ? 'temp' : list.reBorrowType === '项目借用' ? 'project' : 'special',
		reborrowCount: list.reborrowCount,
		idString: list.idString,
		// jsxchecked: true, // 这一列被选中
	}));
}
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
class Borrow extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			tabActive: '1',
			checkboxValue: '', // 代理人激活按钮
			replaceInputDisabled: true, // 代理人选择框状态
			citys: [], // 获取的城市
			selectCityCode: '', // 选择的城市
			parks: [], // 获取的园区
			selectParkCode: '', // 选择的园区
			locations: [], // 获取的地点
			selectLocationText: '', // 选择的地点
			locationId: '', // 选择的地点ID
			storeHouseId: '', // 选择的库房ID
			resEquipmentInfo: [], // 请求的资产列表
			categoryType: [], // 获取的所属类别
			categoryTypeId: '', // 哪一个Tab
			selectedAsset: [], // 选择的设备
			m4InfoDialog: false, // 资产box提示信息
			noDevice: false, // loading
			fileList: [], // 附件
			sureDisabled: false, // 提交申请
			borrowDay: '', // 最长可借用多少天
			resEquipmentXujie: [], // 资产续借列表
			selectXujie: [], // 已选续借
			fileListXujie: [],
			sureDisabledXujie: false,
			isShowXujie: true,
			is11: false, // 借用类型是不是双11
		};
		this.tabTranslateClick1 = this.tabTranslateClick1.bind(this);
		this.tabTranslateClick2 = this.tabTranslateClick2.bind(this);
		this.checkboxChange = this.checkboxChange.bind(this); // 激活按钮
		this.handleReplaceSelect = this.handleReplaceSelect.bind(this); // 选择代理人
		this.handleCityChange = this.handleCityChange.bind(this);
		this.handleParkChange = this.handleParkChange.bind(this);
		this.handleLocationChange = this.handleLocationChange.bind(this);
		this.obtainLocationId = this.obtainLocationId.bind(this);
		this.tabClick = this.tabClick.bind(this);
		this.radioOrCheckChange = this.radioOrCheckChange.bind(this);
		this.cancelAsset = this.cancelAsset.bind(this);
		this.add = this.add.bind(this);
		this.decrease = this.decrease.bind(this);
		this.borrowTypeChange = this.borrowTypeChange.bind(this);
		this.uploaderFileChange = this.uploaderFileChange.bind(this);
		this.submitSelect = this.submitSelect.bind(this);

		this.search = this.search.bind(this); // 搜索
		this.cancelXujie = this.cancelXujie.bind(this);
		this.uploaderFileChangeXujie = this.uploaderFileChangeXujie.bind(this);
		this.submitSelectXujie = this.submitSelectXujie.bind(this);
		this.xujieDayChange = this.xujieDayChange.bind(this);
		this.tabXujieHasClick = false;
		this.xujieUi = []; // 保存续借详情组件
	}
	componentDidMount() {
		// 获取城市
		http.get('/linkage/locationStoreMap/getCity.json').then((res) => {
			if (res.hasError) {
				Message.error(res.content, 3);
			} else {
				this.setState({
					citys: objToArray(res),
				});
			}
		});
		// 获取城市，园区，地点，提示元素
		this.cityPlaceholderEle = document.getElementsByClassName('select-city')[0].getElementsByClassName('kuma-select2-selection__placeholder')[0];
		this.parkPlaceholderEle = document.getElementsByClassName('select-park')[0].getElementsByClassName('kuma-select2-selection__placeholder')[0];
		this.locationPlaceholderEle = document.getElementsByClassName('select-location')[0].getElementsByClassName('kuma-select2-selection__placeholder')[0];
		// 获取所属类别
		new Promise((resolve) => {
			http.get('/newemployee/equipment/getCategoryType.json').then((res) => {
				this.setState({
					categoryType: res,
					categoryTypeId: res[0].id,
				});
				resolve(res[0].id);
			});
		}).then((categoryTypeId) => {
			this.requestAsset(categoryTypeId);
		});
	}
	// 资产借用tab
	tabTranslateClick1() {
		this.tabContent.style.transform = 'translateX(0)';
		this.tabBottom.style.transform = 'translateX(0)';
		this.setState({
			tabActive: '1',
		});
	}
	// 资产续借tab
	tabTranslateClick2() {
		this.tabContent.style.transform = 'translateX(-100%)';
		this.tabBottom.style.transform = 'translateX(104px)';
		if (this.state.resEquipmentXujie.length === 0 && !this.tabXujieHasClick) {
			this.requestAssetXujie();
			this.tabXujieHasClick = true;
		}
		this.setState({
			tabActive: '2',
		});
	}
	// 配置标准&&领用详情
	policyTip() {
		return (
			<Dialog
				title={<span><Icon name="jinggao-full" className="icon" />借用政策</span>}
				visible={this.state.m4InfoDialog}
				className="m4-info-dialog"
				footer={
					<Button onClick={() => {
						this.setState({
							m4InfoDialog: false,
						});
					}} 
					type="primary"
					>知道啦</Button>}
				onCancel={() => {
					this.setState({
						m4InfoDialog: false,
					});
				}}
			>
				<p>1、可借用场景：临时出差、临时会议、紧急项目需求。</p>
				<p>2、借用周期：个人借用最长一个月；项目借用最长3个月；都可以续借一次。</p>
				<p>3、借用规则：供借用的资产数量有限，一旦超出了借用池的数量，将不再提供借用。</p>
				<p>4、借用失效：借用审批通过后的1天内需完成领用，否则借用单将失效，需要重新提交。</p>
			</Dialog>
		);
	}
	// 获取资产
	/**
	 * 
	 * @param {} categoryTypeId 电脑 显示器
	 * @param {*} workNo 代理人的工号
	 */
	requestAsset(categoryTypeId, workNo = '', storeLocationMappingId = '') {
		this.setState({
			noDevice: false,
		});
		// 请求对应类别的设备信息
		http.get('/workflow/borrow/getEquipmentInfo.json?workFlowType=借用&categoryTypeId=' + categoryTypeId + '&enumWorkFlowType=Borrow&workNo=' + workNo + '&storeLocationMappingId=' + storeLocationMappingId).then((res) => {
			if (res.hasError) {
				Message.info(res.content, 2);
				this.setState({
					resEquipmentInfo: [],
					noDevice: true,
				});
			} else {
				this.setState({
					resEquipmentInfo: objToArray(res),
					noDevice: true,
				});
			}
		});
	}
	// 借用政策
	borrowPolicy() {
		return (
			<div className="change-policy">
				<Icon name="jinggao-full" className="icon" />
				<span className="policy">借用政策</span>
				<span onClick={() => { 
					this.setState({
						m4InfoDialog: true,
					});
				}} 
				className="info-tip"
				>[查看详情]
				</span>
			</div>
		);
	}
	// 代他人申请
	replaceBox() {
		return (
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
		);
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
				this.requestAsset(this.state.categoryTypeId);
			}
			this.setState({
				checkboxValue: value,
				replaceInputDisabled: true,
			});
		}
	}
	// 代理人选择，选了人后再去请求数据
	handleReplaceSelect(value) {
		this.requestAsset(this.state.categoryTypeId, value.replacePerson.key.padStart(6, '0'));
	}
	// 选择领用地点
	selectAddress() {
		return (
			<div className="step-1">
				<div className="step-title">第一步：选择新设备的领用地点</div>
				<span>领用地点</span>
				<Select onChange={this.handleCityChange} className="select-city" placeholder="城市">
					{this.state.citys.map((city) => (<Option value={city.value}>{city.text}</Option>))}
				</Select>
				<Select value={this.state.selectParkCode} onChange={this.handleParkChange} className="select-park" placeholder="园区">
					{this.state.parks.map((park) => (<Option value={park.value}>{park.text}</Option>))}
				</Select>
				<Select value={this.state.selectLocationText} onChange={this.handleLocationChange} className="select-location" placeholder="领用位置">
					{this.state.locations.map((location) => (<Option value={location.value}>{location.text}</Option>))}
				</Select>
			</div>
		);
	}
	// 选择城市，获取园区
	handleCityChange(value) {
		this.cityPlaceholderEle.setAttribute('style', 'opacity: 0');
		this.parkPlaceholderEle.style.opacity = 1; // 恢复提示
		this.locationPlaceholderEle.style.opacity = 1;
		this.setState({
			selectCityCode: value,
			selectParkCode: '', // 清空园区
			selectLocationText: '', // 清空地点 ps 清空值，也要清空下拉数据
			locations: [], // 清空地点下拉数据
			selectedAsset: [], // 清空选择的
		});
		http.get('/linkage/locationStoreMap/getPark.json?cityCode=' + value).then((res) => {
			this.setState({
				parks: objToArray(res),
			});
		});
	}
	// 选择园区，获取地点
	handleParkChange(value) {
		this.parkPlaceholderEle.style.opacity = 0;
		this.locationPlaceholderEle.style.opacity = 1;
		const cityCode = this.state.selectCityCode;
		this.setState({
			selectParkCode: value,
			selectLocationText: '', // 清空地点
			selectedAsset: [], // 清空选择的
		});
		http.get('/linkage/locationStoreMap/getLocation.json?cityCode=' + cityCode + '&parkCode=' + value).then((res) => {
			this.setState({
				locations: locationObjToArray(res),
			});
		});
	}
	// 选择领用地点
	handleLocationChange(text) {
		this.locationPlaceholderEle.style.opacity = 0;
		this.obtainLocationId(text);
		this.setState({
			selectLocationText: text,
			noDevice: false,
			selectedAsset: [], // 清空选择的
		});
	}
	// 选择完地点后，获取locationId和storeHouseId
	obtainLocationId(location) {
		const cityCode = this.state.selectCityCode;
		const parkCode = this.state.selectParkCode;
		// 这儿改变一次state，会重新渲染render
		http.get('/linkage/locationStoreMap/getLocation.json?cityCode=' + cityCode + '&parkCode=' + parkCode + '&location=' + location).then((res) => {
			this.setState({
				locationId: res.locationId,
				storeHouseId: res.storeHouseId,
			});
		
			// 传过去库房ID，请求资产
			// 要判断有没有选择代理人
			let workNo = '';
			const isReplaceDisabled = this.state.isReplaceDisabled; // false 选中
			if (!isReplaceDisabled) { // 选了
				const replacePerson = this.form_replace_person.getValues().values.replacePerson;
				workNo = replacePerson && replacePerson.key.padStart(6, '0');
			}
			// 这儿又一次改变一次state，导致又重新渲染一次render。子组件会执行render
			this.requestAsset(this.state.categoryTypeId, workNo, res.locationId);
		});
	}

	tabClick(key) {
		// 要判断有没有选择代理人
		let workNo = '';
		const isReplaceDisabled = this.state.isReplaceDisabled; // false 选中
		if (!isReplaceDisabled) { // 选了
			const replacePerson = this.form_replace_person.getValues().values.replacePerson;
			workNo = replacePerson && replacePerson.key.padStart(6, '0');
		}
		this.requestAsset(key, workNo);
		this.setState({
			categoryTypeId: key,
			// noDevice: false,
		});
	}
	deviceListItem(resEquipmentInfo) {
		if (resEquipmentInfo.length) {
			return (
				resEquipmentInfo.map((item) => (
					<div className="deviceList-box">					
						<div className="deviceList-title">{item.value}</div>
						<div className="deviceList-list">
							{item.text.map((assetInfo) => (
								<Asset
									is11={this.state.is11}
									selectLocationText={!!this.state.selectLocationText} // 是否选择了城市
									storeLocationMappingId={this.state.storeHouseId}
									add={this.add}
									decrease={this.decrease}
									radioOrCheckChange={this.radioOrCheckChange}
									resDeviceInfo={assetInfo}
									selectedAsset={this.state.selectedAsset.filter((list) => list.id === assetInfo.id)} // 选中的资产
									showDialogInfo={() => { this.setState({ m4InfoDialog: true }); }}
								/>
							))}
						</div>
					</div>
				))
			);
		}
		return '没有找到设备';
	}
	// 单选多选选择事件
	radioOrCheckChange(deviceInfo, value) {
		const borrowType = this.formSelectTime.getValues().values.borrowType;
		// 判断有没有选领用地点
		if (!this.state.selectLocationText) {
			Message.error('请选择领用地点！', 3);
			return;
		}
		if (deviceInfo.stockNumber <= 0 && borrowType !== '双11、12专项') {
			Message.error('设备无库存', 3);
			return;
		}
		if (value.length === 0) {
			this.cancelAsset(deviceInfo);
			return;
		}
		const selectedAsset = this.state.selectedAsset;
		// 先判断这个资产有没有选过
		const thisAsset = selectedAsset.filter((list) => list.id === deviceInfo.id);
		if (thisAsset.length) { // 选择过

		} else { // 没有选择过，直接push
			selectedAsset.push({ ...deviceInfo, num: 1, active: true });
		}
		this.setState({
			selectedAsset,
		});
	}
	// 取消选择
	cancelAsset(deviceInfo) {
		const selectedAsset = this.state.selectedAsset;
		const result = selectedAsset.filter((list) => list.id !== deviceInfo.id);
		this.setState({
			selectedAsset: result,
		});
	}
	// 增加
	add(deviceInfo, num) {
		// 双十一无
		const borrowType = this.formSelectTime.getValues().values.borrowType;
		if (deviceInfo.stockNumber <= num && borrowType !== '双11、12专项') {
			Message.error('数量不能大于库存量！', 3);
			return;
		}
		const selectedAsset = this.state.selectedAsset;
		const result = selectedAsset.map((list) => {
			if (list.id === deviceInfo.id) {
				return {
					...list,
					num: list.num + 1,
				};
			}
			return list;
		});
		this.setState({
			selectedAsset: result,
		});
	}
	// 减少
	decrease(deviceInfo) {
		const selectedAsset = this.state.selectedAsset;
		const result = selectedAsset.map((list) => {
			if (list.id === deviceInfo.id) {
				return {
					...list,
					num: list.num - 1 <= 0 ? 1 : list.num - 1,
				};
			}
			return list;
		});
		this.setState({
			selectedAsset: result,
		});
	}
	borrowTypeChange(values, name) {
		// 从双十一切换到别的，要清空
		if (name === 'borrowType') {
			this.setState({
				borrowDay: values.borrowType === '日常临时借用' ? 30 : 90,
				is11: values.borrowType === '双11、12专项',
				selectedAsset: [], // 清空选择的
			});
		}
	}
	// 上传附件
	uploaderFileChange(fileList) {
		const arr = fileList.map((list) => ({
			...list,
			response: {
				...list.response,
				data: {
					downloadUrl: list.response.path,
				},
			},
		}));
		this.setState({
			fileList: arr,
		});
	}
	// 提交申请
	submitSelect() {
		const me = this;
		// 判断有没有选领用地点
		if (!this.state.selectLocationText) {
			Message.error('请选择领用地点！', 3);
			return;
		}
		const locationId = this.state.locationId;
		const storeHouseId = this.state.storeHouseId;
		// 判断有没有选择设备
		const selectedAsset = this.state.selectedAsset;
		if (!selectedAsset.length) {
			Message.error('请选择领用的设备！', 3);
			return;
		}
		// 借用类型
		const formSelectTime = this.formSelectTime.getValues().values;
		const borrowType = formSelectTime.borrowType;
		if (!borrowType) {
			Message.error('请选择借用类型！', 3);
			return;
		}
		const borrowDate = formSelectTime.borrowDate;
		if (!borrowDate || borrowDate.length !== 2) {
			Message.error('请选择借用时间！', 3);
			return;
		}
		const borrowDay = this.state.borrowDay;
		if (this.formSelectTime.errors.borrowDate) {
			Message.error(`借用时间不能大于${borrowDay}天！`, 3);
			return;
		}
		
		// 有没有填写申请原因
		const reasonForm = this.formReason.getValues();
		const reasonData = reasonForm.values.reason;
		if (!reasonData) {
			Message.error('请填写申请原因！', 3);
			return;
		}
		if (!reasonForm.pass) {
			Message.error('申请原因不能超过字数限制！', 3);
			return;
		}
		// 代理人
		const replacePerson = this.form_replace_person.getValues().values.replacePerson;
		const principleWorkId = replacePerson ? replacePerson.key.padStart(6, '0') : '';
		// 附件
		// 附件
		const attachments = this.state.fileList.filter((file) => file.type !== 'delete').map((file) => ({
			...file.response,
			$model: {
				...file.response,
			},
			$events: {},
			$skipArray: true,
			$accessors: {},
			$1520219871783: [],
		}));
		this.setState({
			sureDisabled: true,
		});
		const items = selectedAsset.map((list) => (
			{
				categoryAndFetureId: list.ampCategoryId,
				equipmentConfigureId: list.idString,
				categoryId: list.ampCategoryId,
				categoryName: list.ampCategory,
				stock: borrowType === '双11、12专项' ? '充足' : list.stockNumber,
				requestStartDate: moment(borrowDate[0]).format('YYYY-MM-DD'),
				requestEndDate: moment(borrowDate[1]).format('YYYY-MM-DD'),
				requestAmount: list.num,
			}
		));
		const jsonData = {
			formType: 'Borrow',
			principleWorkId,
			locationId: storeHouseId,
			storeLocationMappingId: locationId,
			reason: reasonData + '(' + borrowType + ')',
			items,
		};
		http.get('/workflow/event/applyBorrowValidate.json?jsonData=' + JSON.stringify(jsonData) + '&attachments=' + JSON.stringify(attachments)).then((res) => {
			if (res.hasError) {
				Dialog.info({
					title: '提示',
					content: res.errors[0].msg,
					onOk() {
						me.submit(jsonData, attachments);
					},
				});
			} else {
				me.submit(jsonData, attachments);
			}
		});
	}
	// submit
	submit(jsonData, attachments) {
		http.get('/workflow/event/applyAssetBorrow.json?jsonData=' + JSON.stringify(jsonData) + '&attachments=' + JSON.stringify(attachments)).then((res) => {
			this.setState({
				sureDisabled: false,
			});
			if (!res.hasError) {
				window.location.href = '/workflow/task/mysubmit.htm';
			}
		});
	}
	// 搜索
	search() {
		const searchContent = this.form_select_Asset.getValues().values.search_content;
		this.requestAssetXujie(searchContent && searchContent.main);
	}
	// 加载续借资产列表
	requestAssetXujie(searchContent) {
		this.setState({
			isShowXujie: true,
		});
		http.get('/workflow/borrow/getBorrowAssets.json', {
			params: {
				search_content: searchContent, // undefined 不会传
			},
		}).then((res) => {
			this.setState({
				resEquipmentXujie: handleTableData(res.list),
				isShowXujie: false,
			});
		});
	}
	xujieDayChange(id, values) {
		this.setState({
			selectXujie: this.state.selectXujie.map((list) => {
				if (list.assetDescribe.id === id) {
					return {
						...list,
						cycle: values.cycle,
					};
				}
				return {
					...list,
				};
			}),
		});
	}
	// 续借取消选择
	cancelXujie(data) {
		this.xujieUi = this.xujieUi.filter((list) => list.props.data.assetDescribe.id !== data.assetDescribe.id);
		this.setState({
			selectXujie: this.state.selectXujie.filter((list) => list.assetDescribe.id !== data.assetDescribe.id),
			resEquipmentXujie: this.state.resEquipmentXujie.map((list) => {
				if (data.assetDescribe.id === list.assetDescribe.id) {
					return {
						...list,
						jsxchecked: false,
					};
				}
				return {
					...list,
				};
			}),
		});
	}
	uploaderFileChangeXujie(fileList) {
		const arr = fileList.map((list) => ({
			...list,
			response: {
				...list.response,
				data: {
					downloadUrl: list.response.path,
				},
			},
		}));
		this.setState({
			fileListXujie: arr,
		});
	}
	// 续借提交
	submitSelectXujie() {
		// 判断有没有选择续借设备
		const { selectXujie } = this.state;
		if (selectXujie.length === 0) {
			Message.error('请选择续借设备！', 3);
			return;
		}
		// 判断有没有填写续借时长
		const formXujie = [];
		this.xujieUi.forEach((xujie) => {
			formXujie.push(xujie.formData());
		});
		if (formXujie.indexOf(false) !== -1) {
			return;
		}
		// 申请原因
		const reasonForm = this.formReasonXujie.getValues();
		const reasonData = reasonForm.values.reason;
		if (!reasonData) {
			Message.error('请填写申请原因！', 3);
			return;
		}
		if (!reasonForm.pass) {
			Message.error('申请原因不能超过字数限制！', 3);
			return;
		}
		this.setState({
			sureDisabledXujie: true,
		});
		// 附件
		const attachments = this.state.fileListXujie.filter((file) => file.type !== 'delete').map((file) => ({
			...file.response,
			$model: {
				...file.response,
			},
			$events: {},
			$skipArray: true,
			$accessors: {},
			$1520219871783: [],
		}));
		const jsonData = {
			formType: 'ReBorrow',
			reason: reasonData,
			items: this.state.selectXujie.map((list) => ({
				resourceId: list.idString,
				cycle: list.cycle,
				requestType: list.requestType,
				requestAmount: 1,
			})),
		};
		http.get('/workflow/borrow/ReBorrowSubmit.json?jsonData=' + JSON.stringify(jsonData) + '&attachments=' + JSON.stringify(attachments)).then((res) => {
			if (res.hasError) {
				Message.error(res.content, 3);
			} else {
				window.location.href = '/workflow/task/mysubmit.htm';
			}
		});
	}
	render() {
		const me = this;
		const rowSelection = {
			onSelect(record, selected, selectedRows) {
				// me.xujieUi = [];
				me.setState({
					selectXujie: selectedRows,
					resEquipmentXujie: me.state.resEquipmentXujie.map((list) => {
						if (list.assetDescribe.id === selected.assetDescribe.id) {
							return {
								...list,
								jsxchecked: record,
							};
						}
						return {
							...list,
						};
					}),
				});
			},
			onSelectAll(selected, selectedRows) {
				// me.xujieUi = [];
				me.setState({
					selectXujie: selectedRows,
					resEquipmentXujie: me.state.resEquipmentXujie.map((list) => ({
						...list,
						jsxchecked: selected,
					})),
				});
			},
			isDisabled(rowData) {
				if (rowData.reborrowCount === '0') {
					return false;
				}
				return true;
			},
		};
		const columns = [
			{
				dataKey: 'assetDescribe',
				title: '资源描述',
				width: 249,
				render: (data) => (<AssetDescribe data={data} />),
			}, {
				dataKey: 'assetLabel',
				title: '资源标签',
				width: 245,
				message: <span>大阿里编号：号码为<font style={{ color: 'red' }}>TD</font>开头的标签。<br />资产标签：号码为<font style={{ color: 'red' }}>T50</font>或<font style={{ color: 'red' }}>B50</font>等等开头的标签。<br />电脑上贴的标签号码只要与前面2个中的其中1个对的上就可以了。</span>,
				render: (data) => (<AssetLabel data={data} />),
			}, {
				dataKey: 'useCondition',
				title: '使用情况',
				width: 165,
				render: (data) => (<AssetUseCondation data={data} />),
			}, {
				dataKey: 'reBorrowType',
				title: '借用类型',
			}, {
				dataKey: 'reborrowCount',
				title: '状态',
				render: (data) => (data === '0' ? '可借用' : '已借用' + data + '次'),
			},
		];
		const renderProps = {
			height: 600,
			jsxdata: { data: this.state.resEquipmentXujie },
			rowSelection,
			jsxcolumns: columns,
		};
		this.xujieUi = []; // 每次都要清空
		return (
			<div className="page-borrow">
				{this.policyTip()}
				<div className="borrow-title">
					<span>资产借用申请单</span>
				</div>
				<div className="tab-wrapper">
					<div className="tab-bar">
						<div onClick={this.tabTranslateClick1} className={classnames('tab-bar-ink', { active: this.state.tabActive === '1' })}>资产借用</div>
						<div onClick={this.tabTranslateClick2} className={classnames('tab-bar-ink', { active: this.state.tabActive === '2' })}>资产续借</div>
						<div ref={(c) => { this.tabBottom = c; }} className="tab-bottom" />
					</div>
					<div ref={(c) => { this.tabContent = c; }} className="tab-content">
						<div className="tab1">
							{this.borrowPolicy()}
							{this.replaceBox()}
							{this.selectAddress()}
							<div className="step-3">
								{this.state.borrowDay ? <span className="max-date">（最长可借用{this.state.borrowDay}天）</span> : ''}
								<div className="step-title">第二步：选择借用时间</div>
								<Form ref={(c) => { this.formSelectTime = c; }} jsxonChange={this.borrowTypeChange}>
									<SelectFormField jsxname="borrowType" jsxlabel="借用类型" jsxdata={[{ value: '日常临时借用', text: '日常临时借用' }, { value: '项目借用', text: '项目借用' }, { value: '双11、12专项', text: '双11、12专项' }]} />
									<DateFormField jsxrules={[{ validator(value) { if (value && value[1] && me.state.borrowDay) { return moment(value[1]).diff(moment(value[0]), 'days') < me.state.borrowDay; } return true; }, errMsg: '借用时长大于最长借用时长！' }]} jsxname="borrowDate" jsxlabel="借用时间" jsxtype="cascade" />
								</Form>
							</div>
							<div className="step-2">
								<div className="step-title">第三步：选择领用的设备</div>
								<div className="tab-box">
									{this.state.noDevice ? '' : <div className="tab-loader-box">
										<img alt="" src="https://aliwork.alicdn.com/tps/TB1fPYRMXXXXXcdXFXXXXXXXXXX-480-238.svg" />
									</div>}
									<Tabs type="stand" onTabClick={this.tabClick}>
										{this.state.categoryType.map((item) => (<TabPane tabNum={sum(this.state.selectedAsset.filter((list) => list.categoryType === item.name).map((list) => list.num))} tab={item.name} value={item.id}>
											{this.deviceListItem(this.state.resEquipmentInfo)}
										</TabPane>))}
									</Tabs>
								</div>
							</div>
							{/* 选择详情 */}
							<div className="select-info-box">
								{this.state.selectedAsset.length ? <div className="select-info-title">已选设备：</div> : ''}
								<div className="select-info">
									{this.state.selectedAsset.map((selectAsset) => (
										<div className="select-info-list">
											<Asset 
												radioOrCheck="none" 
												showClose 
												closeAsset={this.cancelAsset} 
												resDeviceInfo={selectAsset} 
												add={this.add}
												decrease={this.decrease}
												selectedAsset={this.state.selectedAsset.filter((list) => list.id === selectAsset.id)}
											/>
										</div>
									))}
								</div>
							</div>
							
							<div className="step-4">
								<div className="step-title">第四步：填写申请原因</div>
								<Form
									ref={(c) => { this.formReason = c; }}
								>
									<TextAreaFormField 
										jsxname="reason" 
										jsxplaceholder="请详细描述需求原因，减少审批人员的二次沟通；描述不清楚的需求，资产审批人员可能会直接驳回哦！" 
										jsxrules={[
											{ validator(value) { return value ? value.length <= 256 : true; }, errMsg: '仅限256个字符' },
										]}
									>
										<TextAreaCount total={256} />
									</TextAreaFormField>
								</Form>
							</div>
							{/* 添加附件 */}
							<div className="add-file">
								<Uploader
									isOnlyImg={false}
									multiple
									name="assetUploadFile"
									fileList={this.state.fileList}
									url="/workflow/common/uploadFile.do"
									onChange={this.uploaderFileChange}
								/>
							</div>
							<div className="btn-box">
								<Button disabled={this.state.sureDisabled} onClick={this.submitSelect}>提交申请</Button>		
							</div>
						</div>
						<div className="tab2">
							{this.borrowPolicy()}
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
							<div className="table-box">
								{this.state.isShowXujie ? <div className="xujieLoading">
									<img alt="" src="https://img.alicdn.com/tfs/TB132EFhntYBeNjy1XdXXXXyVXa-64-64.gif" />
								</div> : ''}
								<Table {...renderProps} />
							</div>
							<div className="xujie-select-info">
								{this.state.selectXujie.length ? <div className="select-info-title">已选设备：</div> : ''}
								<div className="select-info">
									{this.state.selectXujie.map((list) => ( 
										<XujieSelect ref={(c) => { c && this.xujieUi.push(c); }} data={list} closeAsset={this.cancelXujie} xujieDayChange={this.xujieDayChange} />
									))}
								</div>
							</div>
							{/* 第三步填写申请原因 */}
							<div className="reason-box step-4">
								<div className="step-title">请填写续借原因</div>
								<Form
									ref={(c) => { this.formReasonXujie = c; }}
								>
									<TextAreaFormField 
										jsxname="reason" 
										jsxplaceholder="请详细描述需求原因，减少审批人员的二次沟通；描述不清楚的需求，资产审批人员可能会直接驳回哦！" 
										jsxrules={[
											{ validator(value) { return value ? value.length <= 256 : true; }, errMsg: '仅限256个字符' },
										]}
									>
										<TextAreaCount total={256} />
									</TextAreaFormField>
								</Form>
							</div>
							{/* 添加附件 */}
							<div className="add-file">
								<Uploader
									isOnlyImg={false}
									multiple
									name="assetUploadFile"
									fileList={this.state.fileListXujie}
									url="/workflow/common/uploadFile.do"
									onChange={this.uploaderFileChangeXujie}
								/>
							</div>
							<div className="btn-box">
								<Button disabled={this.state.sureDisabledXujie} onClick={this.submitSelectXujie}>提交申请</Button>		
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default Borrow;
// temp("temp", "日常临时借用", 30), project("project", "项目借用", 90), special("special", "双11,12专项", 90),
// 城市切换，选择的数据清空
// 借用类型切换
