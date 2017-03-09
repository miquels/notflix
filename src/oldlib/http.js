/*
 * http.js		Like webdav, but parses directory listings instead.
 *
 * TODO:		parse date output.
 *
 * Author:		Miquel van Smoorenburg
 *
 */

export default function Http(opts) {
	Object.assign(this, opts);
};

// This function parses the html directory index
function parseindex(htmlText, headers) {

	var ret = { time: null, items: [] };

	var m = headers.get('Last-Modified');
	if (m) {
		var d = Date.parse(m);
		if (!isNaN(d))
			ret.time = d;
	}

	// parse response text into HTML.
	// eslint-disable-next-line no-undef
	var parser = new DOMParser();
	var html = parser.parseFromString(htmlText, "text/html");

	var tags = html.querySelectorAll('a');
	for (var idx = 0; idx < tags.length; idx++) {
		var a = tags[idx];
		var path = a.href;
		if (path.match(/(^\.|^\+|\/.*\/)/))
			return;
		var name = a.text.replace(/^\s*(.*?)\s*/, "$1");
		ret.items.push({
			path: path,
			name: name,
			sortName: name.toLowerCase().replace(/^the +/, ''),
		});
	};

	return ret;
}

Http.prototype = {
	constructor: Http,

	// Listdir. Returns a promise (in the form of a jqXHR).
	listdir: function(url) {

		// prevent redirects.
		if (!url.match(/\/$/))
			url += '/';

		// eslint-disable-next-line no-undef
		return fetch(url, {
			redirect: 'follow'
		}).then((resp) => {
			if (!resp.ok) {
				throw new RangeError('unexpected HTTP code ' + resp.status);
			}
			return { text: resp.text(), headers: resp.headers };
		}).then(({ text, headers }) => {
			return parseindex(text, headers);
		});
	},
};

