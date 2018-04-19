import './replacePeople.less';

class ReplacePeople extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	render() {
		const { userList } = this.props;
		return (
			<div title={userList.name} className="replace-people">
				<div className="avatar">
					<img alt="" src={userList.avatar} />
				</div>
				<div className="info">
					<p>{userList.name}{userList.nickNameCn ? '(' + userList.nickNameCn + ')' : ''}</p>
					<p className="last">{userList.deptDesc}</p>
				</div>
			</div>
		);
	}
}
export default ReplacePeople;
