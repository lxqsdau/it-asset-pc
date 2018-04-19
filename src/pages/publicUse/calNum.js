import Icon from 'uxcore-icon';
import classnames from 'classnames';
import './calNum.less';

class CalNum extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { className, num } = this.props;
		return (
			<div 
				className={classnames('num-box', {
					[className]: !!className,
				})}
			>
				<span onClick={this.props.decrease} className="dec">
					<span className="line" />
				</span>
				<span className="num">{num || 0}</span>
				<span onClick={this.props.add} className="add"><Icon name="zengjia1" /></span>
			</div>
		);
	}
}

export default CalNum;
