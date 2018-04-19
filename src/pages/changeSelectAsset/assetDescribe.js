
class AssetDescribe extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		const { data } = this.props;
		return (
			<div className="assetDescribe-wrapper">
				<div className="img-content"><img alt="暂无图片" src={'/public/images/category_pic/' + this.props.data.categoryIdString + '.jpg'} /></div>
				<div className="asset-info">
					<p>名&nbsp;&nbsp;&nbsp;&nbsp;称：<span className="asset-name"><a target="_blank" href={'/workflow/myassets/detail.htm?resource_id=' + data.id}>{data.categoryName}</a></span></p>
					<p>特&nbsp;&nbsp;&nbsp;&nbsp;征：<span>{data.feature}</span></p>
					<p>使用人：<span className="asset-user"><a target="_blank" href={'https://work.alibaba-inc.com/u/' + data.user}>{data.userName}</a></span></p>
				</div>
			</div>
		);
	}
}

export default AssetDescribe;
