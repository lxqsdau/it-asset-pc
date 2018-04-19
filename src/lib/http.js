import axios from 'axios';

export const wrapInterceptors = (http) => {
	http.interceptors.response.use(
		(response) => { // 响应成功
			const result = response.data;
			return Promise.resolve(result); // then的第一个回调函数接受
		// return Promise.reject("内容") // then 的第二个回调函数接受
		},
		(error) => { // 接口异常
			console.error('http error', error);
		},
	);
	return http;
};
export const http = wrapInterceptors(axios.create({
	baseURL: '',
}));

// 接口形式
/**
 * {  "content" {currentPage: 1, data: [{},{}], totalCount: 30},
 *    "errorCode": "",
 *    "errorMsg": "",
 *    "success": true
 * }
 */
