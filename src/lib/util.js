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
const fsn = [ 'fullscreenEnabled', 'webkitFullscreenEnabled',
  'mozFullScreenEnabled', 'msFullscreenEnabled' ]
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

export function fullscreenEnabled () {
  for (let e of fsn) {
    if (document[e] !== undefined) {
      return document[e]
    }
  }
  return false
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
    let e = document['on' + p + name]
    if (e !== undefined) {
      return p + name
    }
  }
  return undefined
}

export function isMobile () {
  return (window.orientation !== undefined)
}

export function isWebkit () {
  return navigator.userAgent.match(/webkit/i) !== null
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

// inspired by
// https://davidwalsh.name/detect-scrollbar-width
export function scrollbarWidth (className) {
  // Create the measurement node
  let scrollDiv = document.createElement('div')
  scrollDiv.style.width = '100px'
  scrollDiv.style.height = '100px'
  scrollDiv.style.overflow = 'scroll'
  scrollDiv.style.position = 'absolute'
  scrollDiv.style.top = '-9999px'
  if (className) {
    scrollDiv.className = className
  }
  document.body.appendChild(scrollDiv)
  console.log('scrolldiv:', scrollDiv)

  // Get the scrollbar width
  let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth

  // Delete the DIV
  document.body.removeChild(scrollDiv)

  return scrollbarWidth
}

