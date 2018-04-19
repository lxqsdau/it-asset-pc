/**
 * 领用地点维护
 * author 刘玄清
 * 2018-2-1
 * 0.1.9
 * 
 * 
 */
import Form from 'uxcore-form';
import Button from 'uxcore-button';
import Icon from 'uxcore-icon';
import Table from 'uxcore-table';
import Dialog from 'uxcore-dialog';
import Select from 'uxcore-select2';
import Message from 'uxcore-message';
import { http } from '../../lib/http';
import './useAddress.less';

const { InputFormField } = Form;
const { Option } = Select;
class UseAddress extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addressDialog: false, // 新增领用地弹窗
			editAddressDialog: false, // 领用地编辑弹窗
			cityCollection: {}, // 搜索获取城市集合
			parkCollection: {}, // 搜搜获取园区集合
			cityValue: '', // 选择的城市
			cityValueCode: '',
			parkValue: '', // 选择的园区
			parkValueCode: '', //
			selectKeyWord: '', // 查询关键字
			newCityValue: '', //  新增城市选中
			newParkValue: '', // 新增添加园区
			newLocationValue: '', // 新增添加地点
			newParkCollection: {}, // 新增园区options
			newLocationCollection: {}, // 新增库房options
			newRegionValue: '', // 新增选择的区域
			newRegionCollection: [], // 新增所属区域
			newHouseCollection: [], // 新增关联库房
			newHouseValue: [], //
			editData: {}, // 编辑数据
			editId: '',
			editSuper: false, // 是否有编辑权限
		};
		this.cityMap = new Map(); // cityName codeValue
		this.parkMap = new Map(); // parkName codeValue
		this.locationMap = new Map(); // location
		this.newParkCloseEl = null; //
		this.newLocationCloseEl = null;//
		this.newCityCloseEl = null; //
		this.newHouseMap = new Map(); //
		this.hasSelect = false; // 是否是有效的搜索
		this.selectCity; // 保存选择的城市
		this.selectPark; // 保存选择的园区
		this.selectKeyword; // 保存输入的关键字
		this.oldLocationValue;// 保存旧的
	}
	componentDidMount() {
		const me = this;
		http('/linkage/locationStoreMap/getCity.json').then((res) => {
			if (!res.hasError) {
				me.setState({
					cityCollection: res,
				});
				for (let i = 0; i < Object.keys(res).length; i++) {
					this.cityMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
				}
			}
		});
		// 隐藏搜搜园区的icon
		this.selectParkEl = document.getElementsByClassName('select2-park')[0].getElementsByClassName('kuma-select2-selection__clear')[0];
		this.selectParkEl.style.display = 'none'; // 因为有value，初始化的时候隐藏close按钮
	}
	// 查询，下拉城市选择
	handleCityChange(value) {
		const me = this;
		me.selectParkEl.style.display = 'none';
		if (value) { // 有值时
			me.setState({
				cityValue: value,
			});
			http('/linkage/locationStoreMap/getPark.json?cityCode=' + me.cityMap.get(value)).then((res) => {
				if (!res.hasError) {
					me.setState({
						parkCollection: res,
						parkValue: '', // 清空园区
					});
					for (let i = 0; i < Object.keys(res).length; i++) {
						me.parkMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
					}
				}
			});
		} else {
			me.setState({
				parkValue: '',
				parkCollection: {},
				cityValue: '',
			});
		}
	}
	// 查询，下拉园区选择
	handleParkChange(value) {
		if (value) {
			this.selectParkEl.style.display = 'inline-block';
			this.setState({
				parkValue: value,
			});
		} else {
			this.selectParkEl.style.display = 'none';
			this.setState({
				parkValue: '',
			});
		}
	}
	// 查询
	handleSelect() {
		const formData = this.form_select_keywords.getValues().values;
		const city = this.cityMap.get(this.state.cityValue);
		const park = this.parkMap.get(this.state.parkValue);
		// 判断是否是有效的搜索 1 都为空无效， 两次三个值都不变
		// 如果是有效的搜索，页数置位1
		// 这里最好别用state，state改变会导致页面渲染一次
		// 有效的搜索table会刷新
		if (this.selectCity === city && this.selectPark === park && this.selectKeyword === formData.keyword) { // 无效的搜索
			this.hasSelect = false;
		} else {
			this.hasSelect = true;
		}
		this.setState({
			selectKeyWord: formData.keyword,
			cityValueCode: city,
			parkValueCode: park,
		});
	}
	// 添加按钮
	handleAdd() {
		const me = this;
		// 清空描述输入框的值
		this.form_address_dis && this.form_address_dis.setValues({
			description: '',
		});
		// 清空选中数据
		me.setState({
			newCityValue: '',
			newParkValue: '',
			newLocationValue: '',
			newRegionValue: '',
			newHouseValue: [],
			newParkCollection: {},
			newLocationCollection: {},
			addressDialog: true,
		});
		http('/linkage/locationStoreMap/getCity.json').then((res) => {
			if (!res.hasError) {
				me.setState({
					cityCollection: res,
				});
				for (let i = 0; i < Object.keys(res).length; i++) {
					me.cityMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
				}
			}
		});
		// // 获取所属区域
		http('/linkage/locationStoreMap/getRegion.json').then((res) => {
			if (!res.hasError) {
				me.setState({
					newRegionCollection: res,
				});
			}
		});
		// // 获取库房
		http('/linkage/locationStoreMap/getStoreHouse.json').then((res) => {
			if (!res.hasError) {
				me.setState({
					newHouseCollection: res.slice(0, 10),
				});
				res.map((item) => {
					me.newHouseMap.set(item.name, item.id);
					return '';
				});
			}
		});
		me.setState({
			addressDialog: true,
		}, () => {
			me.newParkCloseEl = document.getElementsByClassName('new-park-box')[0].getElementsByClassName('kuma-select2-selection__clear')[0];
			me.newParkCloseEl.style.display = 'none';
			me.newLocationCloseEl = document.getElementsByClassName('new-location-box')[0].getElementsByClassName('kuma-select2-selection__clear')[0];
			me.newLocationCloseEl.style.display = 'none';
			me.newCityCloseEl = document.getElementsByClassName('new-city-box')[0].getElementsByClassName('kuma-select2-selection__clear')[0];
			me.newCityCloseEl.style.display = 'none';
			me.newRagionCloseEl = document.getElementsByClassName('new-area-box')[0].getElementsByClassName('kuma-select2-selection__clear')[0];
			me.newRagionCloseEl.style.display = 'none';
		});
	}
	// 添加城市改变
	handleNewCity(value) {
		const me = this;
		if (value) {
			me.setState({
				newCityValue: value,
				newParkValue: '',
				newLocationValue: '', // 改变的时候先清空下面的
				newLocationCollection: {},
			});
			if (me.newCityCloseEl) {
				me.newCityCloseEl.style.display = 'inline';
			}
			http('/linkage/locationStoreMap/getPark.json?cityCode=' + me.cityMap.get(value)).then((res) => {
				if (res.hasError) { // 输入有误
					me.setState({
						newParkCollection: {},
						newLocationCollection: {},
					});
				} else {
					for (let i = 0; i < Object.keys(res).length; i++) {
						me.parkMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
					}
					me.setState({
						newParkCollection: res,
					});
				}
			});
			http('/linkage/locationStoreMap/getStoreHouse.json?city=' + value).then((res) => {
				if (!res.hasError) { // 有返回的库房
					me.setState({
						newHouseCollection: res,
					});
				} else {
					me.setState({
						newHouseCollection: [],
						newHouseValue: [],
					});
				}
			});
		} else { // 没有输入值
			me.newCityCloseEl.style.display = 'none';
			me.newParkCloseEl.style.display = 'none';
			me.newLocationCloseEl.style.display = 'none';
			// 清空
			me.setState({
				newParkCollection: {},
				newLocationCollection: {},
				newParkValue: '',
				newLocationValue: '',
				newCityValue: '',
				newHouseValue: [],
				newHouseCollection: [],
			});
		}
	}
	// 添加园区改变
	handleNewPark(value) {
		const me = this;
		if (value) {
			me.setState({
				newParkValue: value,
				newLocationValue: '',
			});
			// 获取地点
			http('/linkage/locationStoreMap/getLocation.json?cityCode=' +
				me.cityMap.get(me.state.newCityValue) + '&parkCode=' +
				me.parkMap.get(value)).then((res) => {
				if (res.hasError) { // 可以输入
				} else {
					for (let i = 0; i < Object.keys(res).length; i++) {
						me.locationMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
					}
					me.setState({
						newLocationCollection: res,
						newLocationValue: '',
					});
				}
			});
			if (me.newParkCloseEl) {
				me.newParkCloseEl.style.display = 'inline-block';
			}
		} else {
			me.newParkCloseEl.style.display = 'none';
			me.newLocationCloseEl.style.display = 'none';
			me.setState({
				newLocationCollection: {},
				newParkValue: '',
				newLocationValue: '',
			});
		}
	}
	// 新增地点改变
	handleNewLocation(value) {
		const me = this;
		if (value) {
			if (me.newLocationCloseEl) {
				me.newLocationCloseEl.style.display = 'inline-block';
			}
			this.setState({
				newLocationValue: value,
			});
		} else {
			if (me.newLocationCloseEl) {
				me.newLocationCloseEl.style.display = 'none';
			}
			this.setState({
				newLocationValue: '',
			});
		}
	}
	// 关联库房选择
	handleNewHouse(value) {
		this.setState({
			newHouseValue: value,
		});
	}
	// 所属库房改变
	handleNewRegion(value) {
		this.setState({
			newRegionValue: value,
		});
	}
	// 新增领用地点提交
	createAddress() {
		const me = this;
		const city = this.state.newCityValue;
		const park = this.state.newParkValue;
		const location = this.state.newLocationValue;
		const regionId = this.state.newRegionValue.split(',')[0];
		const regionName = this.state.newRegionValue.split(',')[1];
		const description = this.form_address_dis.getValues().values.description;
		const house = this.state.newHouseValue;
		if (!city) {
			Message.error('城市必填！');
			return;
		}
		if (!park) {
			Message.error('园区必填！');
			return;
		}
		if (!location) {
			Message.error('领用地点必填！');
			return;
		}
		if (!regionName) {
			Message.error('所属区域必填！');
			return;
		}
		// // 拼接json字符串
		const cityCode = this.cityMap.get(city);
		const parkCode = this.parkMap.get(park);
		const locationCode = this.locationMap.get(location);
		const storeHouseId = house.map((item) => me.newHouseMap.get(item)).join(',');
		const storeHouseName = house.join(',');
		const reqData = {
			city,
			cityCode,
			park,
			parkCode,
			location,
			locationCode,
			regionId,
			regionName,
			description,
			storeHouseName,
			storeHouseId,
		};
		const strData = JSON.stringify(reqData, (key, value) => {
			if (key === 'storeHouseName') {
				value = encodeURIComponent(value);
			}
			return value;
		});
		http('/linkage/locationStoreMap/addOrUpdateLocation.json?locationMapping=' + strData).then((res) => {
			if (res.hasError) {
				Message.error(res.content, 3);
			} else {
				Message.success('新增成功！');
				// 关闭diaog
				this.setState({
					addressDialog: false,
				});
				// 更新表格
				this.table.fetchData();
				http('/linkage/locationStoreMap/getCity.json').then((resCity) => {
					if (!resCity.hasError) {
						me.setState({
							cityCollection: resCity,
						});
						for (let i = 0; i < Object.keys(resCity).length; i++) {
							me.cityMap.set(resCity[Object.keys(resCity)[i]], Object.keys(resCity)[i]);
						}
					}
				});
			}
		});
	}
	// 表格返回数据处理
	tableBackData(tableData) {
		this.hasSelect = false; // 数据返回后恢复为无效值
		return {
			...tableData,
			data: tableData.data.map((item) => ({
				...item,
				storeHouseName: item.storeHouseName.split(',').map((name) => (<div title={name} className="table-house-item">{name}</div>)),
			})),
		};
	}
	// table编辑
	tableEdit(tableData) {
		const me = this;
		me.setState({
			editId: tableData.id,
		});
		// 判断地点是否有编辑权限
		http.get('/linkage/locationStoreMap/canChange.json').then((res) => {
			this.setState({
				editSuper: res.super,
			});
		});
		// 获取初始园区
		http('/linkage/locationStoreMap/getPark.json?cityCode=' + tableData.cityCode).then((res) => {
			if (!res.hasError) {
				for (let i = 0; i < Object.keys(res).length; i++) {
					me.parkMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
				}
				me.setState({
					newParkCollection: res,
				});
			}
		});
		// 获取初始领用地点
		http('/linkage/locationStoreMap/getLocation.json?cityCode=' + tableData.cityCode + '&parkCode=' + tableData.parkCode).then((res) => {
			if (!res.hasError) {
				for (let i = 0; i < Object.keys(res).length; i++) {
					me.locationMap.set(res[Object.keys(res)[i]], Object.keys(res)[i]);
				}
				me.setState({
					newLocationCollection: res,
				});
			}
		});
		// 获取所属区域
		http('/linkage/locationStoreMap/getRegion.json').then((res) => {
			if (!res.hasError) {
				me.setState({
					newRegionCollection: res,
				});
			}
		});
		// 获取关联库房
		http('/linkage/locationStoreMap/getStoreHouse.json').then((res) => {
			if (!res.hasError) {
				res.map((item) => {
					me.newHouseMap.set(item.name, item.id);
					return '';
				});
				me.setState({
					newHouseCollection: res,
				});
			}
		});
		http('/linkage/locationStoreMap/getLocationById.json?id=' + tableData.id).then((res) => {
			if (!res.hasError) {
				this.oldLocationValue = res.location;				
				const storeHouseNameReq = res.storeHouseName;
				const storeHouseNameReslut = storeHouseNameReq && storeHouseNameReq.split(',');
				// 所属区域
				const ragionReslut = res.regionId + ',' + res.regionName;
				// 把旧的storeHouseName 和 storeHouseId 匹配上
				res.storeHouseName.split(',').map((storeHouse, index) => {
					me.newHouseMap.set(storeHouse, res.storeHouseId.split(',')[index]);
					return '';
				});
				this.setState({ 
					editAddressDialog: true,
					editData: res,
					newCityValue: res.city,
					newParkValue: res.park,
					newLocationValue: res.location,
					newRegionValue: ragionReslut,
					newHouseValue: storeHouseNameReslut,
				}, () => {
					this.form_address_dis_edit.setValues({
						description: res.description,
					});
				});
			}
		});
	}
	// 编辑提交
	editeAddress() {
		const me = this;
		const city = this.state.newCityValue;
		const park = this.state.newParkValue;
		const location = this.state.newLocationValue;
		const regionId = this.state.newRegionValue.split(',')[0];
		const regionName = this.state.newRegionValue.split(',')[1];
		const description = this.form_address_dis_edit.getValues().values.description;
		const house = this.state.newHouseValue;
		const cityCode = this.cityMap.get(city);
		const parkCode = this.parkMap.get(park);
		const locationCode = this.locationMap.get(location) || this.locationMap.get(this.oldLocationValue);
		const storeHouseId = house.map((item) => me.newHouseMap.get(item)).join(',');
		const storeHouseName = house.join(',');
		const reqData = {
			city,
			cityCode,
			park,
			parkCode,
			location,
			locationCode,
			regionId,
			regionName,
			description,
			storeHouseName,
			storeHouseId,
			edit: true, // 编辑
			id: me.state.editId,
		};
		const strData = JSON.stringify(reqData, (key, value) => {
			if (key === 'storeHouseName') {
				value = encodeURIComponent(value); // 处理#传不过去
			}
			return value;
		});
		http('/linkage/locationStoreMap/addOrUpdateLocation.json?locationMapping=' + strData).then((res) => {
			if (res.hasError) {
				Message.error(res.content, 3);
			} else {
				Message.success(res.content, 2);
				this.table.fetchData();
				me.setState({
					editAddressDialog: false,
				});
			}
		});
	}
	// table 删除
	tableDelete(tableData) {
		const me = this;
		Dialog.confirm({
			title: '确定删除吗？',
			content: '目标删除后将不可恢复，如有子目标将会被同时删除！',
			onOk() {
				// 执行删除逻辑
				http('/linkage/locationStoreMap/DeleteLocation.json?id=' + tableData.id + '&storeHouseId=' + tableData.storeHouseId).then((res) => {
					if (!res.hasError) { // 删除成功
						Message.success('删除成功！');
						me.table.fetchData();
					} else {
						Message.error(res.content, 3);
					}
				});
				// 刷新表格数据
			},
			onCancel() {},
		});
	}
	// // table 请求之前
	tableBeforeFetch(data) {
		if (this.hasSelect) {
			data.currentPage = 1;
		}
		return data;
	}
	render() {
		const me = this;
		const cityOptionItem = me.state.cityCollection;
		const parkOptionItem = me.state.parkCollection;
		const newParkOptionTtem = me.state.newParkCollection;
		const newLocationOptionItem = me.state.newLocationCollection;
		const newRegionOptionItem = me.state.newRegionCollection;
		const newHouseOptionItem = me.state.newHouseCollection;
		// console.log(JSON.parse(newRegionOptionItem))
		// 搜索城市options
		const selectCityOptions = Object.keys(cityOptionItem).map((item) => <Option key={cityOptionItem[item]}>{cityOptionItem[item]}</Option>);
		// 搜索园区options
		const selectParkOptions = Object.keys(parkOptionItem).map((item) => <Option key={parkOptionItem[item]}>{parkOptionItem[item]}</Option>);
		// 新增园区options
		const newParkOptions = Object.keys(newParkOptionTtem).map((item) => <Option key={newParkOptionTtem[item]}>{newParkOptionTtem[item]}</Option>);
		// 新增库房options
		const newLocationOptions = Object.keys(newLocationOptionItem).map((item) => <Option key={newLocationOptionItem[item]}>{newLocationOptionItem[item]}</Option>);
		// 新增区域options
		const newRegionOptions = newRegionOptionItem.length && newRegionOptionItem.map((item) => <Option key={item.id + ',' + item.name}>{item.name}</Option>);
		// 新增关联库房options
		const newHouseOptions = newHouseOptionItem.length && newHouseOptionItem.map((item) => (<Option key={item.name}>{item.name}</Option>));
		// 表格表头
		const columns = [
			{
				dataKey: 'city',
				title: '城市',
				width: 150,
			},
			{
				dataKey: 'park',
				title: '园区',
				width: 150,
			},
			{
				dataKey: 'location',
				title: '位置',
				width: 150,
			},
			{
				dataKey: 'regionName',
				title: '区域',
				width: 150,
			},
			{
				dataKey: 'storeHouseName',
				title: '关联库房',
				width: 390,
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
						render: (title, rowData) => {
							if (rowData.isDeleted === 'n') { // 没有删除
								return title;
							}
							return false;
						},
					},
				],
			},
		];
		const renderProps = {
			fetchUrl: '/linkage/locationStoreMap/getLocationList.json',
			jsxcolumns: columns,
			showPager: true,
			showPagerTotal: true,
			beforeFetch: me.tableBeforeFetch.bind(me),
			fetchParams: { // 请求数据参数
				cityCode: me.state.cityValueCode,
				parkCode: me.state.parkValueCode,
				keyword: me.state.selectKeyWord,
				// [me.hasSelect ? 'currentPage' : '']: 1,
			},
			// onPagerChange: me.tablePageChange.bind(me),
			processData: me.tableBackData.bind(this),
			className: 'table-container',
			doubleClickToEdit: false,
		};
		return (
			<div className="useAddress-container">
				<div className="title">
					<span>领用地点维护</span>
				</div>
				<div className="select-box">
					<div className="select">
						<div className="city-label">城市：</div>
						<Select allowClear className="select2-city" onChange={me.handleCityChange.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{selectCityOptions}
						</Select>
						<div className="city-label">园区：</div>
						<Select allowClear value={me.state.parkValue} onChange={me.handleParkChange.bind(me)} className="select2-park" dropdownClassName="kuma-select2-selected-has-icon">
							{selectParkOptions}
						</Select>
						<div className="keyword-label">关键字：</div>
						<Form ref={(c) => { this.form_select_keywords = c; }}>
							<InputFormField jsxname="keyword" />
						</Form>
					</div>
					<Button className="select-btn" onClick={me.handleSelect.bind(me)}><Icon name="sousuo" /></Button>
					<div className="space" />
					<Button type="outline" className="addBtn" onClick={me.handleAdd.bind(me)}>新增</Button>
				</div>
				<div className="table-box">
					<Table ref={(c) => { this.table = c; }} {...renderProps} />
				</div>
				{/* 添加领用地弹窗 */}
				<Dialog
					title="领用地点新增"
					className="add-address"
					visible={me.state.addressDialog}
					onCancel={() => {
						this.setState({
							addressDialog: false,
						});
					}}
					onOk={me.createAddress.bind(me)}
				>
					<div className="new-city-box">
						<span className="city-label">城市：</span>
						<Select value={me.state.newCityValue} combobox allowClear style={{ width: 200 }} className="new-city" onChange={me.handleNewCity.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{selectCityOptions}
						</Select>
					</div>
					<div className="new-park-box">
						<span className="city-label">园区：</span>
						<Select value={me.state.newParkValue} combobox allowClear style={{ width: 200 }} className="new-park" onChange={me.handleNewPark.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newParkOptions}
						</Select>
					</div>
					<div className="new-location-box">
						<span className="city-label">领用地点：</span>
						<Select value={me.state.newLocationValue} combobox allowClear style={{ width: 200 }} className="new-location" onChange={me.handleNewLocation.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newLocationOptions}
						</Select>
					</div>
					<div className="new-area-box">
						<span className="city-label">所属区域：</span>
						<Select value={me.state.newRegionValue} allowClear style={{ width: 200 }} showSearch={false} className="new-region" onChange={me.handleNewRegion.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newRegionOptions}
						</Select>
					</div>
					<div className="new-dis-box">
						<Form ref={(c) => { this.form_address_dis = c; }}>
							<InputFormField jsxname="description" jsxlabel="描述：" />
						</Form>
					</div>
					<div className="new-house-box">
						<span className="city-label">关联库房：</span>
						<Select value={me.state.newHouseValue} multiple showSearch={false} style={{ width: 200 }} className="new-house" onChange={me.handleNewHouse.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newHouseOptions}
						</Select>
					</div>
				</Dialog>
				{/* 领用地点编辑 */}
				<Dialog title="领用地点编辑"
					className="edit-address"
					visible={me.state.editAddressDialog}
					onCancel={() => {
						this.setState({
							editAddressDialog: false,
						});
					}}
					onOk={me.editeAddress.bind(me)}
				>
					<div className="new-city-box">
						<span className="city-label">城市：</span>
						<Select value={me.state.newCityValue} showSearch={false} style={{ width: 200 }} className="new-city" onChange={me.handleNewCity.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{selectCityOptions}
						</Select>
					</div>
					<div className="new-park-box">
						<span className="city-label">园区：</span>
						<Select showSearch={false} value={me.state.newParkValue} style={{ width: 200 }} className="new-park" onChange={me.handleNewPark.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newParkOptions}
						</Select>
					</div>
					<div className="new-location-box">
						<span className="city-label">领用地点：</span>
						<Select combobox={this.state.editSuper} value={me.state.newLocationValue} style={{ width: 200 }} className="new-location" onChange={me.handleNewLocation.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newLocationOptions}
						</Select>
					</div>
					<div className="new-area-box">
						<span className="city-label">所属区域：</span>
						<Select value={me.state.newRegionValue} style={{ width: 200 }} showSearch={false} className="new-region" onChange={me.handleNewRegion.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newRegionOptions}
						</Select>
					</div>
					<div className="new-dis-box">
						<Form ref={(c) => { this.form_address_dis_edit = c; }}>
							<InputFormField jsxname="description" jsxlabel="描述：" />
						</Form>
					</div>
					<div className="new-house-box">
						<span className="city-label">关联库房：</span>
						<Select showSearch={false} value={me.state.newHouseValue} multiple style={{ width: 200 }} className="new-house" onChange={me.handleNewHouse.bind(me)} dropdownClassName="kuma-select2-selected-has-icon">
							{newHouseOptions}
						</Select>
					</div>
				</Dialog>
			</div>
		);
	}
}

export default UseAddress;
/**
 * Table
 * 样式覆盖去掉滚动条
 * 样式指定最小高度
 */
// "indent": ["error","tab"], 使用tab缩进
// SelectFormField combobox可输入, 输入的时候获取参数
// 新增关联库房 value值为空，鼠标悬浮options会有警告提示
// https://www.cnblogs.com/smalldark/p/6496675.html
// 分页，搜索数据分页要置为第一页
