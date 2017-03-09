/*
 *	NFOData	Get NFO file, parse it into JSON, and return it.
 *			This module also caches the JSON.
 */

import * as util	from './util.js';

var cache = {};
var retry = 120;

export function getNfo(url) {
	if (url == null)
		return Promise.resolve({});

	url = util.cleanURL(url, false, 'nfo.get');
	var c = cache[url];
	var now = (new Date()).getTime();

	// if we have a valid cache entry, return it.
	if (c && c.json)
		return Promise.resolve(c.json);

	// promise not yet resolved?
	if (c && c.pending)
		return c.pending;

	// invalid entry, not yet timed out?
	if (c && c.time > now + retry)
		return Promise.resolve({});

	// get it.
	c = cache[url] = {
		time: now,
		url: url,
	};
	// eslint-disable-next-line no-undef
	c.pending = fetch(url, {
		redirect: 'follow'
	}).then(function(resp) {
		if (!resp.ok) {
			throw new RangeError('unexpected HTTP code ' + resp.status);
		}
		return resp.text();
	}).then(function(text) {
		c.pending = null;
		c.json = parse(text);
		return c.json;
	}).catch((err) => {
		console.log(err);
		return {};
	});
	return c.pending;
}

/*
 *	This function parses an XML NFO file and turns it into
 *	a JSON object.
 *
 *	FIXME: We really should just use one of the xml2json libraries.
 */
function parse(xmlText) {
	let ret = {};

	// console.log('XXX xmlText', xmlText)
	// eslint-disable-next-line no-undef
	let parser = new DOMParser();
	let xml = parser.parseFromString(xmlText, "application/xml");
	if (!xml) {
		console.log('nfo.parse: empty xml doc');
		return null;
	}
	let elem = xml; // .documentElement;
	if (!elem) {
		console.log('nfo.parse: xml.documentElement not set');
		return;
	}
	// console.log('XXX elem', elem)

	let info;
	let tags = [ 'episodedetails', 'tvshow', 'movie' ];
	let tag;
	for (let t in tags) {
	    tag = tags[t];
	    info =  elem.getElementsByTagName(tag);
	    if (info && info[0]) {
	        info = info[0];
	        break;
	    }
	}
	if (!info) {
		console.log('nfo.parse: no episode or tvshow info found in xml');
		return;
	}
	switch (tag) {
		case 'episodedetails':
		case 'tvshow':
			ret.type = 'TV Show';
			break;
		case 'movie':
			ret.type = 'Movie';
			break;
	}

	let list = [ 'title', 'runtime', 'rating', 'year', 'plot', 'genre',
				'mpaa', 'season', 'episode', 'aired', 'studio' ];
	for (let x in list) {
		let u = list[x];
		let elem = info.getElementsByTagName(u);
		//consolelog('parsenfo: ' + u + ' -> ' + (elem ? elem[0] : 'void'));
		if (elem == null || elem[0] == null || elem[0].firstChild == null)
			continue;
		// XXX FIXME HTML escapes? for security? not sure
		//consolelog('parsenfo: final:' + u + ' -> ' + elem[0].firstChild.data);
		ret[u] = elem[0].firstChild.data;
	}
	return ret;
}
