// Map转数组
function mapToArray(map) {
	const arr = [];
	map.forEach((value, key) => {
		arr.push({
			type: key,
			info: value,
		});
	});
	return arr;
}
// 对象转数组
function objToArray(obj) {
	const arr = Object.keys(obj).map((key) => ({
		text: obj[key], // [{}, {}]
		value: key, // 笔记本电脑
	}));
	return arr;
}

// 特殊情况，获取地点，text == value
function locationObjToArray(obj) {
	const arr = Object.keys(obj).map((key) => ({
		text: obj[key],
		value: obj[key],
	}));
	return arr;
}

// 字符串不足6为，前面补全
function stringFormat(str) {
	const { length } = str;
	if (length < 6) {
		const cha = 6 - length;
		for (let i = 0; i < cha; i += 1) {
			str = '0' + str.toString();
		}
	}
	return str;
}
export { mapToArray, objToArray, locationObjToArray, stringFormat };

