/*
 * kodifs.js	Handle movies and TV shows located on a
 *				filesystem using the Kodi/XBMC naming conventions.
 *
 *				http://kodi.wiki/view/Naming_video_files/Movies
 *				http://kodi.wiki/view/Naming_video_files/TV_shows
 *
 * Call as:
 *
 * var KodiFS = require('kodifs.js')
 *
 * var kodifs = new KodiFS({ url: 'http://.....' });
 * var tvshows = kodifs.getshows();
 *
 * var kodifs = new KodiFS({ url: 'http://.....' });
 * var movies = kodifs.getmovies();
 *
 * TODO:		Split up into KodiFS.TVShows and KodiFS.Movies ?
 *
 */

import Http			from './http.js';
import Webdav		from './webdav.js';
import { joinpath }	from './util.js';

// helper: decode season / episode from filename.
function decodeShowName(e, shint) {

	var s = /^(.*)\.([^.]+)$/.exec(e.name);
	if (s === null)
		return null;
	var name = s[1];
	var ext = s[2];

	// pattern: ___.s03e04.___
	s = /^.*[ ._][sS]([0-9]+)[eE]([0-9]+)[ ._].*$/.exec(e.name);
	if (s) {
		name = "Episode " + s[1] + 'x' + s[2];
	}

	// pattern: ___.s03e04e05.___ or ___.s03e04-e05.___
	if (s === null) {
		s = /^.*[. _[sS]([0-9]+)[eE]([0-9]+)-?[eE]([0-9]+)[. _].*$/.exec(e.name);
		if (s) {
			name = 'Episode ' + s[1] + 'x' + s[2] + '-' + s[3];
		}
	}

	// pattern: ___.2015.03.08.___
	if (s === null) {
		s = /^.*[ .]([0-9]{4}[.-][0-9]{2}[.-][0-9]{2})[ .].*$/.exec(e.name);
		if (s) {
			name = "Episode " + s[1];
		}
	}

	// pattern: ___.308.___  (or 3x08) where first number is season.
	if (s === null) {
		s = /^.*[ .]([0-9]{1,2})x?([0-9]{2})[ .].*$/.exec(e.name);
		if (s && (shint === null || s[1] === shint)) {
			var se = s[1] + 'x' + s[2];
			if (s[1].length < 2)
				se = '0' + se;
			name = "Episode " + se;
		}
	}
	return {
		name: name,
		ext: ext,
	};
}

// helper: turn list of directories into list of shows.
function builddirlist(base, list, data) {
		if (data.time)
			base.time = data.time;
		for (var i in data.items) {
			var s = data.items[i];
			if (s.path.substr(0, 1) === '.' || s.path.match(/^\+%20.+%20\+\/$/))
				continue;
			list[s.name] = s;
		}
		return list;
}

var isMovie = /^(.*)\.(divx|mov|mp4|MP4|m4u|m4v)$/;
var isImage = /^-(banner|fanart|folder|poster|)\.(png|jpg|jpeg|tbn)/;
var isInfo = /^(\..*)?\.(nfo|tbn|srt)/;

// helper: turn list of files into basic movie information.
function buildmovie(movie, data) {

	//console.log('buildmovie', movie);

	if (data.time)
		movie.time = data.time;

	var base = '';
	for (let i in data.items) {
		var s = isMovie.exec(data.items[i].path);
		if (s) {
			movie.video = s[0];
			base = s[1];
			break;
		}
	}
	if (base === '')
		return movie;
	var len = base.length;

	for (let i in data.items) {
		var item = data.items[i];
		let n = item.name.slice(0, len);
		if (n !== base)
			continue;

		n = item.path.slice(len);
		let s = isImage.exec(n);
		if (s) {
			movie[s[1]] = item.path;
			continue;
		}

		s = isInfo.exec(n);
		if (s) {
			switch(s[2]) {
				case 'tbn':
					movie.poster = item.path;
					break;
				case 'nfo':
					movie.nfo = item.path;
					break;
				case 'srt':
					if (movie.subs === undefined)
						movie.subs = [];
					movie.subs.push({
						lang: s[1] ? s[1].replace(/^\./, '') : '',
						path: item.path,
					});
					break;
			}
		}
	}

	//console.log(movie);
  return movie;
}

// helper: turn list of files into basic show information.
function buildshow(show, data) {

	if (data.time)
		show.time = data.time;

	// first build list of seasons.
	show.seasons = {};
	for (let i in data.items) {
		let e = data.items[i];
		if (e.name.match(/^S[0-9]+/)) {
			show.seasons[e.name] = {
				name: e.name,
				_path: e.path,
				sortName: e.name,
			};
		}
	}

	// now loop over files in this directory.
	for (let i in data.items) {

		let e = data.items[i];

		// NFO file
		if (e.name === 'tvshow.nfo') {
			show.nfo = e.path;
			continue;
		}

		// images.
		let s;
		let lowqual = false;
		let imgtype = null;

		// Season image?
		s = /^(lowqual-|)season([0-9]+)-?([a-z]+|)\.(jpg|jpeg|png|tbn)/.exec(e.name);
		if (s) {
			let ctx = show.seasons['S' + s[2]];
			if (!ctx)
				continue;
			lowqual = s[1] === 'lowqual'
			imgtype = s[3] !== '' ? s[3] : 'thumb';
			if (imgtype && (lowqual || !ctx[imgtype]))
				ctx[imgtype] = e.path;
			continue;
		}

		// General tvshow image?
		s = /^(lowqual-|)(.*)\.(jpg|jpeg|png|tbn)$/.exec(e.name);
		if (s) {
			let ctx = show;
			switch(s[2]) {
				case 'banner':
				case 'fanart':
				case 'folder':
				case 'poster':
					imgtype = s[2];
					break;
				case 'season-all-banner':
					imgtype = 'banner';
					break;
				case 'season-all-poster':
					imgtype = 'poster';
					break;
			}
			lowqual = s[1] === 'lowqual';
			if (imgtype && (lowqual || !ctx[imgtype]))
				ctx[imgtype] = e.path;
		}
	}

  return show;
}

// helper: turn list of files into a season of episodes.
function buildseason(season, data, spath) {

	// console.log('buildseason', season, data, spath)
	let ep = {};
	season.episodes = ep;
	if (data.time)
		season.time = data.time;

	let shint;
	let s = /^S0*(\d+)\/?$/.exec(season.path)
	if (s)
		shint = s[1];

	for (var i in data.items) {

		let e = data.items[i];
		let path = joinpath(spath, e.path)

		// console.log('decodeShowName', e, shint);
		let r = decodeShowName(e, shint);
		if (r === null)
			continue;
		let name = r.name;
		let ext = r.ext;

		if (!ep[name])
			ep[name] = {};

		switch(ext) {
			case 'mkv':
			case 'mp4':
			case 'avi':
				ep[name].video = path;
				if (e.time)
					ep[name].time = e.time;
				ep[name].name = name;
				ep[name].sortName = name;
				break;
			case 'nfo':
				ep[name].nfo = path;
				break;
			case 'tbn':
				ep[name].thumb = path;
				break;
			case 'jpg':
			case 'png':
				if (e.name.match(/-thumb.([^.]+)$/))
					ep[name].thumb = path;
				break;
			case 'srt':
				if (ep[name].subs === undefined)
					ep[name].subs = [];
				let s = /^.*\.(.*)\.srt$/.exec(e.name);
				ep[name].subs.push({
					path: path,
					lang: s ? s[1] : '',
				});
				break;
			default:
				break;
		}
	}

	// delete entries without a video file.
	for (var e in ep) {
		if (!ep[e].video)
			delete ep[e];
	}

	return season;
}

export default class KodiFS {

	url;
	name = "";
	path = '';
	items;

	constructor({ url, proto }) {
		// console.log('constructor called opts is ', opts);
		Object.assign(this, { url, proto })
		if (this.url.match(/^(web|)davs?:/)) {
			this.proto = 'webdav';
			this.url = this.url.replace(/^(web|)dav/, "http");
		}
		this.dirIndex = (this.proto === 'webdav') ? Webdav : Http;
	};

	// Get a directory listing of tvshows / movies.
	dirlist(type) {

		if (this.items !== undefined) {
			// console.log("kodifs.dirlist: returning cached " + type);
			return Promise.resolve(this.items);
		}

		// console.log("kodifs.dirlist: requesting " + type + " from server");
		var wd = new this.dirIndex();
		var dfd = wd.listdir(this.url)
		  .then((data) => {
			//console.log("got it calling builddirlist", this.url, data);
			this.items = {};
			return builddirlist(this, this.items, data);
		});

		return dfd;
	};

	getshows(args) {
		return this.dirlist('shows');
	};

	getmovies(args) {
		return this.dirlist('movies');
	};

	// Get gets the basic info for one tvshow.
	getOneShow(showname) {

		var r = this.getshows().then((shows) => {

			var show = shows[showname];
			if (!show) {
				console.log("kodifs.getOneShow: showname " +
								showname  + " not found");
				return Promise.reject(new Error('show not found'));
			}
			if (show.seasons !== undefined) {
				console.log("kodifs.getOneShow: returning cached " + showname);
				return Promise.resolve(show);
			}

			console.log("kodifs.getOneShow: requesting " +
								showname + " from server");
			var url = joinpath(this.url, show.path);
			var wd = new this.dirIndex();
			return wd.listdir(url).then(function(data) {
				return buildshow(show, data);
			});
		});

		return r;
	};

	// Gets all the episodes in one season.
	getSeasonEpisodes (showname, seasonname) {

		var r = this.getOneShow(showname).then((show) => {

			var season = show.seasons[seasonname];
			if (!season) {
				console.log("kodifs.getSeasonEpisodes: season " +
								seasonname  + " not found");
				return Promise.reject(new Error('season not found'));
			}

			// already have it?
			if (season.episodes !== undefined) {
				console.log("kodifs.getSeasonEpisodes: returning cached " +
												seasonname, season.episodes);
				return Promise.resolve(show);
			}

			console.log("kodifs.getSeasonEpisodes: requesting " +
							seasonname + " from server");

			var url = joinpath(this.url, show.path, season._path);
			var w = new this.dirIndex();
			return w.listdir(url).then(function(data) {
				buildseason(season, data, season._path);
				return show;
			});
		});

		return r;
	};

	// Get the info for one show.
	getshow(args) {

		return this.getOneShow(args.show).then((show) => {

			// get season info as well ?
			var defers = [];
			if (Object.keys(show.seasons).length > 0 &&
				(args.deep || args.season)) {

				for (var sn in show.seasons) {
					var sname = show.seasons[sn].name;
					if (!args.season || args.season === sname) {
						defers.push(this.getSeasonEpisodes(args.show, sname));
					}
				}
			}

			// no, return right away.
			if (defers.length === 0) {
				return show;
			}

			// yes, wait for all of them to resolve or fail.
			return Promise.all(defers).then(() => show);
		});
	};

	// Get gets the info for one movie.
	getmovie(moviename) {

		var r = this.getmovies().then((movies) => {

			var movie = movies[moviename];
			if (!movie) {
				console.log("kodifs.getmovie: moviename " +
								moviename  + " not found");
				return Promise.reject(new Error('movie not found'));
			}
			if (movie.video) {
				console.log("kodifs.getmovie: returning cached " + moviename);
				return Promise.resolve(movie);
			}

			console.log("kodifs.getmovie: requesting " +
								moviename + " from server");
			var url = joinpath(this.url, movie.path);
			var wd = new this.dirIndex();
			return wd.listdir(url).then((data) => {
				var m = buildmovie(movie, data);
				this.items.movie = m;
				return m;
			});
		});

		return r;
	};
}
