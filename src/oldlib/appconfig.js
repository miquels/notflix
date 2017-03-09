/*
 *	Load and store config.
 */

var config = {};

export function load(name) {
	var cfgurl = location.pathname.replace(/[^\/]*$/, name);
	console.log('loading config from ' + cfgurl);
	return fetch(cfgurl, {
		redirect: 'follow'
	}).then((resp) => {
		if (!resp.ok) {
			throw new RangeError('unexpected HTTP code ' + resp.status);
		}
		return response.json();
	}).then((json) => {
		config = json;
		return config;
	});
}

export function get() {
	return config;
}

