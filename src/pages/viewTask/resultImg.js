
class ResultImg extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	
	render() {
		const { result } = this.props;
		if (result === 'canceled') {
			return (
				<img className="resultImg" alt="" src="https://img.alicdn.com/tfs/TB1btk0intYBeNjy1XdXXXXyVXa-64-26.png" />
			);
		} else if (result === 'disagree') {
			return (
				<img className="resultImg" alt="" src="https://img.alicdn.com/tfs/TB1wGHmihGYBuNjy0FnXXX5lpXa-64-26.png" />
			);
		} else if (result === 'audited') {
			return (
				<img className="resultImg" alt="" src="https://img.alicdn.com/tfs/TB1FXLqioR1BeNjy0FmXXb0wVXa-83-26.png" />
			);
		} else if (result === 'auditing') {
			return (
				<img className="resultImg" alt="" src="https://img.alicdn.com/tfs/TB1Ci_lihGYBuNjy0FnXXX5lpXa-64-26.png" />
			);
		}
		return null;
	}
}
export default ResultImg;
