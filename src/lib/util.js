/*
 *  util  Utility functions.
 *
 *  util.joinpath()
 *  util.FullScreen()
 *  util.isFullScreen()
 *  util.cleanURL()
 */

export function joinpath (...args) {
  let ret = []
  for (let a in args) {
    let p = args[a]
    if (!p || p === '') {
      continue
    }
/*
    if (p.match(/^([a-z]+:|\/)/)) {
      // absolute.
      p = p.replace(/\/+$/, '')
      ret = []
    } else {
      p = p.replace(/^\/+/, '').replace(/\/+$/, '')
    }
*/
    p = p.replace(/^\/+/, '').replace(/\/+$/, '')
    if (p !== '') {
      ret.push(p)
    }
  }
  return ret.join('/')
}

export function isFullScreen () {
  let fs = (document.fullScreenElement &&
            document.fullScreenElement !== null) ||
            document.mozFullScreen ||
            document.webkitIsFullScreen
  let fh = screen.height === window.innerHeight &&
           screen.height === window.outerHeight
  return fs || fh
}

export function setFullScreen (elem, enable) {
  let m
  if (elem && enable !== false) {
    m = [ 'requestFullscreen', 'msRequestFullscreen',
      'mozRequestFullScreen', 'webkitRequestFullscreen' ]
  } else {
    m = [ 'exitFullscreen', 'msExitFullscreen',
      'mozCancelFullScreen', 'webkitExitFullscreen' ]
    elem = document
  }
  for (let f in m) {
    if (elem[m[f]]) {
      elem[m[f]]()
      break
    }
  }
}

// To prevent redirects, remove double slashes,
// and make sure the url ends in / for dirs.
export function cleanURL (url, isDir) {
  let s = /^([a-z]+:\/\/|\/\/|)(.*)/.exec(url)
  if (s) {
    url = s[1] + s[2].replace(/\/+/g, '/')
  }
  if (isDir && !url.match(/\/$/)) {
    url += '/'
  }
  return url
}

