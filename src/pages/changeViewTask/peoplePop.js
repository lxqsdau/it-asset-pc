import Popover from 'uxcore-popover';
import { http } from '../../lib/http';
import './peoplePop.less';

class PeoplePop extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			personInfo: {}, // 员工信息
		};
		this.handleMouseOver = this.handleMouseOver.bind(this);
	}
	// 鼠标悬浮获取员工信息
	handleMouseOver(workNum) {
		http.get('/workflow/myassets/nikeName.json?workNo=' + workNum).then((res) => {
			this.setState({
				personInfo: res,
			});
		});
	}
	render() {
		const { 
			person,
			peopleIcon,
			showLine,
		} = this.props;
		const { personInfo } = this.state;
		const overlay = (
			<div className="peopleInfoContent">
				<p>部门：{personInfo.deptName}</p>
				<table>
					<tbody>
						<tr>
							<td>职位：{personInfo.postName}</td>
							<td>工号：{personInfo.workNo}</td>
						</tr>
						<tr>
							<td>分机：{personInfo.indirectPhone}</td>
							<td>手机：{personInfo.mobile}</td>
						</tr>
						<tr>
							<td>旺旺：{personInfo.wangwang}</td>
							<td>邮箱：<a href={`mailto:${personInfo.email}`}>{personInfo.email}</a></td>
						</tr>
					</tbody>
				</table>
			</div>
		);
		if (person === '资产小助手') {
			return <span>资产小助手</span>;
		}
	
		if (Object.prototype.toString.call(person) === '[object Array]') {
			if (showLine) {
				const perNameNumShowLine = person[0].split(',');
				return (<Popover placement="bottom" overlay={overlay}>
					<a className="personPop" href={`https://work.alibaba-inc.com/u/${perNameNumShowLine[1]}`} target="_blank">
						<span onMouseOver={() => this.handleMouseOver(perNameNumShowLine[1])} className={`${this.props.className || ''}`}>{peopleIcon ? <i className="peopleIcon" /> : ''}{perNameNumShowLine[0]}</span>
					</a>
				</Popover>);
			}
			const result = person.map((per) => {
				const perNameNum = per.split(',');
				if (!perNameNum[0] || !perNameNum[1]) {
					return <span style={{ lineHeight: '22px' }}>{per}</span>;
				}
				return (
					<Popover placement="bottom" overlay={overlay}>
						<p className="personPop">
							<a href={`https://work.alibaba-inc.com/u/${perNameNum[1]}`} target="_blank">
								<span onMouseOver={() => this.handleMouseOver(perNameNum[1])} className={`${this.props.className || ''}`}>{peopleIcon ? <i className="peopleIcon" /> : ''}{perNameNum[0]}</span>
							</a>
						</p>
					</Popover>
				);
			});
			// }
			
			return <span>{result}</span>;
		}
		if (person) {
			// 从person分离工号和人名
			if (person.indexOf('**') !== -1) {
				const _perNameNum = person.split('**');
				const _perNameNum2 = _perNameNum[1].split(',');
				return (
					<div className="_perNameNum2">
						<span>{_perNameNum[0]}</span>
						<Popover placement="bottom" overlay={overlay}>
							<a className="personPop" href={`https://work.alibaba-inc.com/u/${_perNameNum2[2]}`} target="_blank">
								<span onMouseOver={() => this.handleMouseOver(_perNameNum2[2])} className={`${this.props.className || ''}`}>{peopleIcon ? <i className="peopleIcon" /> : ''}{_perNameNum2[0]}</span>
							</a>
						</Popover>
					</div>
				);
			}
			const perNameNum = person.split(',');
			if (!perNameNum[0] || !perNameNum[1]) {
				return <span>{person}</span>;
			}
			return (<Popover placement="bottom" overlay={overlay}>
				<a className="personPop" href={`https://work.alibaba-inc.com/u/${perNameNum[1]}`} target="_blank">
					<span onMouseOver={() => this.handleMouseOver(perNameNum[1])} className={`${this.props.className || ''}`}>{peopleIcon ? <i className="peopleIcon" /> : ''}{perNameNum[0]}</span>
				</a>
			</Popover>);
		}
		return <span />;
	}
}
export default PeoplePop;
/**
 * 2 等待领用不显示
 * 3 加载中
 */
