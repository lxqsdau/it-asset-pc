function parseURL(url) {
	const a = document.createElement('a');
	a.href = url;
	return {
		source: url,
		protocol: a.protocol.replace(':', ''),
		host: a.hostname,
		port: a.port,
		query: a.search,
		params: (() => {
			const ret = {};
			const seg = a.search.replace(/^\?/, '').split('&');
			const len = seg.length;
			let i = 0;
			let s;
			for (;i < len; i++) {
				if (!seg[i]) { continue; }
				s = seg[i].split('=');
				ret[s[0]] = s[1];
			}
			return ret;
		})(),
	};
}

export default { parseURL };
