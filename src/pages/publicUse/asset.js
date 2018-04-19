import Icon from 'uxcore-icon';
import Popover from 'uxcore-popover';
import RadioGroup from 'uxcore-radiogroup';
import classnames from 'classnames';
import CalNum from './calNum';
import './asset.less';

const RadioItem = RadioGroup.Item;

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
		const activeAsset = this.props.activeDevice && this.props.activeDevice.filter((list) => list.modelDetail === this.props.deviceInfo.modelDetail);
		// console.log(this.props.activeDevice, 'componentDidMount');
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
		// 过滤出当前的
		const activeAsset = (nextProps.activeDevice && nextProps.activeDevice.filter((list) => list.modelDetail === nextProps.deviceInfo.modelDetail)) || [];
		// console.log(nextProps.activeDevice, 'componentWillReceiveProps');
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
	add() {
		if (this.state.active) {
			this.props.add(this.props.deviceInfo);
		}
	}
	decrease() {
		if (this.state.active) {
			this.props.decrease(this.props.deviceInfo);
		}
	}
	render() {
		const { 
			deviceInfo, 
			showClose, 
			radioOrCheck,
		} = this.props;
		
		const overlay = (
			<div className="m4-info-content">
				超出岗位配置，需要部门M4审批
				<span onClick={this.props.showDialogInfo}>[配置标准]</span>
			</div>
		);
		return (
			<div className={classnames('device-container', { active: this.state.active })}>
				<div className={classnames('device-header', { closeBtn: showClose })}>
					{radioOrCheck === 'radio' ? (
						<RadioGroup
							className="check-asset"
							onChange={this.props.radioOrCheckChange.bind(null, 'radio', deviceInfo)}
							value={this.props.selectAssetRadio}
						>
							<RadioItem value={deviceInfo.modelDetailId + deviceInfo.categoryType} text={deviceInfo.modelDetail} />
						</RadioGroup>
					) : <RadioGroup
						className="check-asset"
					>
						<RadioItem text={deviceInfo.modelDetail} />
					</RadioGroup>}
					{showClose ? 
						<div className="close-box">
							<Icon onClick={this.props.closeAsset.bind(null, deviceInfo)} name="guanbi" className="close-btn" />
						</div> : 
						deviceInfo.authority ? '' : 
							<Popover overlay={overlay} placement="bottomRight" overlayClassName="asset-m4-info">
								<div className="m4-info">
									<Icon name="jinggao-full" className="icon" />
								</div>
							</Popover>
					}
				</div>
				<div className="describe">{deviceInfo.configureMsg}</div>
				<div className="img-num">
					<div className="img-box">
						<span>
							<img data-action="zoom" data-original={'/workflow/common/getFile.json?path=' + deviceInfo.bigImgPath1} alt="" src={'/workflow/common/getFile.json?path=' + deviceInfo.smallImgPath1} />
						</span>
						{deviceInfo.smallImgPath2 ? (
							<span>
								<img data-action="zoom" data-original={'/workflow/common/getFile.json?path=' + deviceInfo.bigImgPath2} alt="" src={'/workflow/common/getFile.json?path=' + deviceInfo.smallImgPath2} />
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
	radioOrCheck: 'radio', // 默认单选
	deviceInfo: {}, // 一个资产信息
	selectAssetRadio: '', // 单选 --- 选中的资产
	radioOrCheckChange: () => {}, // 选择函数
	// authority: true, // true不显示M4提示，false显示
	showDialogInfo: () => {},
};

export default Asset;
