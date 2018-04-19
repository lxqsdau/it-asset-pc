import Form from 'uxcore-form';
import Icon from 'uxcore-icon';
import './xujieSelect.less';

const { NumberInputFormField, Validators } = Form;
class XujieSelect extends React.Component {
	constructor(props) {
		super(props);
		this.formData = this.formData.bind(this);
	}
	formData() {
		return this.xujieTime.getValues().pass;
	}
	render() {
		// temp("temp", "日常临时借用", 30), project("project", "项目借用", 90), special("special", "双11,12专项", 90),
		const { data } = this.props;
		const { reBorrowType } = data.assetDescribe;
		const maxDay = reBorrowType === '日常临时借用' ? 30 : 90;
		return (
			<div className="xujie-select-box">
				<div className="top">
					<div className="img"><img alt="暂无图片" src={'/public/images/category_pic/' + data.assetDescribe.categoryIdString + '.jpg'} /></div>
					<div className="xujie-info">
						<p>名&nbsp;&nbsp;&nbsp;&nbsp;称：<span className="asset-name">{data.assetDescribe.categoryName}</span></p>
						<p>特&nbsp;&nbsp;&nbsp;&nbsp;征：<span>{data.assetDescribe.feature}</span></p>
						<p>借用类型：<span className="asset-user">{data.assetDescribe.reBorrowType}</span></p>
					</div>
				</div>
				<div className="bottom">
					<Form className="length-form" ref={(c) => { this.xujieTime = c; }} jsxonChange={this.props.xujieDayChange.bind(null, data.assetDescribe.id)}>
						<NumberInputFormField
							jsxname="cycle" 
							jsxlabel="续借时长" 
							jsxplaceholder="请填写"
							jsxrules={[
								{ validator: Validators.isNotEmpty, errMsg: '不能为空' },
								{ validator(value) { return value <= maxDay; }, errMsg: `最长${maxDay}天` },
							]} 
						/>
					</Form>
					<span className="time-tip">/天（最长可借用{maxDay}天）</span>
				</div>
				<div className="close-box">
					<Icon onClick={this.props.closeAsset.bind(null, data)} name="guanbi" className="close-btn" />
				</div>
			</div>
		);
	}
}
export default XujieSelect;
