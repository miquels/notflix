/*
 *	util	Utility functions.
 *
 *	util.joinpath()
 *	util.FullScreen()
 *	util.isFullScreen()
 *	util.cleanURL()
 */

export function joinpath() {
	var ret = [];
	for (var a in arguments) {
		var p = arguments[a];
		if (!p || p === '')
			continue;
		if (p.match(/^([a-z]+:|\/)/)) {
			// absolute.
			p = p.replace(/\/+$/, '');
			ret = [];
		} else {
			p = p.replace(/^\/+/, '').replace(/\/+$/, '');
		}
		if (p !== '')
			ret.push(p);
	}
	var r = ret.join('/');
	if (r.substr(0, 6) == 'webdav')
		r = 'http' + r.substr(6);
	return r;
}

export function isFullScreen() {
	var fs = (document.fullScreenElement &&
            document.fullScreenElement !== null)
       			|| document.mozFullScreen
       			|| document.webkitIsFullScreen;
  var fh = screen.height === window.innerHeight &&
           screen.height === window.outerHeight;
  return fs || fh;
}

export function setFullScreen(elem, enable) {
	var m;
	if (elem && enable !== false) {
		m = [	'requestFullscreen', 'msRequestFullscreen',
				'mozRequestFullScreen', 'webkitRequestFullscreen' ];
	} else {
		m = [	'exitFullscreen', 'msExitFullscreen',
				'mozCancelFullScreen', 'webkitExitFullscreen' ];
		elem = document;
	}
	for (var f in m) {
		if (elem[m[f]]) {
			elem[m[f]]();
			break;
		}
	}
}

// To prevent redirects, remove double slashes,
// and make sure the url ends in / for dirs.
export function cleanURL(url, isDir, callerName) {
	// var oURL = url;
	var s = /^([a-z]+:\/\/|\/\/|)(.*)/.exec(url);
	if (s) {
		url = s[1] + s[2].replace(/\/+/g, '/');
	}
	if (isDir && !url.match(/\/$/))
		url += '/';
	// if (callerName && url != oURL)
	// 	console.log('cleanURL:', callerName, oURL, ' -> ', url);
	return url;
}

