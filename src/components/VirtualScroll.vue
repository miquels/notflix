<template>
<div class="virtual-scroll__container" @scroll="scroll()">
  <div class="virtual-scroll__items" :style="itemsStyle">
    <div class="virtual-scroll__visible-items" :style="visibleItemsStyle">
    <component class="virtual-scroll__item"
               v-for="(item, index) in visibleItems"
               :key="itemKey(item, index)"
               :is="rComponent[item.type]"
               :rowKey="itemKey(item, index)"
               :style="{ height: (item.height || rHeight[item.type]) + 'px' }"
               :context="rContext[item.type]"
               :items="item.items"
               :isScrolling="isScrolling"
               :index="start + index">
    </component>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'virtual-scroll',
  model: {
    prop: 'focus',
    event: 'change'
  },
  props: {
    items: { type: Array, default: [] },
    renderers: { type: Object },
    itemHeight: { type: Number, default: 20 },
    focus: { type: [ Number, Object ] }
  },
  data: () => ({
    start: 0,
    end: -1,
    generation: 0,
    itemsStyle: { height: 'auto' },
    visibleItemsStyle: { transformY: 'translateY("0px")' },
    visibleItems: [],
    rHeight: {},
    rComponent: {},
    rContext: {},
    isScrolling: false
  }),
  mounted () {
    this.updateRenderers()
    this.itemsUpdated()
    this.draw()
  },
  watch: {
    items (newItems, oldItems) {
      // console.log('VirtualScroll: items updated')
      let soft = newItems.length > 0 && oldItems.length > 0 &&
                 newItems[0].key === oldItems[0].key
      this.generation++
      this.updateRenderers()
      this.itemsUpdated(soft)
      this.$emit('change', null)
      this.draw(true)
    },
    focus () {
      // console.log('VirtualScroll: focus prop updated to', this.focus)
    }
  },
  methods: {
    itemKey (item, index) {
      return item.key || (this.generation + '_' + (this.start + this.index))
    },
    updateRenderers () {
      for (let r in this.renderers) {
        if (this.renderers[r].component) {
          this.rComponent[r] = this.renderers[r].component
          this.rHeight[r] = this.renderers[r].height || this.itemHeight
          this.rContext[r] = this.renderers[r].context || {}
        } else {
          this.rComponent[r] = this.renderers[r]
          this.rHeight[r] = this.itemHeight
          this.rContext[r] = {}
        }
      }
    },
    scroll () {
      let pos = this.$el.scrollTop
      let now = Date.now()
      let pps = 0
      if (this.lastScrollTm) {
        let dp = Math.abs(pos - this.lastScrollPos)
        let dt = now - this.lastScrollTm
        if (dt < 60) {
          return
        }
        pps = dt === 0 ? 100000 : 1000 * (dp / dt)
      }
      this.lastScrollPos = pos
      this.lastScrollTm = now
      if (pps > 4500) {
        if (this.lastScrollTimer) {
          clearTimeout(this.lastScrollTimer)
        }
        this.lastScrollTimer = setTimeout(this.scroll, 100)
        this.isScrolling = true
      } else {
        this.isScrolling = false
      }
      this.draw()
    },
    getItemHeight (item) {
      let itemHeight = item.height
      if (typeof itemHeight === 'number') {
        return itemHeight
      }
      return this.rHeight[item.type]
    },
    itemsUpdated (dontResetScrollTop) {
      this.itemPos = []
      let h = 0
      for (let i in this.items) {
        this.itemPos.push(h)
        h += this.getItemHeight(this.items[i])
      }
      this.itemsStyle.height = h + 'px'
      // console.log('itemsUpdated: focus:', this.focus)
      if (!this.focus) {
        if (!dontResetScrollTop) {
          this.$el.scrollTop = 0
        }
        return
      }
      // bring a certain item info focus.
      let key
      let offset = 0
      if (typeof this.focus === 'string') {
        key = this.focus
      } else {
        key = this.focus.key
        offset = this.focus.offset
        this.intoView = this.focus.intoView
      }
      // alas, findIndex not commonly supported.
      let index = -1
      for (let i in this.items) {
        if (this.items[i].key === key) {
          index = i
          break
        }
      }
      if (index < 0) {
        this.$el.scrollTop = 0
        return
      }
      this.$el.scrollTop = this.itemPos[index] - offset
    },
    getVisibleArea () {
      let el = this.$el
      return {
        top: el.scrollTop,
        bottom: el.scrollTop + el.clientHeight
      }
    },
    getOffset (key) {
      // alas, findIndex not commonly supported.
      let index = -1
      for (let i in this.items) {
        if (this.items[i].key === key) {
          index = i
          break
        }
      }
      if (index < 0) {
        return 0
      }
      return this.itemPos[index] - this.$el.scrollTop
    },
    binarySearch (top) {
      let start = 0
      let end = this.items.length
      // console.log(`search start ${start} end ${end}`)
      let maxcount = 256
      while (start !== end) {
        let m = Math.floor((start + end) / 2)
        let h = this.getItemHeight(this.items[m])
        let p = this.itemPos[m]
        // console.log(`middle ${m}`)
        if (top >= p && top <= p + h) {
          return m
        }
        if (top < p) {
          end = m
        } else {
          start = m
        }
        if (--maxcount === 0) {
          console.log(`ERROR: binarySearch ${top} looping`)
          return -1
        }
      }
      return -1
    },
    draw (force) {
      let area = this.getVisibleArea()
      let start = this.binarySearch(area.top)
      if (start < 0) {
        this.visibleItems = []
        return
      }
      if (start > 0) {
        start--
      }

      let end = start
      let l = this.items.length
      let pos = this.itemPos[start]
      while (pos < area.bottom && end < l) {
        end++
        pos = this.itemPos[end - 1]
      }
      if (!force && start === this.start && end === this.end) {
        return
      }
      // console.log(`len: ${l}, start: ${start}, end: ${end}, top: ${area.top}, bottom: ${area.bottom}`)

      this.visibleItems = this.items.slice(start, end)
      this.visibleItemsStyle.transform =
            'translateY(' + this.itemPos[start] + 'px)'
      this.start = start
      this.end = end

      if (this.intoView) {
        this.scrollIntoView(this.intoView)
        this.intoView = null
      }
    },

    scrollIntoView (key) {
      // find it
      let index = -1
      for (let i = this.start; i < this.end; i++) {
        if (this.items[i].key === key) {
          index = i
          break
        }
      }
      if (index < 0) {
        return
      }

      // where is the bottom
      let item = this.items[index]
      let itemBottom = this.itemPos[index] + this.getItemHeight(item)
      let area = this.getVisibleArea()
      let d = itemBottom - area.bottom
      if (d <= 0) {
        return
      }

      // scroll.
      this.targetScrollTop = this.$el.scrollTop + d
      this.expectedScrollTop = this.$el.scrollTop
      let inc = Math.round(d / (250 / 16.7))
      let scrollFunc = () => {
        if (this.$el &&
            this.$el.scrollTop === this.expectedScrollTop &&
            this.$el.scrollTop < this.targetScrollTop) {
          this.expectedScrollTop = this.$el.scrollTop + inc
          if (this.expectedScrollTop > this.targetScrollTop) {
            this.expectedScrollTop = this.targetScrollTop
          }
          this.$el.scrollTop = this.expectedScrollTop
          requestAnimationFrame(scrollFunc)
        }
      }
      scrollFunc()
    }
  }
}
</script>

<style lang="scss">
.virtual-scroll__container {
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  margin-left: auto;
  margin-right: auto;
}
.virtual-scroll__items {
  box-sizing: border-box;
  width: 100%;
}
.virtual-scroll__visible-items {
  box-sizing: border-box;
}
.virtual-scroll__item {
}
</style>
