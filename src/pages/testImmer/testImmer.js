import produce from 'immer';
import BigImg from 'lxq-react-zoom';
import moment from 'moment';

class TestImmer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	componentDidMount() {
		console.log(moment(1523462400000).format('YYYY-MM-DD'));
		const obj = {
			a: 1,
			b: 2,
		};
		console.log(obj, '1');
		const obj4 = obj;
		obj4.a = '8';
		console.log(obj, '2');
		const arr = [{
			a: 1,
			b: {
				b1: 'b1',
			},
		}];
		
		const newObj = produce(obj, (draft) => {
			draft.a = 'a';
		});
		
		console.log(obj, 'obj');
		console.log(newObj, 'newObj');

		const newArr = produce(arr, draft => {
			draft[0].b.b1 = '333';
		});
		console.log(arr, 'arr');
		console.log(newArr, 'newArr');
		const newProxy = new Proxy(obj, {
			get(target, key) {
				console.log(target, key);
			},
		});
		newProxy.a;

		function testImmer(callback) {
			console.log(callback(obj), 'callback');
		}
		testImmer(produce((state) => {
			state.c = 9;
		}));
	}
	render() {
		return (
			<div>
				TestImmer
				<BigImg original="https://img.alicdn.com/tfs/TB1Jq7qmbSYBuNjSspiXXXNzpXa-1024-768.jpg" src="https://img.alicdn.com/tfs/TB1_ME1mf5TBuNjSspcXXbnGFXa-250-187.jpg" />
			</div>
		);
	}
}

export default TestImmer;
