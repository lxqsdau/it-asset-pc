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
import { mapToArray, objToArray, locationObjToArray, stringFormat } from '../../lib/util';
import './zooming';
import './publicUse.less';

const Item = CheckboxGroup.Item;
const { SelectFormField, TextAreaFormField } = Form;
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const { TextAreaCount } = TextAreaFormField;
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
			noDevice: false,
			selectAssetCollection: new Map(), // 选中的资产 --- 单选
			fileList: [], // 文件上传
			showDialog: false,
			tableData: {}, // 申请设备详情
			jsonData: {}, // 提交数据
			attachments: [], // 附件
			disabled: false, // 弹窗提交按钮状态
			categoryTypeId: '', // 哪一个Tab
			m4InfoDialog: false, // 提示弹窗
			formType: '',
			activeDevice: [], // 激活选择的资产
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
		this.add = this.add.bind(this);
		this.decrease = this.decrease.bind(this);
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
		http.get('/newemployee/equipment/getEquipmentInfo.json?workFlowType=领用（公用）&categoryTypeId=' + categoryTypeId + '&enumWorkFlowType=Obtain&workNo=' + workNo_).then((res) => {
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
	// 选项卡切换 Asset组件重新加载
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
									add={this.add}
									decrease={this.decrease}
									activeDevice={this.state.activeDevice}
								/>
							))}
						</div>
					</div>
				))
			);
		}
		return '';
	}
	// 单选多选选择事件 Asset组件 props更新
	radioOrCheckChange(radioOrCheck, deviceInfo) {
		if (radioOrCheck === 'radio') { // 处理单选
			// 别的 deviceInfo num = 0 当前1
			// 别的 deviceInfo active false 当前 true
			// 1 当前添加active=true num=1
			// activeDevice的格式数组
			const activeDeviceList = this.state.activeDevice;
			if (activeDeviceList.length === 0) { // 还没有
				activeDeviceList.push({
					...deviceInfo,
					active: true,
					num: 1,
				});
			} else {
				// 判断有没有这一类，没有添加；有判断有没有这个资产，有不处理，没有替换
				const type = activeDeviceList.filter((list) => list.categoryType === deviceInfo.categoryType); // 过滤类
				if (type.length === 0) { // 没有此类，直接添加
					activeDeviceList.push({
						...deviceInfo,
						active: true,
						num: 1,
					});
				} else if (!(type[0].modelDetailId === deviceInfo.modelDetailId)) { // 有此类  没有此资产 替换
					activeDeviceList.splice(activeDeviceList.indexOf(type[0]), 1, { ...deviceInfo, active: true, num: 1 });
				}
			}
			// value 对应型号小类Id+assetType
			this.setState({
				selectAssetCollection: this.state.selectAssetCollection.set(deviceInfo.categoryType, deviceInfo),
				activeDevice: activeDeviceList,
			});
			// 电脑: {deviceInfo}
			// 不能用一个state，会导致所有的都是单选
		} else { // 处理多选

		}
	}
	decrease(deviceInfo) {
		const activeDeviceList = this.state.activeDevice;
		const result = activeDeviceList.map((list) => {
			if (list.modelDetailId !== deviceInfo.modelDetailId) {
				return list;
			}
			return {
				...list,
				num: list.num - 1 <= 0 ? 1 : list.num - 1,
			};
		});
		this.setState({
			activeDevice: result,
		});
	}
	/**
	 * 
	 * @param {*} deviceInfo 点击的设备
	 */
	add(deviceInfo) { // 
		// 一定是当前激活的资产
		const activeDeviceList = this.state.activeDevice;
		const result = activeDeviceList.map((list) => {
			if (list.modelDetailId !== deviceInfo.modelDetailId) {
				return list;
			}
			return {
				...list,
				num: list.num + 1,
			};
		});
		this.setState({
			activeDevice: result,
		});
	}
	// 取消选择
	cancelAsset(deviceInfo) {
		this.state.selectAssetCollection.delete(deviceInfo.categoryType); // 删除成功返回值是true
		const activeDeviceList = this.state.activeDevice;
		const currentDevice = activeDeviceList.filter((list) => list.modelDetailId === deviceInfo.modelDetailId);
		activeDeviceList.splice(activeDeviceList.indexOf(currentDevice), 1);
		this.setState({
			selectAssetCollection: this.state.selectAssetCollection,
			activeDevice: activeDeviceList,
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
		const items = this.state.activeDevice.map((item) => ({
			categoryAndFetureId: item.ampCategoryId,
			equipmentConfigureId: item.id,
			requestAmount: item.num,
			modelDetail: item.modelDetail,
			configureMsg: item.configureMsg,
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
		// 弹窗详情
		this.setState({
			showDialog: true,
			tableData: {
				data: items,
			},
			jsonData,
			attachments,
		});
	}
	// 对话框确认
	handleDialogOk() {
		this.setState({
			disabled: true,
		});
		const jsonData = this.state.jsonData;
		const attachments = this.state.attachments;
		http.get('/workflow/obtain/submitPublic.json?jsonData=' + JSON.stringify(jsonData) + '&attachments=' + JSON.stringify(attachments)).then((res) => {
			if (!res.hasError) {
				window.location.href = '/workflow/task/mysubmit.htm';
			} else {
				Message.error(res.errors[0].msg, 3);
				this.setState({
					disabled: false,
				});
			}
		});
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
			<div className="page-public">
				<Dialog
					title={<span><Icon name="jinggao-full" className="icon" />领用政策</span>}
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
						<li>公用电脑的申请需要部门有预算，请确认部门内是否有该预算；</li>
						<li>追加需要事业部总裁审批，点击这里<a target="_blank" href="https://bud.alibaba-inc.com/apply/applyBudget?link=add">进行预算追加</a></li>
						<li>有预算的前提下，申请公用资产直接主管审批即可。</li>
					</ol>
				</Dialog>
				<div className="self-title">
					<span>资产领用申请单(公用)</span>
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
							{this.state.categoryType.map((item) => (
								<TabPane 
									tabNum={this.state.activeDevice.filter((asset) => asset.categoryType === item.name)[0] 
										? 
										this.state.activeDevice.filter((asset) => asset.categoryType === item.name)[0].num 
										: 
										0} 
									tab={item.name} 
									value={item.id}
								>{this.deviceListItem(this.state.deviceInfo)}</TabPane>))}
						</Tabs>
					</div>
				</div>
				{/* 选择详情 */}
				<div className="select-info-box">
					{this.state.selectAssetCollection.size ? <div className="select-info-title">已选设备：</div> : ''}
					<div className="select-info">
						{mapToArray(this.state.selectAssetCollection).map((selectAsset) => (
							<div className="select-info-list">
								<Asset 
									radioOrCheck="none" 
									showClose 
									closeAsset={this.cancelAsset} 
									deviceInfo={selectAsset.info} 
									add={this.add}
									decrease={this.decrease}
									activeDevice={this.state.activeDevice}
								/>
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
							jsxplaceholder="请填写预算追查成功的申请链接，或者注明部门已有预算。 " 
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
					<Button onClick={this.submitSelect}>提交申请</Button>		
				</div>
				{/* 对话框详情 */}
				<Dialog
					className="asset-detail"
					visible={this.state.showDialog}
					title="资产领用" 
					footer={[
						<a target="_blank" href="https://bud.alibaba-inc.com/apply/applyBudget?link=add"><Button className="left" type="outline">没有预算，我要追加</Button></a>,
						<Button className="right" disabled={this.state.disabled} onClick={this.handleDialogOk}>有预算，继续申请</Button>,
					]}
					onCancel={() => {
						this.setState({
							showDialog: false,
						});
					}}
				>
					<Table ref={(c) => { this.table = c; }} {...renderTable} />
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
