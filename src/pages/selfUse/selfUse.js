/**
 *  资产领用申请单(自用)
 *  
 */
import Icon from 'uxcore-icon';
import CheckboxGroup from 'uxcore-checkbox-group';
import Form from 'uxcore-form';
import Button from 'uxcore-button';
import Message from 'uxcore-message';
import Select from 'uxcore-select2';
import Dialog from 'uxcore-dialog';
import Table from 'uxcore-table';
import Tabs from 'components/Tabs';
import Uploader from 'components/uploader';
import ReplacePeople from 'components/ReplacePeople';
import Asset from './asset';
import { http } from '../../lib/http';
import './selfUse.less';

const Item = CheckboxGroup.Item;
const { SelectFormField, TextAreaFormField } = Form;
const { TextAreaCount } = TextAreaFormField;
const Option = Select.Option;
const TabPane = Tabs.TabPane;
// Map转数组
function mapToArray(map) {
	const arr = [];
	map.forEach((value, key) => {
		arr.push({
			type: key,
			info: value,
		});
	});
	return arr;
}
// 对象转数组
function objToArray(obj) {
	const arr = Object.keys(obj).map((key) => ({
		text: obj[key],
		value: key,
	}));
	return arr;
}

// 特殊情况，获取地点，text == value
function locationObjToArray(obj) {
	const arr = Object.keys(obj).map((key) => ({
		text: obj[key],
		value: obj[key],
	}));
	return arr;
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

class SelfUse extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			checkboxReplace: '', // 代理人激活框
			// accessToken: '', // 获取accessToken
			isReplaceDisabled: true, // 代理人选择框状态
			citys: [], // 获取的城市
			selectCityCode: '', // 选择的城市
			parks: [], // 获取的园区
			selectParkCode: '', // 选择的园区
			locations: [], // 获取的地点
			selectLocationText: '', // 选择的地点
			locationId: '', // 选择的地点ID
			storeHouseId: '', // 选择的库房ID
			categoryType: [], // 获取的所属类别
			deviceInfo: [], // 获取的设备信息
			selectAssetCollection: new Map(), // 选中的资产 --- 单选
			fileList: [], // 文件上传
			showDialog: false,
			tableData: {}, // 申请设备详情
			jsonData: {}, // 提交数据
			attachments: [], // 附件
			disabled: false, // 弹窗提交按钮状态
			submitDisabled: false,
			categoryTypeId: '', // 哪一个Tab
			m4InfoDialog: false, // 提示弹窗
			validateError: '',
			formType: '',
			noDevice: false,
		};
		this.handleReplace = this.handleReplace.bind(this);
		this.submitSelect = this.submitSelect.bind(this);
		this.handleCityChange = this.handleCityChange.bind(this);
		this.handleParkChange = this.handleParkChange.bind(this);
		this.handleLocationChange = this.handleLocationChange.bind(this);
		this.radioOrCheckChange = this.radioOrCheckChange.bind(this);
		this.tabClick = this.tabClick.bind(this);
		this.cancelAsset = this.cancelAsset.bind(this);
		this.uploaderFileChange = this.uploaderFileChange.bind(this);
		this.handleDialogOk = this.handleDialogOk.bind(this);
		this.handleReplaceSelect = this.handleReplaceSelect.bind(this);
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
		http.get('/workflow/obtain/getInfoByGroup.json').then((res) => {
			Object.keys(res).forEach((key) => {
				if (res[key] === '领用单') {
					this.setState({
						formType: key,
					});
				}
			});
		});
	}
	// 代理人激活框
	handleReplace(value) {
		if (value.length === 2) { // 选中
			this.setState({
				checkboxReplace: value,
				isReplaceDisabled: false,
			});
		} else {
			// 判断有没有选人，有--> 清空，触发数据
			// 没有--> 不触发数据
			const replacePerson = this.form_replace_person.getValues().values.replacePerson;
			if (replacePerson) { // 有人
				this.form_replace_person.resetValues();
				const categoryTypeId = this.state.categoryTypeId;
				this.requestAsset(categoryTypeId);
			}
			this.setState({
				checkboxReplace: value,
				isReplaceDisabled: true,
			});
		}
	}
	// 代理人选择
	handleReplaceSelect(value) {
		const categoryTypeId = this.state.categoryTypeId;
		this.requestAsset(categoryTypeId, stringFormat(value.replacePerson.key));
	}
	// 选择城市，获取园区
	handleCityChange(value) {
		// placeholderEle.setAttribute('style', 'display: none!important');
		this.cityPlaceholderEle.setAttribute('style', 'opacity: 0');
		this.parkPlaceholderEle.style.opacity = 1; // 恢复提示
		this.locationPlaceholderEle.style.opacity = 1;
		this.setState({
			selectCityCode: value,
			selectParkCode: '', // 清空园区
			selectLocationText: '', // 清空地点 ps 清空值，也要清空下拉数据
			locations: [], // 清空地点下拉数据
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
		});
	}
	// 选择完地点后，获取locationId和storeHouseId
	obtainLocationId(location) {
		const cityCode = this.state.selectCityCode;
		const parkCode = this.state.selectParkCode;
		http.get('/linkage/locationStoreMap/getLocation.json?cityCode=' + cityCode + '&parkCode=' + parkCode + '&location=' + location).then((res) => {
			this.setState({
				locationId: res.locationId,
				storeHouseId: res.storeHouseId,
			});
		});
	}
	// 请求资产信息
	requestAsset(categoryTypeId, workNo) {
		this.setState({
			deviceInfo: [],
			noDevice: false,
		});
		const workNo_ = workNo ? workNo : '';
		// 请求对应类别的设备信息
		http.get('/newemployee/equipment/getEquipmentInfo.json?workFlowType=领用（自用）&categoryTypeId=' + categoryTypeId + '&enumWorkFlowType=Obtain&workNo=' + workNo_).then((res) => {
			if (res.hasError) {
				Message.info(res.content, 2);
				this.setState({
					deviceInfo: [],
					noDevice: true,
				});
			} else {
				this.setState({
					deviceInfo: objToArray(res),
					noDevice: true,
				});
			}
		});
	}
	// 选项卡切换
	tabClick(key) {
		// 要判断有没有选择代理人
		let workNo = '';
		const isReplaceDisabled = this.state.isReplaceDisabled; // false 选中
		if (!isReplaceDisabled) { // 选了
			const replacePerson = this.form_replace_person.getValues().values.replacePerson;
			workNo = replacePerson && stringFormat(replacePerson.key);
		}
		this.requestAsset(key, workNo);
		this.setState({
			categoryTypeId: key,
			noDevice: false,
		});
	}
	// 一类资产
	/**
	 * 传过来的 空字符串或对象
	 * @param  deviceList [{text: [], value: ""}]
	 */
	deviceListItem(deviceList) {
		if (deviceList.length) {
			return (
				deviceList.map((item) => (
					<div className="deviceList-box">					
						<div className="deviceList-title">{item.value}</div>
						<div className="deviceList-list">
							{item.text.map((assetInfo) => (
								<Asset
									radioOrCheckChange={this.radioOrCheckChange}
									selectAssetRadio={this.state.selectAssetCollection.get(assetInfo.categoryType) ? this.state.selectAssetCollection.get(assetInfo.categoryType).modelDetailId + this.state.selectAssetCollection.get(assetInfo.categoryType).categoryType : ''}
									deviceInfo={assetInfo}
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
	radioOrCheckChange(radioOrCheck, deviceInfo) {
		if (radioOrCheck === 'radio') { // 处理单选
			// value 对应型号小类Id+assetType
			this.setState({
				selectAssetCollection: this.state.selectAssetCollection.set(deviceInfo.categoryType, deviceInfo),
			});
			// 不能用一个state，会导致所有的都是单选
		} else { // 处理多选

		}
	}
	// 取消选择
	cancelAsset(deviceInfo) {
		this.state.selectAssetCollection.delete(deviceInfo.categoryType); // 删除成功返回值是true
		this.setState({
			selectAssetCollection: this.state.selectAssetCollection,
		});
	}
	// 文件上传
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
		// 判断有没有选择代理人
		const isReplaceDisabled = this.state.isReplaceDisabled; // false 选中
		let principleWorkId = '';
		if (!isReplaceDisabled) { // 选中
			const replacePerson = this.form_replace_person.getValues().values.replacePerson;
			if (!replacePerson) { // 没有筛选dai
				Message.error('请选择代理人！', 3);
				return;
			}
			principleWorkId = stringFormat(replacePerson.key);
		}
		// 判断有没有选领用地点
		if (!this.state.selectLocationText) {
			Message.error('请选择领用地点！', 3);
			return;
		}
		const locationId = this.state.storeHouseId.split(',')[0];
		const storeLocationMappingId = this.state.locationId;
		// 判断有没有选择设备
		const selectAssetCollection = this.state.selectAssetCollection;
		if (!selectAssetCollection.size) {
			Message.error('请选择领用的设备！', 3);
			return;
		}
		const items = mapToArray(selectAssetCollection).map((item) => ({
			categoryAndFetureId: item.info.ampCategoryId,
			equipmentConfigureId: item.info.id,
			requestAmount: 1,
			modelDetail: item.info.modelDetail,
			configureMsg: item.info.configureMsg,
		}));
		// 有没有填写申请原因
		const reasonForm = this.formReason.getValues();
		const reason = reasonForm.values.reason;
		if (!reason) {
			Message.error('请填写申请原因！', 3);
			return;
		}
		if (!reasonForm.pass) {
			Message.error('申请原因不能超过字数限制！', 3);
			return;
		}
		this.setState({
			submitDisabled: true,
		});
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
		const group = this.state.formType;
		const jsonData = {
			principleWorkId,
			locationId,
			storeLocationMappingId,
			items,
			reason,
			formType: group.substring(0, 1).toUpperCase() + group.substring(1),
			manageType: 'it',
			useRemark: 'person',
		};
		http.get('/workflow/obtain/validate.json?jsonData=' + JSON.stringify(jsonData) + '&attachments=' + JSON.stringify(attachments)).then((res) => {
			let validateError = '';
			if (res.hasError) { // 有错
				validateError = res.errors[0].msg;
			}
			// 弹窗详情
			this.setState({
				showDialog: true,
				tableData: {
					data: items,
				},
				jsonData,
				submitDisabled: false,
				attachments,
				validateError,
			});
		});
	}
	// 对话框确认
	handleDialogOk() {
		this.setState({
			disabled: true,
		});
		const jsonData = this.state.jsonData;
		const attachments = this.state.attachments;
		// if (this.state.validateError) { // 没有校验成功
		http.get('/workflow/obtain/submitPerson.json?jsonData=' + JSON.stringify(jsonData) + '&attachments=' + JSON.stringify(attachments)).then((res) => {
			if (!res.hasError) {
				window.location.href = '/workflow/task/mysubmit.htm';
			} else {
				Message.error(res.errors[0].msg, 3);
				this.setState({
					disabled: false,
				});
			}
		});
		// } else {
		// 	window.location.href = '/workflow/task/mysubmit.htm';
		// }
	}

	render() {
		const renderTable = {
			jsxdata: this.state.tableData,
			jsxcolumns: [{
				title: '资产名称',
				width: 150,
				dataKey: 'modelDetail',
			}, {
				title: '资产描述',
				width: 200,
				dataKey: 'configureMsg',
			}, {
				title: '申请数量',
				width: 80,
				dataKey: 'requestAmount',
			}],
		};
		
		return (
			<div className="page-selfUse">
				<Dialog
					title={<span><Icon name="jinggao-full" className="icon" />资产领用规则</span>}
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
					<ol>
						<li>B2B销售：M2以下不配置公司电脑，M2及以上标配普通笔记本；直销不配置电脑。</li>
						<li>外包、实习生、客满座席（P4以下）标配普通台式机。</li>
						<li>Jobcode（内网岗位名称）是技术、UED：新入职员工或名下电脑使用满42个月的老员工可申请MacBook Pro。</li>
						<li>Jobcode（内网岗位名称）是技术、UED、BI：可配置大屏显示器（22寸及以上）。</li>
						<li>除以上其他岗位标配普通笔记本；应蚂蚁金服安全部要求，蚂蚁、口碑非技术、UED同学不配置MAC电脑。</li>
						<li>电脑、耳麦等领用遵循一人一机原则。</li>
					</ol>
				</Dialog>
				<div className="self-title">
					<span>资产领用申请单(自用)</span>
				</div>
				{/* 代他人申请 */}
				<div className="replace-box">
					<div className="top">
						<CheckboxGroup onChange={this.handleReplace} value={this.state.checkboxReplace}>
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
								jsxdisabled={this.state.isReplaceDisabled}
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
									// item.name + (item.nickNameCn ? '(' + item.nickNameCn + ')' : '')
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
				{/* 第一步：选择领用地点 */}
				<div className="step-address">
					<div className="step-title">第一步：选择领用地点</div>
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
				{/* 第二步：选择需领用的设备 */}
				<div className="step-device">
					<div className="step-title">第二步：选择需领用的设备</div>
					<div className="config-info">
						<Icon name="jinggao-full" className="icon" />
						<span>配置标准</span>
						<span onClick={() => {
							this.setState({
								m4InfoDialog: true,
							});
						}} 
						className="look-info"
						>[查看详情]</span>
					</div>
					<div className="tab-box">
						{this.state.noDevice ? '' : <div className="tab-loader-box">
							<img alt="" src="https://aliwork.alicdn.com/tps/TB1fPYRMXXXXXcdXFXXXXXXXXXX-480-238.svg" />
						</div>}
						<Tabs onTabClick={this.tabClick}>
							{this.state.categoryType.map((item) => (<TabPane tabNum={this.state.selectAssetCollection.get(item.name) ? 1 : 0} tab={item.name} value={item.id}>{this.deviceListItem(this.state.deviceInfo)}</TabPane>))}
						</Tabs>
					</div>
				</div>
				{/* 选择详情 */}
				<div className="select-info-box">
					{this.state.selectAssetCollection.size ? <div className="select-info-title">已选设备：</div> : ''}
					<div className="select-info">
						{mapToArray(this.state.selectAssetCollection).map((selectAsset) => (
							<div className="select-info-list">
								<Asset radioOrCheck="none" showClose closeAsset={this.cancelAsset} deviceInfo={selectAsset.info} />
							</div>
						))}
					</div>
				</div>
				{/* 第三步填写申请原因 */}
				<div className="reason-box">
					<div className="step-title">第三步：填写申请原因</div>
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
				{/* 确认按钮 */}
				<div className="btn-box">
					<a href="/workflow/obtain/select.htm"><Button className="pre" type="outline">上一步</Button></a>	
					<Button disabled={this.state.submitDisabled} onClick={this.submitSelect}>提交申请</Button>		
				</div>
				{/* 对话框详情 */}
				<Dialog
					className="asset-detail"
					visible={this.state.showDialog}
					title="资产领用" 
					footer={[
						<Button disabled={this.state.disabled} onClick={this.handleDialogOk} size="small">确定</Button>,
					]}
					onCancel={() => {
						this.setState({
							showDialog: false,
						});
					}}
				>
					<Table ref={(c) => { this.table = c; }} {...renderTable} />
					{this.state.validateError ? <div className="error-info-box">
						<span><Icon name="jinggao-full" className="icon" />超出配置标准，需要M4主管审批。原因：<br />{this.state.validateError}</span>
					</div> : ''}
				</Dialog>
			</div>
		);
	}
}

export default SelfUse;
/**
 * zoom rc-tabs有问题
 * react-web-tabs 没问题   https://www.npmjs.com/package/react-web-tabs
 * 
 * 自定义组件 组件的key获取不到 
 * {}
 * 
 * Uploader 文件上传
 * change返回的数据格式fileList.response.data.downloadUrl 有
 * 回显 fileList.response
 * 小提示1050 弹窗1000 1070
 */
