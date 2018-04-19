import Icon from 'uxcore-icon';
import classnames from 'classnames';
import './calNum.less';

class CalNum extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { className } = this.props;
		return (
			<div 
				className={classnames('num-box', {
					[className]: !!className,
				})}
			>
				<span className="dec">
					<span className="line" />
				</span>
				<span className="num">1</span>
				<span className="add"><Icon name="zengjia1" /></span>
			</div>
		);
	}
}

export default CalNum;
