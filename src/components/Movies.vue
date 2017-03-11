<template>
<div id="movies" class="movies__container" v-resize @resize="resizeEvent()">
  <virtual-scroll class="movies__main"
    :items="items"
    :renderers="renderers"
    :style="{width: componentWidth + 'px'}"
    v-model="focus"
    ref="vs"/>
</div>
</template>

<script>
import { mapState } from 'vuex'

import VirtualScroll from './VirtualScroll'
import PosterRow from './PosterRow'
import PosterRowHeader from './PosterRowHeader'
import MovieInfo from './MovieInfo'

import { joinpath } from '../lib/util'
import debounce from 'lodash.debounce'

let psizes = [
  { hdrHeight: 40, width: 100, imgHeight: 150 },
  { hdrHeight: 60, width: 133, imgHeight: 200 },
  { hdrHeight: 60, width: 180, imgHeight: 270 }
]

// hardcoded in PosterRow.vue
const marginSize = 5
const infoHeight = 20

export default {
  name: 'movies',
  components: {
    VirtualScroll
  },

  props: {
    collection: String,
    sort: String,
    search: String,
    genre: { type: Array, default: [] }
  },

  data: () => ({
    renderers: Object.freeze({
      'poster-row': {
        component: PosterRow,
        height: 230,
        context: {
          imgWidth: 133,
          imgHeight: 200
        }
      },
      'header': {
        component: PosterRowHeader,
        height: 100,
        context: {
          height: 100
        }
      },
      'movie-info': {
        component: MovieInfo,
        height: 400,
        context: {
          collection: this.collection,
          height: 400
        }
      }
    }),
    itemsPerRow: 1,
    items: [],
    focus: null,
    componentWidth: 500
  }),

  mounted () {
    this.generation = 1
    this.updateItemsPerRow()
    // console.log('movies mounted calling getMovies')
    this.api.getMovies(this.collection).then((movies) => {
      // console.log('getmovies promise callback, builditems')
      this.allMovies = movies
      movies = this.filterGenre(movies)
      this.sortedMovies = this.doSort(movies)
      this.buildItems()
    })
    // console.log('movies mounted called done')
  },

  created () {
    this.updatePosterSize(this.posterSize)
    this.allMovies = []
    this.sortedMovies = []
    this.debouncedSearch = debounce(this.doSearch, 250)
  },

  computed: mapState([ 'api', 'apiURL', 'posterSize', 'movieInfo' ]),

  watch: {
    movieInfo (mi) {
      if (mi) {
        this.focus = {
          key: mi.rowKey,
          offset: mi.rowOffset,
          intoView: 'mi_' + this.generation
        }
      } else {
        this.focus = null
      }
      this.buildItems(true)
    },
    posterSize (sz) {
      // console.log('adjusting poster size to', sz)
      this.updatePosterSize(sz)
      this.resize()
    },
    sort () {
      let movies = this.filterGenre(this.allMovies)
      movies = this.filterSearch(movies)
      this.sortedMovies = this.doSort(movies)
      this.buildItems()
    },
    genre () {
      let movies = this.filterGenre(this.allMovies)
      movies = this.filterSearch(movies)
      this.sortedMovies = this.doSort(movies)
      this.buildItems()
    },
    search () {
      this.debouncedSearch()
    }
  },

  methods: {
    doSearch () {
      let movies = this.filterGenre(this.allMovies)
      movies = this.filterSearch(movies)
      this.sortedMovies = this.doSort(movies)
      this.buildItems()
    },

    updateItemsPerRow () {
      let c = this.renderers['poster-row'].context
      let doubleMargin = 2 * marginSize
      let w = c.imgWidth + doubleMargin
      this.itemsPerRow = Math.floor((this.$el.clientWidth - doubleMargin) / w)
      if (this.itemsPerRow <= 0) {
        this.itemsPerRow = 1
      }
      this.componentWidth = this.itemsPerRow * w + this.$store.state.scrollbarWidth
    },

    updatePosterSize (sz) {
      // console.log('componentWidth is now', this.componentWidth)
      this.renderers['header'].height = psizes[sz].hdrHeight
      this.renderers['header'].context.height = psizes[sz].hdrHeight

      this.renderers['movie-info'].context.collection = this.collection
      this.renderers['movie-info'].context.imgWidth = psizes[sz].width
      this.renderers['movie-info'].context.imgHeight = psizes[sz].imgHeight

      this.renderers['poster-row'].height = psizes[sz].imgHeight +
                                       2 * marginSize + infoHeight
      this.renderers['poster-row'].context.imgWidth = psizes[sz].width
      this.renderers['poster-row'].context.imgHeight = psizes[sz].imgHeight
    },

    resizeEvent () {
      if (!this.$store.state.videoPlaying) {
        this.resize()
      }
    },

    resize () {
      let ipr = this.ItemsPerRow
      this.updateItemsPerRow()
      if (ipr !== this.itemsPerRow) {
        this.buildItems()
      }
    },

    buildItems (justUpdate) {
      let items = []
      let movies = this.sortedMovies
      let header = null
      let lastHeader = null
      let ipr = this.itemsPerRow
      let hdrCount = 1
      let rowCount = 1

      if (!justUpdate) {
        this.generation++
      }
      let rowPrefix = 'kr_' + this.generation + '_'
      let hdrPrefix = 'kh_' + this.generation + '_'

      for (let i = 0; i < movies.length;) {
        let subitems = []
        let movieinfo
        for (let j = 0; j < ipr && i < movies.length; i++, j++) {
          let m = movies[i]

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

          if (this.movieInfo && m.name === this.movieInfo.name) {
            // console.log('Movies: buildItems: movieInfo', m)
            movieinfo = this.movieInfo
          }
        }
        if (subitems.length) {
          items.push({
            type: 'poster-row',
            items: subitems,
            key: rowPrefix + rowCount++
          })
        }

        if (movieinfo) {
          items.push({
            type: 'movie-info',
            items: movieinfo,
            key: 'mi_' + this.generation
          })
        }

        if (header !== lastHeader) {
          items.push({
            type: 'header',
            items: { name: header },
            key: hdrPrefix + hdrCount++
          })
          lastHeader = header
        }
      }
      this.items = items
    },

    filterGenre (movies) {
      if (this.genre.length > 0) {
        let res = []
        for (let i = 0; i < movies.length; i++) {
          let m = movies[i]
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
        movies = res
      }
      return movies
    },

    filterSearch (movies) {
      let res = []
      if (this.search.length >= 3) {
        let search = this.search.toLowerCase()
        for (let i = 0; i < movies.length; i++) {
          let name = movies[i].name.toLowerCase()
          if (name.indexOf(search) >= 0) {
            res.push(movies[i])
          }
        }
        movies = res
      }
      return movies
    },

    sortByName (movies) {
      for (let m in movies) {
        let n = movies[m].name.toLowerCase()
        if (n.substring(0, 4) === 'the ') {
          n = n.substring(4)
        }
        movies[m].sortName = n
        movies[m].header = this.firstLetter(n).toUpperCase()
      }
      movies.sort((a, b) => {
        let aa = a.sortName
        let bb = b.sortName
        return aa < bb ? -1 : (aa > bb ? 1 : 0)
      })
      return movies
    },

    sortByYear (movies) {
      // set sortName and header
      for (let m in movies) {
        let n = movies[m].name.toLowerCase()
        if (n.substring(0, 4) === 'the ') {
          n = n.substring(4)
        }
        movies[m].sortName = n
        movies[m].header = movies[m].year + ''
      }

      // group by decade
      let lim = Math.max(20, movies.length / 16)
      let dec = {}
      for (let m in movies) {
        let y = 10 * Math.floor(movies[m].year / 10)
        dec[y] = dec[y] || []
        dec[y].push(movies[m])
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
      movies.sort((a, b) => {
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

      return movies
    },

    sortByRating (movies) {
      for (let m in movies) {
        let stars = []
        for (let i = 0; i < 5; i++) {
          let s = '<span style="color: yellow">'
          for (let j = 0; j <= i; j++) {
            s += '★'
          }
          s += '</span>'
          stars[i] = s
        }
        let r = movies[m].rating
        if (!r || r < 1) {
          movies[m].stars = 0
          movies[m].header = 'No rating'
        } else {
          let n = Math.round(r / 2)
          if (n > 5) {
            n = 5
          }
          movies[m].stars = n
          movies[m].header = stars[n - 1]
        }
      }
      let aa, bb
      movies.sort((a, b) => {
        if (a.stars !== b.stars) {
          aa = a.stars
          bb = b.stars
        } else {
          aa = a.rating || 0
          bb = b.rating || 0
        }
        return aa < bb ? 1 : (aa > bb ? -1 : 0)
      })
      return movies
    },

    sortByAdded (movies) {
      return this.sortByDate(movies, 'firstvideo')
    },

    sortByUpdated (movies) {
      return this.sortByDate(movies, 'lastvideo')
    },

    sortByDate (movies, field) {
      let now = Date.now()
      for (let m of movies) {
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
      movies.sort((a, b) => {
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
      return movies
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

    doSort (movies) {
      switch (this.sort) {
        case 'name':
          movies = this.sortByName(movies)
          break
        case 'added':
          movies = this.sortByAdded(movies)
          break
        case 'updated':
          movies = this.sortByUpdated(movies)
          break
        case 'rating':
          movies = this.sortByRating(movies)
          break
        case 'year':
        default:
          movies = this.sortByYear(movies)
          break
      }
      return movies
    }
  }
}
</script>

<style lang="scss">
.movies__main {
  display: flex;
  position: relative;
  height: 100%;
  width: 100%;
}
.movies__container {
  position: relative;
  margin-left: auto;
  margin-right: auto;
}
</style>
