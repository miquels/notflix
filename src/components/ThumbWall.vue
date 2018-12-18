/*
 * ThumbWall	Generic component to show a collage of thumbnails.
 *
 * Props:	o renderers: a hash of renderers for:
 *		- row: a row of thumbnail images
 *		- header: a common header for a set of rows
 *		- panel: a panel that, if active, is shown below a row.
 *		o items: an ordered list of items to render: headers, rows, panel.
 *		o thumbSize: thumb size index (0, 1, 2 ..)
 *		o scrollbarWidth: what it says
 */
<template>
<div id="thumbwall" class="thumbwall__container" v-resize @resize="resizeEvent()">
  <virtual-scroll class="thumbwall__main"
    :items="scrollItems"
    :renderers="scrollRenderers"
    :style="{width: componentWidth + 'px'}"
    v-model="focus"
    ref="vs"/>
</div>
</template>

<script>
import debounce from 'lodash.debounce'
import { joinpath } from '../lib/util'
import { mapState } from 'vuex'
import VirtualScroll from './VirtualScroll'

export default {
  name: 'thumb-wall',
  components: {
    VirtualScroll
  },

  props: {
    renderers: Object,
    items: Array,
    thumbSize: { type: Number, default: 1 },
    scrollbarWidth: { type: Number, default: 0 },
    genre: { type: Array, default: () => [] },
    search: { type: String, default: '' },
    sort: { type: String, default: '' }
  },

  data: () => ({
    scrollRenderers: {},
    scrollItems: [],
    rowItemCount: 1,
    componentWidth: 500,
    focus: null
  }),

  computed: mapState([ 'api', 'apiURL', 'thumbSize', 'panel' ]),

  created () {
    this.debouncedSearch = debounce(this.rebuildScrollItems, 250)
    this.updateItemSize(this.thumbSize)
    this.rebuildScrollItems()
  },

  mounted () {
    this.generation = 1
    this.updateRowItemCount()
    this.buildScrollItems()
  },

  watch: {
    items () {
      console.log('ThumbWall: items changed')
      this.rebuildScrollItems()
    },

    thumbSize (sz) {
      console.log('adjusting thumb size to', sz)
      this.updateItemSize(sz)
      this.resize()
    },

    panel (pn) {
      if (pn) {
        this.focus = {
          key: pn.rowKey,
          offset: pn.rowOffset,
          intoView: 'pn_' + this.generation
        }
      } else {
        this.focus = null
      }
      this.buildScrollItems(true)
    },

    sort () {
      this.rebuildScrollItems()
    },

    genre () {
      this.rebuildScrollItems()
    },

    search () {
      this.debouncedSearch()
    }
  },

  methods: {
    updateRowItemCount () {
      let row = this.scrollRenderers.row
      console.log('updateRowItemCount: row', row)
      this.rowItemCount = Math.floor(this.$el.clientWidth / row.itemWidth)
      if (this.rowItemCount <= 0) {
        this.rowItemCount = 1
      }
      this.componentWidth = this.rowItemCount * row.itemWidth + this.scrollbarWidth
    },

    updateItemSize (sz) {
      console.log('updateItemSize', sz)
      let renderers = {}
      for (let i in this.renderers) {
        renderers[i] = Object.assign({}, this.renderers[i])
        console.log('renderers[i]', i, renderers[i])
        for (let j in renderers[i]) {
          console.log('renderers[i][j]:', renderers[i][j])
          if (renderers[i][j] instanceof Array) {
            renderers[i][j] = this.renderers[i][j][sz]
          }
        }
      }
      console.log('renderers: ', renderers)
      this.scrollRenderers = Object.freeze(renderers)
    },

    resizeEvent () {
      if (!this.$store.state.videoFullscreen) {
        console.log('Movies: resizing..')
        this.resize()
      }
    },

    resize () {
      let c = this.rowItemCount
      this.updateRowItemCount()
      if (c !== this.rowItemCount) {
        this.buildScrollItems()
      }
    },

    rebuildScrollItems () {
      console.log('rebuildScrollItems start')
      let items = this.items.slice()
      items = this.filterGenre(items)
      items = this.filterSearch(items)
      this.sortedScrollItems = this.doSort(items)
      // console.log('this.rebuildScrollItems: sortedScrollItems', this.sortedScrollItems)
      this.buildScrollItems()
    },

    buildScrollItems (justUpdate) {
      let scrollItems = []
      let items = this.sortedScrollItems
      let header = null
      let lastHeader = null
      let ipr = this.rowItemCount
      let hdrCount = 1
      let rowCount = 1

      if (!justUpdate) {
        this.generation++
      }
      let rowPrefix = 'kr_' + this.generation + '_'
      let hdrPrefix = 'kh_' + this.generation + '_'

      let count = 0
      for (let i = 0; i < items.length;) {
        if (count++ > 10000) {
          console.log('buildScrollItems: infinite loop!')
          break
        }
        let subitems = []
        let panel
        for (let j = 0; j < ipr && i < items.length; i++, j++) {
          let m = items[i]

          header = m.header || null
          if (header !== lastHeader) {
            break
          }

          let name = m.name
          if (this.type === 'movie') {
            name = name.replace(/ \([0-9]+\)$/, '')
          }
          let url = joinpath(this.apiURL, m.baseurl, m.path, m.poster)
          subitems.push({ m: m, name: name, url: url, index: i })

          if (this.panel && m.name === this.panel.name) {
            // console.log('ThumbWall: buildScrollItems: panel', m)
            panel = this.panel
          }
        }
        if (subitems.length) {
          scrollItems.push({
            type: 'row',
            items: subitems,
            key: rowPrefix + rowCount++
          })
        }

        if (panel) {
          scrollItems.push({
            type: 'panel',
            items: panel,
            key: 'pn_' + this.generation
          })
        }

        if (header !== lastHeader) {
          scrollItems.push({
            type: 'header',
            items: { name: header },
            key: hdrPrefix + hdrCount++
          })
          lastHeader = header
        }
      }
      this.scrollItems = scrollItems
    },

    filterGenre (items) {
      // console.log('filterGenre items genre', items, this.genre)
      if (this.genre && this.genre.length > 0) {
        let res = []
        for (let i = 0; i < items.length; i++) {
          let m = items[i]
          let match
          for (let g in this.genre) {
            match = false
            for (let g2 in m.genre) {
              if (m.genre[g2].toLowerCase() === this.genre[g]) {
                match = true
                break
              }
            }
            if (match === false) {
              break
            }
          }
          if (match) {
            res.push(m)
          }
        }
        items = res
      }
      return items
    },

    filterSearch (items) {
      let res = []
      if (this.search.length >= 3) {
        let search = this.search.toLowerCase()
        for (let i = 0; i < items.length; i++) {
          let name = items[i].name.toLowerCase()
          if (name.indexOf(search) >= 0) {
            res.push(items[i])
          }
        }
        items = res
      }
      return items
    },

    sortByName (items) {
      for (let m in items) {
        let n = items[m].name.toLowerCase()
        if (n.substring(0, 4) === 'the ') {
          n = n.substring(4)
        }
        items[m].sortName = n
        items[m].header = this.firstLetter(n).toUpperCase()
      }
      items.sort((a, b) => {
        let aa = a.sortName
        let bb = b.sortName
        return aa < bb ? -1 : (aa > bb ? 1 : 0)
      })
      return items
    },

    sortByStudio (items) {
      // set sortName and header
      for (let m in items) {
        let n = items[m].studio.toLowerCase()
        items[m].sortName = n
        items[m].header = items[m].studio + ''
      }

      // sort on header || sortName
      items.sort((a, b) => {
        let aa, bb
        if (a.header !== b.header) {
          bb = a.header
          aa = b.header
        } else {
          aa = a.sortName
          bb = b.sortName
        }
        return aa < bb ? -1 : (aa > bb ? 1 : 0)
      })

      return items
    },

    sortByYear (items) {
      // set sortName and header
      for (let m in items) {
        let n = items[m].name.toLowerCase()
        if (n.substring(0, 4) === 'the ') {
          n = n.substring(4)
        }
        items[m].sortName = n
        items[m].header = items[m].year + ''
      }

      // group by decade
      let lim = Math.max(20, items.length / 16)
      let dec = {}
      for (let m in items) {
        let y = 10 * Math.floor(items[m].year / 10)
        dec[y] = dec[y] || []
        dec[y].push(items[m])
      }
      for (let d in dec) {
        let x = dec[d]
        if (x.length < lim) {
          let h = 10 * Math.floor(x[0].year / 10) + 's'
          for (let i in dec[d]) {
            x[i].header = h
          }
        }
      }

      // sort on header || sortName
      items.sort((a, b) => {
        let aa, bb
        if (a.header !== b.header) {
          bb = a.header
          aa = b.header
        } else {
          aa = a.sortName
          bb = b.sortName
        }
        return aa < bb ? -1 : (aa > bb ? 1 : 0)
      })

      return items
    },

    sortByRating (items) {
      for (let m in items) {
        let stars = []
        for (let i = 0; i < 5; i++) {
          let s = '<span style="color: yellow">'
          for (let j = 0; j <= i; j++) {
            s += '★'
          }
          s += '</span>'
          stars[i] = s
        }
        let r = items[m].rating
        if (!r || r < 1) {
          items[m].stars = 0
          items[m].header = 'No rating'
        } else {
          let n = Math.round(r / 2)
          if (n > 5) {
            n = 5
          }
          items[m].stars = n
          items[m].header = stars[n - 1]
        }
      }
      let aa, bb
      items.sort((a, b) => {
        if (a.stars !== b.stars) {
          aa = a.stars
          bb = b.stars
        } else {
          aa = a.rating || 0
          bb = b.rating || 0
        }
        return aa < bb ? 1 : (aa > bb ? -1 : 0)
      })
      return items
    },

    sortByAdded (items) {
      return this.sortByDate(items, 'firstvideo')
    },

    sortByUpdated (items) {
      return this.sortByDate(items, 'lastvideo')
    },

    sortByDate (items, field) {
      let now = Date.now()
      for (let m of items) {
        let d = m[field]
        if (d > now - (86400 * 1 * 1000)) {
          m.header = 'Last 24 hours'
          m.sortIndex = 1
        } else if (d > now - (86400 * 2 * 1000)) {
          m.header = 'Last two days'
          m.sortIndex = 2
        } else if (d > now - (86400 * 7 * 1000)) {
          m.header = 'Last week'
          m.sortIndex = 3
        } else if (d > now - (86400 * 30 * 1000)) {
          m.header = 'Last month'
          m.sortIndex = 4
        } else if (d > now - (86400 * 90 * 1000)) {
          m.header = 'Last 3 months'
          m.sortIndex = 5
        } else if (d > now - (86400 * 365 * 1000)) {
          m.header = 'Last 12 months'
          m.sortIndex = 6
        } else {
          m.header = 'Older'
          m.sortIndex = 7
        }
      }
      items.sort((a, b) => {
        let aa, bb
        if (a.sortIndex !== b.sortIndex) {
          aa = a.sortIndex
          bb = b.sortIndex
        } else {
          aa = b[field]
          bb = a[field]
        }
        return aa < bb ? -1 : (aa > bb ? 1 : 0)
      })
      return items
    },

    firstLetter (s) {
      if (s[0] < 'a') {
        return '#'
      }
      if (s[0] < 'z') {
        return s[0]
      }
      return 'z'
    },

    doSort (items) {
      switch (this.sort) {
        case 'name':
          items = this.sortByName(items)
          break
        case 'added':
          items = this.sortByAdded(items)
          break
        case 'updated':
          items = this.sortByUpdated(items)
          break
        case 'rating':
          items = this.sortByRating(items)
          break
        case 'studio':
          items = this.sortByStudio(items)
          break
        case 'year':
        default:
          items = this.sortByYear(items)
          break
      }
      return items
    }
  }
}
</script>

<style lang="scss">
.thumbwall__main {
  display: flex;
  position: relative;
  height: 100%;
  width: 100%;
}
.thumbwall__container {
  position: relative;
  margin-left: auto;
  margin-right: auto;
}
</style>
