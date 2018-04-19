import Crumb from 'uxcore-crumb';
import moment from 'moment';
import Icon from 'uxcore-icon';
import Select from 'uxcore-select2';
import Button from 'uxcore-button';
import Dialog from 'uxcore-dialog';
import Popover from 'uxcore-popover';
import Form from 'uxcore-form';
import Message from 'uxcore-message';
import Table from 'uxcore-table';
import Uploader from 'components/uploader';
import './zooming';
import { http } from '../../lib/http';
import AssetDescribe from './assetDescribe';
import Asset from './asset';
import util from './util';
import { objToArray, locationObjToArray } from '../../lib/util';
import './changeSelectSubmit.less';

/**
 * 第三步选择更换设备
 */
const { parseURL } = util;
const Option = Select.Option;
const { TextAreaFormField } = Form;
const { TextAreaCount } = TextAreaFormField;
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

class ChangeSelectBill extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			assetData: [], // 表格数据
			citys: [], // 获取的城市
			selectCityCode: '', // 选择的城市
			parks: [], // 获取的园区
			selectParkCode: '', // 选择的园区
			locations: [], // 获取的地点
			selectLocationText: '', // 选择的地点
			locationId: '', // 选择的地点ID
			storeHouseId: '', // 选择的库房ID
			noDevice: false,
			resEquipmentInfo: [], // 资产列表
			m4InfoDialog: false, // 资产领用政策
			selectAssetInfo: [], // 选中的资产
			fileList: [], // 附件
			jsonData: {}, // 提交数据
			attachments: [], // 附件
			chnageInfoShowDialog: false, // 更换详情弹窗
			submitDisabled: false,
			sureDisabled: false,
			validate: [], // 校验信息
			usedMonths: '',
		};
		this.handleCityChange = this.handleCityChange.bind(this);
		this.handleParkChange = this.handleParkChange.bind(this);
		this.handleLocationChange = this.handleLocationChange.bind(this);
		this.obtainLocationId = this.obtainLocationId.bind(this);
		this.radioOrCheckChange = this.radioOrCheckChange.bind(this);
		this.cancelAsset = this.cancelAsset.bind(this);
		this.submitSelect = this.submitSelect.bind(this);
		this.handleDialogOk = this.handleDialogOk.bind(this);
		this.uploaderFileChange = this.uploaderFileChange.bind(this);
	}
	componentDidMount() {
		http.get('/workflow/common/checkCanProcess.json').then((resp) => {
			if (!resp) { // 不能
				Dialog.error({
					content: '此设备不能更换',
					onOk() {
						window.location.href = '/workflow/change/select_asset.htm';
					},
					onCancel() {
						window.location.href = '/workflow/change/select_asset.htm';
					},
				});
			} else {
				const url = window.location.href;
				const paramsData = parseURL(url).params;
				// 获取要更换的资产详细信息
				http.get('/workflow/change/getDetail.json?resourceId=' + paramsData.resourceId).then((res) => {
					this.setState({
						assetData: handleTableData(res),
						usedMonths: res[0].usedMonths,
					});
				});
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
				// 获取资产信息
				http.get('/workflow/change/getChangeData.json?resourceId=' + paramsData.resourceId).then((resChangeData) => {
					const categoryTypeId = resChangeData.mapping.monitor ? 1 : 0;
					http.get('/newemployee/equipment/getEquipmentInfo.json', {
						params: {
							workFlowType: '更换',
							categoryTypeId,
							enumWorkFlowType: 'Change',
							workNo: paramsData.userId,
							usedMonths: this.state.usedMonths,
						},
					}).then((resEquipmentInfo) => {
						this.setState({
							resEquipmentInfo: objToArray(resEquipmentInfo),
						});
					});
				});
			}
		});
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
	// 资产领用政策
	assetUsePolicy() {
		return (
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
		);
	}
	// 资产选择
	radioOrCheckChange(deviceInfo, value) {
		const selectAssetInfoArr = [];
		selectAssetInfoArr.push(deviceInfo);
		this.setState({
			selectAssetRadio: value,
			selectAssetInfo: selectAssetInfoArr,
		});
	}
	// 取消选择
	cancelAsset() {
		this.setState({
			selectAssetRadio: '',
			selectAssetInfo: [],
		});
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
		const url = window.location.href;
		const params = parseURL(url).params;
		// 判断有没有选领用地点
		if (!this.state.selectLocationText) {
			Message.error('请选择领用地点！', 3);
			return;
		}
		const locationId = this.state.storeHouseId.split(',')[0];
		const storeLocationMappingId = this.state.locationId;
		// 判断有没有选择设备
		const selectAssetRadio = this.state.selectAssetRadio;
		if (!selectAssetRadio) {
			Message.error('请选择领用的设备！', 3);
			return;
		}
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
			sureDisabled: true,
		});
		const selectAssetInfo = this.state.selectAssetInfo[0];
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
		const jsonData = {
			principleWorkId: params.userId,
			locationId,
			reason,
			manageType: 'it',
			formType: 'Change',
			returnType: params.returnType,
			storeLocationMappingId,
			items: [
				{
					categoryAndFetureId: selectAssetInfo.ampCategoryId,
					requestAmount: 1,
					equipmentConfigureId: selectAssetInfo.id,
				},
				{
					resourceId: params.resourceId,
					requestAmount: 1,
					returnType: params.returnType,
				},
			],
		};
		http.get('/workflow/change/validate.json', {
			params: {
				jsonData,
				attachments: JSON.stringify(attachments), // 数组参数前自带[]
			},
		}).then((res) => {
			this.setState({
				chnageInfoShowDialog: true,
				jsonData,
				attachments,
				sureDisabled: false,
				validate: res,
			});
		});
	}
	// 提交
	handleDialogOk() {
		this.setState({
			submitDisabled: true,
		});
		const jsonData = this.state.jsonData;
		const attachments = this.state.attachments;
		http.get('/workflow/change/submitChange.json', {
			params: {
				jsonData,
				attachments: JSON.stringify(attachments),
			},
		}).then((res) => {
			this.setState({
				submitDisabled: false,
			});
			if (res.hasError) {
				Message.error(res.content, 3);
			} else {
				window.location.href = '/workflow/task/mysubmit.htm';
			}
		});
	}
	render() {
		const overlay = (
			<div className="tip">
				<Icon name="jinggao-full" className="icon" />
				<div className="important-tip">更换政策：</div>
				<p>1、内网岗位名称是技术、UED、BI、风控的岗位：可配置台式机+单屏大屏、台式机+双屏（大屏+中屏）、笔记本+单屏大屏；客服-热线&在线和
					客服-交易保障：可配置中屏双屏。其余岗位不配置双屏显示器（笔记本算一块显示屏）； 大屏：22寸及以上；中屏：大于17寸小于22寸；小屏：
					17寸及以下。
				</p>
				<p>2. 其他因显示器故障问题置换需选择损坏更换：提交流程前请先打1818-3检测处理；</p>
				<p>3. 显示器暂不支持自购。</p>
			</div>
		);
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
		];
		const renderTable = {
			jsxdata: { data: this.state.assetData },
			jsxcolumns: columns,
			doubleClickToEdit: false,
			// height: 575,
		};
		const url = window.location.href;
		const params = parseURL(url).params;
		return (
			<div className="changeSelectBill">
				{this.assetUsePolicy()}
				<div className="bill-crumb">
					<Crumb className="crumb-style crumb-root">
						<Crumb.Item target="_blank" href="/workflow/change/select_asset.htm" className="crumb-item-style">资产更换</Crumb.Item>
						<Crumb.Item>申请单</Crumb.Item>
					</Crumb>
				</div>
				<div className="bill-title">
					<span>资产更换申请单</span>
				</div>
				<div className="change-policy">
					<Icon name="jinggao-full" className="icon" />
					<span className="policy">更换政策</span>
					<Popover overlay={overlay} placement="top" trigger="click">
						<span className="info-tip">[查看详情]</span>
					</Popover>
				</div>
				<div className="daiChange-tip">
					<span>待更换设备</span>
					<a href="/workflow/change/select_asset.htm">重新选择</a>
				</div>
				<div className="daiChange-table">
					<Table ref={(c) => { this.table = c; }} {...renderTable} />
				</div>
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
				<div className="step-2">
					<div className="step-title">第二步：选择需领用的设备</div>
					<div className="tab-box">
						{this.state.resEquipmentInfo.map((list) => (
							<div className="deviceList-box">					
								<div className="deviceList-title">{list.value}</div>
								<div className="deviceList-list">
									{list.text.map((assetInfo) => (
										<Asset
											radioOrCheckChange={this.radioOrCheckChange}
											selectAssetRadio={this.state.selectAssetRadio}
											deviceInfo={assetInfo}
											showDialogInfo={() => { this.setState({ m4InfoDialog: true }); }}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
				{/* 已选设备 */}
				{this.state.selectAssetInfo.map((list) => (
					<div className="select-info-box">
						<div className="select-info-title">已选设备：</div>
						<div className="select-info-list">
							<Asset radioOrCheck="none" showClose closeAsset={this.cancelAsset} deviceInfo={list} />
						</div>
					</div>
				))}
				{/* 第三步填写申请原因 */}
				<div className="reason-box">
					<div className="step-title">第三步：填写申请原因</div>
					<Form
						ref={(c) => { this.formReason = c; }}
					>
						<TextAreaFormField 
							jsxname="reason" 
							jsxplaceholder="请详细描述需求原因，减少审批人员的二次沟通；描述不清楚的需求，资产审批人员可能会直接驳回哦！" 
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
					<Button disabled={this.state.sureDisabled} onClick={this.submitSelect}>提交申请</Button>		
				</div>
				{/* 对话框详情 */}
				<Dialog
					className="asset-detail-dialog"
					visible={this.state.chnageInfoShowDialog}
					title="资产更换"
					footer={[
						<Button className="cancel-btn" onClick={() => { this.setState({ chnageInfoShowDialog: false }); }} size="small">取消</Button>,
						<Button disabled={this.state.submitDisabled} onClick={this.handleDialogOk} size="small">确定</Button>,
					]}
					onCancel={() => {
						this.setState({
							chnageInfoShowDialog: false,
						});
					}}
				>
					<div className="changeInfo">
						<table>
							<thead>
								<tr>
									<td>资产更换名称</td>
									<td>资产描述</td>
									<td>归还方式</td>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{this.state.assetData[0] && this.state.assetData[0].assetDescribe.categoryName}</td>
									<td>{this.state.assetData[0] && this.state.assetData[0].assetDescribe.feature}</td>
									<td>{decodeURIComponent(params.returnTypeName)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div className="changeInfo-now">
						<table>
							<thead>
								<tr>
									<td>领用资产名称</td>
									<td>资产描述</td>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{this.state.selectAssetInfo[0] && this.state.selectAssetInfo[0].modelDetail}</td>
									<td>{this.state.selectAssetInfo[0] && this.state.selectAssetInfo[0].configureMsg}</td>
								</tr>
							</tbody>
						</table>
					</div>
					{this.state.validate.length ? (<div className="validate-tip">
						<Icon name="jinggao-full" className="icon" />
						<div className="tip-title">您的申请超出了集团IT资产配置标准，需要审批！</div>
						<span>超标原因：</span>
						{this.state.validate.map((tip, index) => (
							<p>{index + 1}、{tip}</p>
						))}
					</div>) : ''}
				</Dialog>
			</div>
		);
	}
}
export default ChangeSelectBill;
