import Icon from 'uxcore-icon';
import Popover from 'uxcore-popover';
import CheckboxGroup from 'uxcore-checkbox-group';
import classnames from 'classnames';
import CalNum from './calNum';
import BigImg from './bigImg';
import './asset.less';

const Item = CheckboxGroup.Item;
// 组件
class Asset extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			active: false,
			num: 0,
		};
		this.add = this.add.bind(this);
		this.decrease = this.decrease.bind(this);
	}
	// Tab切换导致组件重新渲染
	componentDidMount() {
		const activeAsset = (this.props.selectedAsset && this.props.selectedAsset.filter((list) => list.modelDetail === this.props.resDeviceInfo.modelDetail)) || [];
		if (activeAsset.length === 0) {
			this.setState({
				active: false,
				num: 0,
			});
		} else {
			this.setState({
				active: true,
				num: activeAsset[0].num,
			});	
		}
	}
	// 传递来新的props触发
	componentWillReceiveProps(nextProps) {
		/**
		 * 
		 * 这里说的不会造成第二次的渲染，并不是说这里的setState不会生效。在这个方法里调用setState会在组件更新完成之后在render方法执行之前更新状态，
		 * 将两次的渲染合并在一起。可以在componentWillReceiveProps执行setState，但是如果你想在这个方法里获取this.state得到的将会是上一次的状态。
		 */
		
		// 过滤出当前的
		const activeAsset = (nextProps.selectedAsset && nextProps.selectedAsset.filter((list) => list.modelDetail === nextProps.resDeviceInfo.modelDetail)) || [];
		if (activeAsset.length === 0) {
			this.setState({
				active: false,
				num: 0,
			});
		} else {
			this.setState({
				active: true,
				num: activeAsset[0].num,
			});	
		}
	}
	add(num) {
		if (this.state.active) {
			this.props.add(this.props.resDeviceInfo, num);
		}
	}
	decrease() {
		if (this.state.active) {
			this.props.decrease(this.props.resDeviceInfo);
		}
	}
	render() {
		const {
			resDeviceInfo,
			showClose,
			radioOrCheck,
			selectedAsset,
			selectLocationText,
			is11,
		} = this.props;
		const overlay = (
			<div className="m4-info-content">
				超出岗位配置，需要部门M4审批
				<span onClick={this.props.showDialogInfo}>[配置标准]</span>
			</div>
		);
		let stockNumber = null;
		if (resDeviceInfo.stockNumber >= 10 || is11) {
			stockNumber = <div style={{ paddingLeft: '38px', color: '#666', opacity: 0.8 }}>库存充足</div>;
		} else if (resDeviceInfo.stockNumber > 0) {
			stockNumber = <div style={{ paddingLeft: '38px', color: '#F37327' }}>库存紧张，剩余{resDeviceInfo.stockNumber}</div>;
		} else {
			stockNumber = <div style={{ paddingLeft: '38px', color: '#F37327' }}>所选区域无库存</div>;
		}
		return (
			<div className={classnames('device-container', { active: this.state.active })}>
				<div className={classnames('device-header', { closeBtn: showClose })}>
					{radioOrCheck === 'checkbox' ? (
						<CheckboxGroup
							className="check-asset"
							onChange={this.props.radioOrCheckChange.bind(null, resDeviceInfo)}
							value={selectedAsset[0] && selectedAsset[0].id.toString()}
							disabled={selectLocationText ? is11 ? false : resDeviceInfo.stockNumber <= 0 : false}
						>
							<Item value={resDeviceInfo.id + ''} text={resDeviceInfo.modelDetail} />
						</CheckboxGroup>
					) : (<CheckboxGroup
						className="check-asset"
					>
						<Item text={resDeviceInfo.modelDetail} />
					</CheckboxGroup>)}
					{showClose ? 
						<div className="close-box">
							<Icon onClick={this.props.closeAsset.bind(null, resDeviceInfo)} name="guanbi" className="close-btn" />
						</div> : 
						resDeviceInfo.authority ? '' : 
							<Popover overlay={overlay} placement="bottomRight" overlayClassName="asset-m4-info">
								<div className="m4-info">
									<Icon name="jinggao-full" className="icon" />
								</div>
							</Popover>
					}
				</div>
				<div className="describe">{resDeviceInfo.configureMsg}</div>
				{selectLocationText ? stockNumber : ''}
				<div className="img-num">
					<div className="img-box">
						<span>
							<BigImg original={'/workflow/common/getFile.json?path=' + resDeviceInfo.bigImgPath1} src={'/workflow/common/getFile.json?path=' + resDeviceInfo.smallImgPath1} />
						</span>
						{resDeviceInfo.smallImgPath2 ? (
							<span>
								<BigImg src={'/workflow/common/getFile.json?path=' + resDeviceInfo.smallImgPath2} original={'/workflow/common/getFile.json?path=' + resDeviceInfo.bigImgPath2} />
							</span>
						) : ''}
					</div>
					<CalNum num={this.state.num} add={this.add} decrease={this.decrease} className="select-num" />
				</div>
			</div>
		);
	}
}

Asset.defaultProps = {
	radioOrCheck: 'checkbox', // 默认单选
	resDeviceInfo: {}, // 一个资产信息
	selectAssetRadio: '', // 单选 --- 选中的资产
	radioOrCheckChange: () => {}, // 选择函数
	// authority: true, // true不显示M4提示，false显示
	showDialogInfo: () => {},
};

export default Asset;
