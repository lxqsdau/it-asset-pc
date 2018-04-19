import PropTypes from 'prop-types';

class TabPane extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="tab-TabPane">{this.props.children}</div>
		);
	}
}

TabPane.defaultProps = {
	tab: '',
	value: '',
	tabNum: '',
};

TabPane.propTypes = {
	tab: PropTypes.string,
	value: PropTypes.string,
};

export default TabPane;
