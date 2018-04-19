import Icon from 'uxcore-icon';
import Popover from 'uxcore-popover';
import RadioGroup from 'uxcore-radiogroup';
import classnames from 'classnames';
import './asset.less';

const RadioItem = RadioGroup.Item;
class Asset extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		const { deviceInfo, showClose } = this.props;
		
		const overlay = (
			<div className="m4-info-content">
				超出岗位配置，需要部门M4审批
				<span onClick={this.props.showDialogInfo}>[配置标准]</span>
			</div>
		);
		return (
			<div className="device-container">
				<div className={classnames('device-header', { closeBtn: showClose })}>
					<RadioGroup
						className="check-asset"
						onChange={this.props.radioOrCheckChange.bind(null, deviceInfo)}
						value={this.props.selectAssetRadio}
					>
						<RadioItem value={deviceInfo.modelDetailId + deviceInfo.categoryType} text={deviceInfo.modelDetail} />
					</RadioGroup>
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
	closeAsset: () => {},
};

export default Asset;
