
function emit (vnode, name, data) {
  var handlers = (vnode.data && vnode.data.on) ||
                 (vnode.componentOptions && vnode.componentOptions.listeners)
  if (handlers && handlers[name]) {
    let fn = handlers[name].fn || handlers[name]
    fn(data)
  }
}

function onResize (el, binding, v, curSize) {
  if (el.clientWidth === curSize.width &&
      el.clientHeight === curSize.height) {
    return
  }
  curSize.width = el.clientWidth
  curSize.height = el.clientHeight
  emit(v, 'resize', {})

  // sometimes there is an after effect, so check again in 750ms
  if (!el._resizeOnceDelayed) {
    el._resizeOnceDelayed = true
    setTimeout(() => { onResize(el, binding, v, curSize) }, 750)
    return
  }
  el._resizeOnceDelayed = false
}

export default {
  bind (el, binding, v) {
    const curSize = { width: el.clientWidth, height: el.clientHeight }
    const handler = () => onResize(el, binding, v, curSize)

    // call handler on window resize events
    window.addEventListener('resize', handler, false)
    el._resizeHandler = handler

    // call handler on orientation change events
    window.addEventListener('orientationchange', handler, false)

    // call handler when we toggle full screen mode
    document.addEventListener('fullscreenchange', handler, false)

    // call handler when element.style changes.
    var observer = new MutationObserver((mutations) => handler(null))
    observer.observe(el, {
      attributes: true,
      attributeFilter: [ 'style' ]
    })
    el._resizeObserver = observer
  },

  unbind (el) {
    window.removeEventListener('resize', el._resizeHandler, false)
    window.removeEventListener('orientationchange', el._resizeHandler, false)
    window.removeEventListener('fullscreenchange', el._resizeHandler, false)
    el._resizeObserver.disconnect()
  }
}
