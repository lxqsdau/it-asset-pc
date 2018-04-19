import PropTypes from 'prop-types';
import classnames from 'classnames';
import TabPane from './TabPane';
import './Tabs.less';

class Tabs extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inkBarWidth: 0,
			inkBarTranslate: 0,
			tabActiveIndex: 0, // 激活的tab
		};
		this.lastTabPos; // 第一个tab的位置，只需要开始保存下就可以
		this.tabIndex = 0;
	}

	componentDidMount() {
		// setTimeout(() => {
		// 	if (this.tab0) {
		// 		const firstTabRect = this.tab0.getBoundingClientRect();
		// 		this.lastTabPos = firstTabRect.left;
		// 		this.setState({
		// 			inkBarWidth: firstTabRect.width,
		// 		});
		// 	}
		// }, 10);
	}
	componentWillReceiveProps(newProps) {
		if (this.tab0 && this.tabIndex === 0) {
			this.tabIndex = 1;
			const firstTabRect = this.tab0.getBoundingClientRect();
			// this.lastTabPos = firstTabRect.left;
			this.setState({
				inkBarWidth: firstTabRect.width,
			});
		}
	}
	// 加载子元素
	processContent() {
		const me = this;
		const elements = React.Children.map(me.props.children, (child, index) => React.cloneElement(child, {}));
		return elements;
	}
	// 加载tab
	processTabNav() {
		const me = this;
		const TabsElement = React.Children.map(me.props.children, (child, index) => (
			<div 
				onClick={me.tabClick.bind(this, child.props.value, index)} 
				className={classnames('asset-tab-tab', {
					[`asset-tab-tab-${index}`]: true,
					'asset-tab-tab-active': this.state.tabActiveIndex === index,
				})}
				ref={(c) => { me[`tab${index}`] = c; }}
			>
				{child.props.tabNum == 0 ? '' : <div className="asset-tab-num">{child.props.tabNum }</div>}
				{child.props.tab}
			</div>
		));
		return TabsElement;
	}
	// tab点击
	tabClick(value, index, e) {
		const clickEle = e.target;
		const clickEleSize = clickEle.getBoundingClientRect();
		if (!this.lastTabPos) {
			this.lastTabPos = this.tab0.getBoundingClientRect().left;
		}
		// 获取宽度
		const eleWidth = clickEleSize.width;
		// 获取位置
		const eleLeft = clickEleSize.left;
		// 移动ink-bar
		// 计算差值，正值 右移。负值-左移动
		const inkBarCha = eleLeft - this.lastTabPos;
		this.setState({
			inkBarWidth: eleWidth,
			inkBarTranslate: inkBarCha,
			tabActiveIndex: index,
		});
		this.props.onTabClick(value);
	}
	render() {
		const inkBarWidth = this.state.inkBarWidth;
		const inkBarTranslate = this.state.inkBarTranslate;
		const inkBarStyle = {
			width: `${inkBarWidth}px`,
			transform: `translate3d(${inkBarTranslate}px, 0, 0)`,
		};
		return (
			<div className={classnames('asset-tab', {
				[this.props.type]: !!this.props.type,
			})}
			>
				<div className="asset-tab-nav-container">
					<div style={inkBarStyle} className="asset-tab-ink-bar" />
					{this.processTabNav()}
				</div>
				<div className="asset-tab-content">
					{this.processContent()[this.state.tabActiveIndex]}
				</div>
			</div>
		);
	}
}

Tabs.TabPane = TabPane;

Tabs.defaultProps = {
	onChange: () => {},
	onTabClick: () => {},
};

Tabs.propTypes = {
	onChange: PropTypes.func,
	onTabClick: PropTypes.func,
};

export default Tabs;
/**
 * componentDidMount  getBoundingClientRect   有问题。延时没问题
 * 
 */
