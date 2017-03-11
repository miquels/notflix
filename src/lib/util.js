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
    if (p.match(/^([a-z]+:|\/)/)) {
      // starts with method: or /
      if (ret.length > 0 && ret[0].match(/^[a-z]+:/)) {
        ret.splice(1)
      } else {
        ret = []
      }
    }
    if (ret.length > 0) {
      p = p.replace(/^\/+/, '')
    }
    if (a < args.length - 1) {
      p = p.replace(/\/+$/, '')
    }
    ret.push(p)
  }
  return ret.join('/')
}

const fse = [ 'fullscreenElelement', 'webkitFullscreenElement',
  'mozFullScreenElement', 'msFullscreenElement' ]
const rfs = [ 'requestFullscreen', 'webkitRequestFullscreen',
  'mozRequestFullScreen', 'msRequestFullscreen' ]
const efs = [ 'exitFullscreen', 'webkitExitFullscreen',
  'mozCancelFullScreen', 'msExitFullscreen' ]
const pfs = [ '', 'webkit', 'moz', 'ms' ]

export function fullscreenElement () {
  for (let e of fse) {
    if (document[e] !== undefined) {
      return document[e]
    }
  }
  return null
}

export function isFullscreen () {
  return fullscreenElement() !== null
}

export function requestFullscreen (elem) {
  for (let e of rfs) {
    if (elem[e] !== undefined) {
      return elem[e]()
    }
  }
}

export function exitFullscreen () {
  for (let e of efs) {
    if (document[e] !== undefined) {
      return document[e]()
    }
  }
}

export function fullscreenEvent (name) {
  for (let p of pfs) {
    console.log('fullscreenEvent', name, document['on' + p + name])
    let e = document['on' + p + name]
    if (e !== undefined) {
      return p + name
    }
  }
  return undefined
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

