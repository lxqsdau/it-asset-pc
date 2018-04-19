import Icon from 'uxcore-icon';
import CalNum from './calNum';
import './selectAsset.less';

class SelectAsset extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
		};
	}
    
	render() {
		const props = this.props;
		const { deviceInfo, radioOrCheck, closeAsset } = props;
		return (
			<div className="selectAsset-box">
				<div className="img-box">
					<img alt="" data-action="zoom" data-original={'/workflow/common/getFile.json?path=' + deviceInfo.bigImgPath1} src={'/workflow/common/getFile.json?path=' + deviceInfo.smallImgPath1} />
				</div>
				<div className="right-describe">
					<span className="asset-name">{deviceInfo.modelDetail}</span>
					{radioOrCheck === 'radio' ? <p className="asset-num">1</p> : <CalNum className="selectAsset-num" />}
				</div>
				<div onClick={closeAsset.bind(null, deviceInfo)} className="close">
					<Icon name="guanbi" />
				</div>
			</div>
		);
	}
}

SelectAsset.defaultProps = {
	deviceInfo: {}, // 资产信息
	radioOrCheck: 'radio', // 默认单选
	closeAsset: () => {},
};

export default SelectAsset;
