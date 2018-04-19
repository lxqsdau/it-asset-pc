import { http } from '../../lib/http';

class AssetDescribe extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			imgPath: '',
		};
	}
	componentDidMount() {
		http.get('/linkage/assetCategory/selectReource.json?id=' + this.props.data.categoryIdString).then((res) => {
			this.setState({
				imgPath: res.picList[0] && res.picList[0].path,
			});
		});
	}
	render() {
		const { data } = this.props;
		const { imgPath } = this.state;
		return (
			<div className="assetDescribe-wrapper">
				<div className="img-content"><img alt="暂无图片" src={'/workflow/common/getFile.json?path=' + imgPath} /></div>
				<div className="asset-info">
					<p>名&nbsp;&nbsp;&nbsp;&nbsp;称：<span className="asset-name"><a href={'/workflow/myassets/detail.htm?resource_id=' + data.resourceId} target="_blank">{data.categoryName}</a></span></p>
					<p>特&nbsp;&nbsp;&nbsp;&nbsp;征：<span>{data.feature}</span></p>
					{/* <p>使用人：<span className="asset-user"><a target="_blank" href={'https://work.alibaba-inc.com/u/' + data.user}>{data.userName}</a></span></p> */}
				</div>
			</div>
		);
	}
}

export default AssetDescribe;
